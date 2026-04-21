use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn process_raw_data(data: &[u8]) -> Result<js_sys::Uint8Array, JsValue> {
    // 実際の実装ではここで`image`や`rawler`等を用いてRAWデータを解析します。
    // このデモでは受け取ったバイト配列の一部を加工してピクセル配列として返します。
    if data.is_empty() {
        return Err(JsValue::from_str("Provided binary data is empty."));
    }

    // デモ: 仮の100x100の赤いリニア画像データを生成 (R, G, B, A)
    let width = 100;
    let height = 100;
    let mut pixels = vec![0u8; width * height * 4];

    for i in 0..(width * height) {
        let index = i * 4;
        pixels[index] = 255;     // R
        pixels[index + 1] = 0;   // G
        pixels[index + 2] = 0;   // B
        pixels[index + 3] = 255; // A
    }

    Ok(js_sys::Uint8Array::from(&pixels[..]))
}

#[wasm_bindgen]
pub fn get_width() -> u32 {
    100
}

#[wasm_bindgen]
pub fn get_height() -> u32 {
    100
}
