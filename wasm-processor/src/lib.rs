use wasm_bindgen::prelude::*;
use rawloader::decode;

thread_local! {
    static IMAGE_DIMENSIONS: std::cell::RefCell<(u32, u32)> = std::cell::RefCell::new((0, 0));
}

#[wasm_bindgen]
pub fn process_raw_data(data: &[u8]) -> Result<js_sys::Uint8Array, JsValue> {
    if data.is_empty() {
        return Err(JsValue::from_str("Provided binary data is empty."));
    }

    // rawloaderを使用して本物のRAW画像をパース
    let image = match decode(&mut std::io::Cursor::new(data)) {
        Ok(img) => img,
        Err(e) => {
            let err_msg = format!("Failed to decode RAW data: {}", e);
            return Err(JsValue::from_str(&err_msg));
        }
    };

    let width = image.width as u32;
    let height = image.height as u32;
    
    // IMAGE_DIMENSIONSに保存（JSからの取得用）
    IMAGE_DIMENSIONS.with(|dims| {
        *dims.borrow_mut() = (width, height);
    });

    let mut pixels = vec![0u8; (width * height * 4) as usize];
    
    // 簡易的にRAWのリニアデータを描画にマッピング
    match image.data {
        rawloader::RawImageData::Integer(ref linear_data) => {
            // 正規化のための最大値を算出
            let mut max_val = 1u16;
            for &val in linear_data.iter().take(10000) {
                 if val > max_val { max_val = val; }
            }
            if max_val < 255 { max_val = 255; }

            for i in 0..(width * height) as usize {
                if i < linear_data.len() {
                    let pixel_val = ((linear_data[i] as f32 / max_val as f32) * 255.0) as u8;
                    let index = i * 4;
                    pixels[index] = pixel_val;     // R
                    pixels[index + 1] = pixel_val; // G
                    pixels[index + 2] = pixel_val; // B
                    pixels[index + 3] = 255;       // A
                }
            }
        }
        rawloader::RawImageData::Float(ref linear_data) => {
            // Float形式（一部のDNG等）の処理
            let mut max_val = 0.001f32;
            for &val in linear_data.iter().take(10000) {
                 if val > max_val { max_val = val; }
            }
            // Floatデータの場合、通常0.0-1.0に収まる事が多いので下限を1.0としておく
            if max_val < 1.0 { max_val = 1.0; }

            for i in 0..(width * height) as usize {
                if i < linear_data.len() {
                    let pixel_val = ((linear_data[i] / max_val) * 255.0) as u8;
                    let index = i * 4;
                    pixels[index] = pixel_val;     // R
                    pixels[index + 1] = pixel_val; // G
                    pixels[index + 2] = pixel_val; // B
                    pixels[index + 3] = 255;       // A
                }
            }
        }
    }

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
