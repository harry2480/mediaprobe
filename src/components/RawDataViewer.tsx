import React, { useRef, useState, useEffect } from 'react';

interface Props {
  file: File | null;
}

export const RawDataViewer: React.FC<Props> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disposedRef = useRef(false);

  // Gamma adjustment logic
  const [gamma, setGamma] = useState(1.0);
  const originalPixels = useRef<Uint8Array | null>(null);
  const imageDim = useRef<{width: number, height: number} | null>(null);

  useEffect(() => {
    if (!file) return;

    disposedRef.current = false;
    let worker: Worker | null = null;

    const processFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const buffer = await file.arrayBuffer();

        // Use a web worker to parse raw data using WASM
        worker = new Worker(new URL('../workers/rawWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
          if (disposedRef.current) return;

          if (e.data.success) {
            originalPixels.current = e.data.pixels;
            imageDim.current = { width: e.data.width, height: e.data.height };
            renderCanvas(e.data.pixels, e.data.width, e.data.height, gamma);
          } else {
            setError(e.data.error || 'Failed to process RAW data.');
          }
          setLoading(false);
        };

        worker.onerror = (e) => {
          if (disposedRef.current) return;
          setError('Worker error: ' + e.message);
          setLoading(false);
        };

        // Send binary data to the worker with Transferable buffer
        worker.postMessage({ buffer }, [buffer]);
      } catch (err: any) {
        if (disposedRef.current) return;
        setError('Error reading file: ' + err.message);
        setLoading(false);
      }
    };

    processFile();

    // Cleanup on unmount or file change
    return () => {
      disposedRef.current = true;
      if (worker) {
        worker.terminate();
      }
    };
  }, [file]);

  const renderCanvas = (pixels: Uint8Array, width: number, height: number, currentGamma: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);

    // Apply gamma before rendering
    // Usually raw linear data is decoded to 12-14 bit, we simulated with 8-bit in rust.
    // We'll just do a standard gamma correction for demo purposes
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255.0;
      const g = pixels[i + 1] / 255.0;
      const b = pixels[i + 2] / 255.0;

      imageData.data[i] = Math.max(0, Math.min(255, Math.pow(r, 1.0 / currentGamma) * 255));
      imageData.data[i + 1] = Math.max(0, Math.min(255, Math.pow(g, 1.0 / currentGamma) * 255));
      imageData.data[i + 2] = Math.max(0, Math.min(255, Math.pow(b, 1.0 / currentGamma) * 255));
      imageData.data[i + 3] = 255; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleGammaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGamma = parseFloat(e.target.value);
    setGamma(newGamma);
    if (originalPixels.current && imageDim.current) {
      renderCanvas(originalPixels.current, imageDim.current.width, imageDim.current.height, newGamma);
    }
  };

  if (!file) {
    return <div className="p-4 border border-dashed rounded text-center">No RAW file selected</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-xl font-bold">RAW Linear Data Viewer (WASM)</h3>
      {loading && <p className="text-blue-500 animate-pulse">Processing RAW data in WebAssembly...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="flex flex-col items-center p-4 border rounded bg-gray-50">
          <canvas ref={canvasRef} className="max-w-full h-auto shadow-md bg-transparent" />
          <div className="mt-4 flex flex-col w-full max-w-md">
            <label className="mb-2 font-medium">Gamma Correction: {gamma.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={gamma}
              onChange={handleGammaChange}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};