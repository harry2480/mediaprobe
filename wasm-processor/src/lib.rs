use wasm_bindgen::prelude::*;
use std::io::Cursor;

thread_local! {
    static IMAGE_DIMENSIONS: std::cell::RefCell<(u32, u32)> = std::cell::RefCell::new((0, 0));
}

#[wasm_bindgen]
pub fn process_raw_data(data: &[u8]) -> Result<js_sys::Uint8Array, JsValue> {
    if data.is_empty() {
        return Err(JsValue::from_str("Provided binary data is empty."));
    }

    // Try to decode RAW data using rawler
    match decode_raw_with_rawler(data) {
        Ok((width, height, pixels)) => {
            IMAGE_DIMENSIONS.with(|dims| {
                *dims.borrow_mut() = (width as u32, height as u32);
            });
            Ok(js_sys::Uint8Array::from(&pixels[..]))
        }
        Err(_) => {
            // Fallback: if rawler fails, try a simpler approach or return error
            Err(JsValue::from_str("Failed to decode RAW data format."))
        }
    }
}

fn decode_raw_with_rawler(data: &[u8]) -> Result<(usize, usize, Vec<u8>), String> {
    // Use rawler to detect and decode RAW format
    let cursor = Cursor::new(data);

    match rawler::RawFile::new(cursor) {
        Ok(raw_file) => {
            let raw_decoder = raw_file.decoder();
            let image = raw_decoder.decode_to_image()
                .map_err(|e| format!("Decoder error: {}", e))?;

            let width = image.width as usize;
            let height = image.height as usize;

            // Convert decoded image to RGBA
            let mut pixels = vec![0u8; width * height * 4];

            // Get the 16-bit linear data and convert to 8-bit RGBA
            let raw_16bit = image.data;

            for (i, &pixel_16) in raw_16bit.iter().enumerate() {
                // Convert 16-bit to 8-bit by dividing by 256 (or right shift by 8 bits)
                let pixel_8 = (pixel_16 >> 8) as u8;

                // Distribute grayscale pixel across RGB channels
                let pixel_index = (i * 4);
                if pixel_index + 3 < pixels.len() {
                    pixels[pixel_index] = pixel_8;         // R
                    pixels[pixel_index + 1] = pixel_8;     // G
                    pixels[pixel_index + 2] = pixel_8;     // B
                    pixels[pixel_index + 3] = 255;         // A
                }
            }

            Ok((width, height, pixels))
        }
        Err(e) => {
            Err(format!("Failed to parse RAW file: {}", e))
        }
    }
}

#[wasm_bindgen]
pub fn get_width() -> u32 {
    IMAGE_DIMENSIONS.with(|dims| dims.borrow().0)
}

#[wasm_bindgen]
pub fn get_height() -> u32 {
    IMAGE_DIMENSIONS.with(|dims| dims.borrow().1)
}
