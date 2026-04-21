import init, { process_raw_data, get_width, get_height } from '../../wasm-processor/pkg/wasm_processor.js';

self.onmessage = async (e: MessageEvent) => {
  try {
    const { buffer } = e.data;
    
    // Initialize WASM module
    await init();
    
    // Convert ArrayBuffer to Uint8Array for Rust
    const uint8Array = new Uint8Array(buffer);
    
    // Process RAW data (returns linear RGB/RGBA data)
    const resultPixels = process_raw_data(uint8Array);
    
    // Example: get width and height from the module
    const width = get_width();
    const height = get_height();
    
    // Return data to main thread
    self.postMessage({
      success: true,
      pixels: resultPixels,
      width,
      height
    });
    
  } catch (err: any) {
    self.postMessage({
      success: false,
      error: err.toString()
    });
  }
};