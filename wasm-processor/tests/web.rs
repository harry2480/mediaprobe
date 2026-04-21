#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use wasm_processor::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_process_empty_data() {
    let empty_data = vec![];
    let result = process_raw_data(&empty_data);
    assert!(result.is_err(), "Empty data should return error");
}

#[wasm_bindgen_test]
fn test_process_valid_data() {
    let dummy_data = vec![1, 2, 3, 4]; // valid input
    let result = process_raw_data(&dummy_data);
    assert!(result.is_ok(), "Valid data should return linear array");
}
