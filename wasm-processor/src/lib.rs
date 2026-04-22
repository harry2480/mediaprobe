use wasm_bindgen::prelude::*;
use rawloader::decode;

thread_local! {
    static IMAGE_DIMENSIONS: std::cell::RefCell<(u32, u32)> = std::cell::RefCell::new((0, 0));
}

#[wasm_bindgen]
pub fn process_raw_data(data: &[u8]) -> Result<js_sys::Uint8Array, JsValue> {
    // パニック時にブラウザコンソールにRustのスタックトレースを出力する
    console_error_panic_hook::set_once();

    if data.is_empty() {
        return Err(JsValue::from_str("Provided binary data is empty."));
    }

    web_sys::console::log_1(&JsValue::from_str(&format!("RAW decode started for array of size: {} bytes", data.len())));

    // DNG で LJPEG 精度10を使用している場合は事前チェック
    // rawloader が対応していない形式のため、早期に適切なエラーメッセージを返す
    if is_unsupported_ljpeg_dng(data) {
        let err_msg = "このDNGファイルはLJPEG圧縮で精度10を使用しており、現在未対応です。\
                       LJPEG非圧縮のDNG、またはJPEG2000圧縮のDNGをご使用ください。";
        web_sys::console::log_1(&JsValue::from_str(&format!("Early detection: {}", err_msg)));
        return Err(JsValue::from_str(err_msg));
    }

    // rawloaderを使用して本物のRAW画像をパース (パニックを安全にキャッチ)
    let image_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        decode(&mut std::io::Cursor::new(data))
    }));

    let image = match image_result {
        Ok(Ok(img)) => {
            web_sys::console::log_1(&JsValue::from_str("RAW successfully parsed."));
            img
        },
        Ok(Err(e)) => {
            let err_msg = format!("Failed to decode RAW data: {}", e);
            web_sys::console::log_1(&JsValue::from_str(&err_msg));
            return Err(JsValue::from_str(&err_msg));
        },
        Err(_) => {
            let err_msg = "RAW decode panicked. Unsupported format (e.g. 10-bit LJPEG DNG).";
            web_sys::console::log_1(&JsValue::from_str(err_msg));
            return Err(JsValue::from_str(err_msg));
        }
    };

    let width = image.width as u32;
    let height = image.height as u32;
    
    // サブサンプリング（間引き）によるメモリ最適化
    // 最大表示解像度を1920px程度に制限し、WASMのOOMを回避する
    const MAX_DIM: u32 = 1920;
    // 切り上げ除算で step を算出し、new_width/new_height が MAX_DIM を超えないようにする
    let step = std::cmp::max(
        1,
        std::cmp::max(
            (width + MAX_DIM - 1) / MAX_DIM,
            (height + MAX_DIM - 1) / MAX_DIM,
        ),
    );
    
    let new_width = width / step;
    let new_height = height / step;
    
    web_sys::console::log_1(&JsValue::from_str(&format!(
        "Original size: {}x{}, Step: {}, New size: {}x{}",
        width, height, step, new_width, new_height
    )));

    // IMAGE_DIMENSIONSに保存（フロントのCanvas描画時のサイズとして使用）
    IMAGE_DIMENSIONS.with(|dims| {
        *dims.borrow_mut() = (new_width, new_height);
    });

    let alloc_size = (new_width * new_height * 4) as usize;
    web_sys::console::log_1(&JsValue::from_str(&format!("Allocating {} bytes for pixels...", alloc_size)));
    
    // 縮小後の画素数分だけメモリを確保（巨大配列を避ける）
    let mut pixels = vec![0u8; alloc_size];
    
    web_sys::console::log_1(&JsValue::from_str("Processing linear data..."));
    
    // 簡易的にRAWのリニアデータを描画にマッピング
    match image.data {
        rawloader::RawImageData::Integer(ref linear_data) => {
            // 正規化のための最大値を算出
            let mut max_val = 1u16;
            let sample_stride = std::cmp::max(1, linear_data.len() / 10000);
            for &val in linear_data.iter().step_by(sample_stride).take(10000) {
                 if val > max_val { max_val = val; }
            }
            if max_val < 255 { max_val = 255; }

            // 本番画像のピクセルをステップ幅で間引いて抽出
            for y in 0..new_height {
                for x in 0..new_width {
                    let orig_x = x * step;
                    let orig_y = y * step;
                    let orig_idx = (orig_y * width + orig_x) as usize;
                    
                    if orig_idx < linear_data.len() {
                        let val = linear_data[orig_idx] as f32;
                        let pixel_val = ((val / max_val as f32) * 255.0).min(255.0) as u8;
                        
                        let dst_idx = (y * new_width + x) as usize * 4;
                        pixels[dst_idx] = pixel_val;     // R
                        pixels[dst_idx + 1] = pixel_val; // G
                        pixels[dst_idx + 2] = pixel_val; // B
                        pixels[dst_idx + 3] = 255;       // A
                    }
                }
            }
        }
        rawloader::RawImageData::Float(ref linear_data) => {
            // Float形式（一部のDNG等）の処理
            let mut max_val = 0.001f32;
            let sample_stride = std::cmp::max(1, linear_data.len() / 10000);
            for &val in linear_data.iter().step_by(sample_stride).take(10000) {
                 if val > max_val { max_val = val; }
            }
            // Floatデータの場合、通常0.0-1.0に収まる事が多いので下限を1.0としておく
            if max_val < 1.0 { max_val = 1.0; }

            // 本番画像のピクセルをステップ幅で間引いて抽出
            for y in 0..new_height {
                for x in 0..new_width {
                    let orig_x = x * step;
                    let orig_y = y * step;
                    let orig_idx = (orig_y * width + orig_x) as usize;
                    
                    if orig_idx < linear_data.len() {
                        let val = linear_data[orig_idx];
                        let pixel_val = ((val / max_val) * 255.0).min(255.0) as u8;
                        
                        let dst_idx = (y * new_width + x) as usize * 4;
                        pixels[dst_idx] = pixel_val;     // R
                        pixels[dst_idx + 1] = pixel_val; // G
                        pixels[dst_idx + 2] = pixel_val; // B
                        pixels[dst_idx + 3] = 255;       // A
                    }
                }
            }
        }
    }

    web_sys::console::log_1(&JsValue::from_str("Completed pixel processing, transferring memory to JS..."));
    Ok(js_sys::Uint8Array::from(&pixels[..]))
}

