import React, { useRef, useState, useEffect } from 'react';
import exifr from 'exifr';

interface Props {
  file: File | null;
}

interface PixelData {
  pixels: Uint8Array;
  width: number;
  height: number;
}

export const RawDataViewer: React.FC<Props> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pixelData, setPixelData] = useState<PixelData | null>(null);
  const [gamma, setGamma] = useState(1.0);
  const disposedRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setPixelData(null);
      return;
    }

    disposedRef.current = false;
    let worker: Worker | null = null;

    setPreviewUrl(null);
    setPixelData(null);

    const extractPreview = async () => {
      try {
        const thumbnailBuffer = await exifr.thumbnail(file);
        if (disposedRef.current) return;
        if (thumbnailBuffer) {
          const blob = new Blob([thumbnailBuffer], { type: 'image/jpeg' });
          setPreviewUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.warn('Failed to extract JPEG thumbnail:', err);
      }
    };
    extractPreview();

    const processFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const buffer = await file.arrayBuffer();

        worker = new Worker(new URL('../workers/rawWorker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
          if (disposedRef.current) return;

          if (e.data.success) {
            setPixelData({ pixels: e.data.pixels, width: e.data.width, height: e.data.height });
          } else {
            console.error('WASM Worker error details:', e.data.error);
            setError(
              `このRAWファイルの処理に対応していません。embedded JPEG プレビューのみを表示します。\n詳細: ${e.data.error}`
            );
          }
          setLoading(false);
        };

        worker.onerror = (e) => {
          if (disposedRef.current) return;
          console.error('Worker throw an uncaught exception:', e.message);
          setError('このファイル形式の処理中にエラーが発生しました。現像未対応の可能性があります。簡易プレビューのみを表示します。');
          setLoading(false);
        };

        worker.postMessage({ buffer }, [buffer]);
      } catch (err: any) {
        if (disposedRef.current) return;
        setError('Error reading file: ' + err.message);
        setLoading(false);
      }
    };

    processFile();

    return () => {
      disposedRef.current = true;
      if (worker) worker.terminate();
    };
  }, [file]);

  // canvas が DOM に存在する状態で pixelData または gamma が変化したときに描画する
  useEffect(() => {
    if (!pixelData || !canvasRef.current) return;

    const { pixels, width, height } = pixelData;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255.0;
      const g = pixels[i + 1] / 255.0;
      const b = pixels[i + 2] / 255.0;
      imageData.data[i]     = Math.max(0, Math.min(255, Math.pow(r, 1.0 / gamma) * 255));
      imageData.data[i + 1] = Math.max(0, Math.min(255, Math.pow(g, 1.0 / gamma) * 255));
      imageData.data[i + 2] = Math.max(0, Math.min(255, Math.pow(b, 1.0 / gamma) * 255));
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, [pixelData, gamma]);

  if (!file) {
    return <div className="p-4 border border-dashed rounded text-center">No RAW file selected</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-xl font-bold">RAW Preview & Analysis</h3>

      {error && <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 text-yellow-700">{error}</div>}

      {/* Fast JPEG Preview Section (Fallback or Loading) */}
      {(loading || error) && previewUrl && (
        <div className="flex flex-col items-center p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">Exif Preview</p>
          <img src={previewUrl} alt="RAW Fast Preview" className="max-w-full h-auto shadow-sm" />
          {loading && <p className="text-blue-500 animate-pulse mt-4">Processing full RAW data in WebAssembly...</p>}
        </div>
      )}

      {loading && !previewUrl && <p className="text-blue-500 animate-pulse">Processing RAW data in WebAssembly...</p>}

      {error && !previewUrl && <p className="text-red-500">表示できるプレビューがありません。</p>}

      {/* WASM デコード後の RAW 描画 */}
      {!loading && !error && pixelData && (
        <div className="flex flex-col items-center p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">Full RAW Data ({pixelData.width}x{pixelData.height})</p>
          <canvas ref={canvasRef} className="max-w-full h-auto shadow-md bg-transparent" />
          <div className="mt-4 flex flex-col w-full max-w-md">
            <label className="mb-2 font-medium">Gamma Correction: {gamma.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
