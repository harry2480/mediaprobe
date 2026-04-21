use wasm_bindgen::prelude::*;

thread_local! {
    static IMAGE_DIMENSIONS: std::cell::RefCell<(u32, u32)> = std::cell::RefCell::new((0, 0));
}

#[wasm_bindgen]
pub fn process_raw_data(data: &[u8]) -> Result<js_sys::Uint8Array, JsValue> {
    if data.is_empty() {
        return Err(JsValue::from_str("Provided binary data is empty."));
    }

    // Detect RAW dimensions from file size
    // Common RAW sizes: 12-bit or 16-bit per pixel
    let (width, height, bit_depth) = detect_raw_dimensions(data.len());

    // Decode raw data to RGBA
    let pixels = decode_raw_to_rgba(data, width as usize, height as usize, bit_depth)?;

    IMAGE_DIMENSIONS.with(|dims| {
        *dims.borrow_mut() = (width, height);
    });

    Ok(js_sys::Uint8Array::from(&pixels[..]))
}

fn detect_raw_dimensions(data_len: usize) -> (u32, u32, u32) {
    // Try common RAW formats
    // Format: width x height x channels x bytes_per_sample

    // 12MP: 4000 x 3000 x 1 x 2 bytes = 24,000,000
    if data_len >= 24_000_000 && data_len < 25_000_000 {
        return (4000, 3000, 16);
    }

    // 16MP: 4608 x 3456 x 1 x 2 bytes = 31,850,496
    if data_len >= 31_000_000 && data_len < 33_000_000 {
        return (4608, 3456, 16);
    }

    // 24MP: 6000 x 4000 x 1 x 2 bytes = 48,000,000
    if data_len >= 47_000_000 && data_len < 49_000_000 {
        return (6000, 4000, 16);
    }

    // Fallback: square approximation for 16-bit linear data
    let pixels = ((data_len / 2) as f64).sqrt() as u32;
    (pixels, pixels, 16)
}

fn decode_raw_to_rgba(data: &[u8], width: usize, height: usize, bit_depth: u32) -> Result<Vec<u8>, JsValue> {
    let expected_size = if bit_depth == 16 {
        width * height * 2
    } else {
        width * height
    };

    if data.len() < expected_size {
        return Err(JsValue::from_str("Insufficient data for RAW image dimensions"));
    }

    let mut pixels = vec![0u8; width * height * 4];

    if bit_depth == 16 {
        // 16-bit linear data
        for i in 0..width * height {
            let byte_idx = i * 2;
            // Little-endian 16-bit sample
            let sample_16 = u16::from_le_bytes([data[byte_idx], data[byte_idx + 1]]);
            // Convert 16-bit to 8-bit
            let sample_8 = (sample_16 >> 8) as u8;

            let pixel_idx = i * 4;
            pixels[pixel_idx] = sample_8;         // R
            pixels[pixel_idx + 1] = sample_8;     // G
            pixels[pixel_idx + 2] = sample_8;     // B
            pixels[pixel_idx + 3] = 255;          // A
        }
    } else if bit_depth == 12 {
        // 12-bit packed data (3 bytes = 2 samples)
        let mut sample_idx = 0;
        let mut byte_idx = 0;

        while sample_idx < width * height && byte_idx + 2 < data.len() {
            // Extract 12-bit samples from 3 bytes (24 bits)
            let b0 = data[byte_idx] as u16;
            let b1 = data[byte_idx + 1] as u16;
            let b2 = data[byte_idx + 2] as u16;

            let sample1 = ((b0 << 4) | (b1 >> 4)) & 0xFFF;
            let sample2 = ((b1 << 8) | b2) & 0xFFF;

            for &sample_12 in &[sample1, sample2] {
                if sample_idx >= width * height {
                    break;
                }
                let sample_8 = (sample_12 >> 4) as u8;
                let pixel_idx = sample_idx * 4;
                pixels[pixel_idx] = sample_8;
                pixels[pixel_idx + 1] = sample_8;
                pixels[pixel_idx + 2] = sample_8;
                pixels[pixel_idx + 3] = 255;
                sample_idx += 1;
            }
            byte_idx += 3;
        }
    } else {
        // 8-bit fallback
        for i in 0..width.min(data.len()) * height {
            if i >= data.len() {
                break;
            }
            let sample_8 = data[i];
            let pixel_idx = i * 4;
            pixels[pixel_idx] = sample_8;
            pixels[pixel_idx + 1] = sample_8;
            pixels[pixel_idx + 2] = sample_8;
            pixels[pixel_idx + 3] = 255;
        }
    }

    Ok(pixels)
}

#[wasm_bindgen]
pub fn get_width() -> u32 {
    IMAGE_DIMENSIONS.with(|dims| dims.borrow().0)
}

#[wasm_bindgen]
pub fn get_height() -> u32 {
    IMAGE_DIMENSIONS.with(|dims| dims.borrow().1)
}