#[wasm_bindgen]
pub fn get_width() -> u32 {
    IMAGE_DIMENSIONS.with(|dims| dims.borrow().0)
}

#[wasm_bindgen]
pub fn get_height() -> u32 {
    IMAGE_DIMENSIONS.with(|dims| dims.borrow().1)
}

// DNG で LJPEG 精度10を使用しているかをチェック（簡易実装）
fn is_unsupported_ljpeg_dng(data: &[u8]) -> bool {
    if data.len() < 8 {
        return false;
    }

    // TIFF ヘッダ判定（DNG は TIFF ベース）
    // リトルエンディアン (0x49 0x49) または ビッグエンディアン (0x4D 0x4D)
    let is_tiff = (data[0] == 0x49 && data[1] == 0x49) || (data[0] == 0x4D && data[1] == 0x4D);

    if !is_tiff {
        return false;
    }

    // バイナリ内に LJPEG 精度10 に関連する特定のバイトパターンを検出
    // "ljpeg" 文字列または LJPEG 関連のエラーメッセージが含まれていないか確認
    let data_str = String::from_utf8_lossy(data);

    // rawloader の LJPEG パーサが失敗する典型的なパターン
    if data_str.contains("precision 10") || data_str.contains("sof.precision 10") {
        return true;
    }

    // さらに詳細：TIFF タグを解析して Compression == 7 (LJPEG) かつ
    // ImageBitDepth や関連タグで精度情報が10と判明した場合
    // （完全な実装は複雑なため、ここでは簡易版）

    false
}
