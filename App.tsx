
import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Settings, 
  Activity, 
  Zap,
  AlertCircle,
  Clock,
  HardDrive,
  Maximize2,
  Info,
  Printer,
  Database,
  ShieldCheck,
  Lock,
  Music
} from 'lucide-react';
import { AnalysisStatus } from './types.ts';
import type { MediaMetadata } from './types.ts';
import { extractMetadata, formatBytes, formatDuration } from './utils/mediaProcessor.ts';
import InfoGrid from './components/InfoGrid.tsx';

const App: React.FC = () => {
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (selectedFile: File) => {
    setError(null);
    setMetadata(null);
    setStatus(AnalysisStatus.EXTRACTING);

    try {
      const meta = await extractMetadata(selectedFile);
      setMetadata(meta);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err) {
      console.error(err);
      setError("解析に失敗しました。ファイル形式が非対応か、読み込み中にエラーが発生しました。");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const reset = () => {
    if (metadata?.previewUrl) URL.revokeObjectURL(metadata.previewUrl);
    setMetadata(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
  };

  const formatBitrate = (bps?: number) => bps ? `${(bps / 1000).toFixed(2)} kbps` : 'N/A';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-zinc-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Activity size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MediaProbe <span className="text-zinc-500 font-normal">技術解析</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 hidden sm:flex">
            <Lock size={12} className="text-green-500" />
            <span className="text-[10px] font-bold text-green-500 uppercase">完全ローカル解析 (プライバシー保護)</span>
          </div>
          {status !== AnalysisStatus.IDLE && (
            <button onClick={reset} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-full transition-all border border-zinc-700">
              別のファイルを解析
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {status === AnalysisStatus.IDLE && (
          <div className="h-[70vh] flex flex-col items-center justify-center space-y-12">
            <div className="text-center space-y-4 max-w-xl animate-in fade-in slide-in-from-top-4">
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent leading-tight">
                メディアを精密に<br/>プロファイリング
              </h2>
              <p className="text-zinc-400 text-lg">
                ビットレート、解像度、圧縮率、想定印刷サイズ。<br/>
                容量制限なし。100%デバイス上で動作する高速解析ツール。
              </p>
            </div>
            
            <label 
              className={`w-full max-w-3xl group cursor-pointer`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <div className={`relative border-2 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center gap-6 transition-all duration-500 
                ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.02] rotate-1' : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40'} `}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500
                  ${isDragging ? 'bg-blue-600 border-blue-400 rotate-12 scale-110 shadow-xl shadow-blue-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-zinc-200'}`}>
                  <Upload size={32} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-zinc-200 font-bold text-xl">ファイルをドロップして解析開始</p>
                  <p className="text-zinc-500 font-mono text-xs">動画 / 音声 / 写真 / 各種技術フォーマット</p>
                </div>
                <div className="mt-4 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700/50 flex items-center gap-2">
                  <Info size={14} className="text-blue-400" />
                  <span className="text-[11px] text-zinc-400 font-medium">ブラウザ内処理のため、容量制限はありません。アップロードは行われません。</span>
                </div>
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
              </div>
            </label>
          </div>
        )}

        {status === AnalysisStatus.EXTRACTING && (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">技術仕様を精密スキャン中...</p>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-[2rem] flex flex-col items-center gap-4 max-w-lg mx-auto text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"><AlertCircle size={24}/></div>
            <h4 className="font-bold text-xl text-white">解析エラー</h4>
            <p className="text-red-400/80 text-sm leading-relaxed">{error}</p>
            <button onClick={reset} className="mt-4 bg-zinc-800 px-6 py-2 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors">再試行</button>
          </div>
        )}

        {metadata && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 pb-12">
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              {/* Preview Box */}
              <div className="lg:col-span-5 bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden relative shadow-2xl">
                {metadata.mimeType.startsWith('image/') ? (
                  <img src={metadata.previewUrl} alt="preview" className="w-full h-full object-contain bg-zinc-950 min-h-[300px]" />
                ) : metadata.mimeType.startsWith('video/') ? (
                  <video src={metadata.previewUrl} className="w-full h-full object-contain bg-zinc-950 min-h-[300px]" controls muted />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[300px]">
                    <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500"><Music size={40}/></div>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">音声ペイロードのみ</p>
                  </div>
                )}
                {metadata.standardLabel && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-tighter">
                    規格: {metadata.standardLabel}
                  </div>
                )}
              </div>

              {/* Basic Info Box */}
              <div className="lg:col-span-7 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-zinc-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-zinc-700 uppercase">{metadata.mimeType}</span>
                    <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest"><ShieldCheck size={14}/> 高精度データ抽出完了</span>
                  </div>
                  <h2 className="text-3xl font-black truncate leading-tight tracking-tight">{metadata.fileName}</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><HardDrive size={12}/> ファイルサイズ</p>
                    <p className="text-xl font-black font-mono">{formatBytes(metadata.fileSize)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><Maximize2 size={12}/> 解像度</p>
                    <p className="text-xl font-black font-mono">{metadata.width ? `${metadata.width}×${metadata.height}` : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><Clock size={12}/> 再生時間</p>
                    <p className="text-xl font-black font-mono">{metadata.duration ? formatDuration(metadata.duration) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <Settings size={14} className="text-blue-500"/> 詳細テクニカルプロファイリング
                </h3>
                <div className="flex-1 h-[1px] bg-zinc-800/50"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2"><Zap size={14}/> データ密度と圧縮効率</p>
                      <h4 className="text-lg font-bold text-zinc-200">圧縮効率分析</h4>
                    </div>
                    {metadata.compressionRatio && (
                       <div className="text-right">
                         <p className="text-2xl font-black text-blue-500">{metadata.compressionRatio.toFixed(1)}%</p>
                         <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">RAWサイズ比率</p>
                       </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-2xl">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">推定非圧縮サイズ</p>
                      <p className="text-lg font-mono font-bold text-zinc-300">{formatBytes(metadata.uncompressedSize || 0)}</p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-4 rounded-2xl">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">推定メディアビットレート</p>
                      <p className="text-lg font-mono font-bold text-zinc-300">{formatBitrate(metadata.mediaBitrate)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6 flex flex-col justify-between">
                   {metadata.printSizes ? (
                     <>
                       <div className="space-y-1">
                         <p className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2"><Printer size={14}/> 印刷仕様</p>
                         <h4 className="text-lg font-bold">印刷サイズ推定</h4>
                       </div>
                       <div className="space-y-3 pt-4">
                         {metadata.printSizes.map(p => (
                           <div key={p.dpi} className="flex justify-between items-center text-xs">
                             <span className="text-zinc-500 font-bold">{p.dpi} DPI</span>
                             <span className="font-mono text-zinc-200 font-bold">{p.widthCm.toFixed(1)} x {p.heightCm.toFixed(1)} cm</span>
                           </div>
                         ))}
                       </div>
                     </>
                   ) : metadata.storageOneHour ? (
                     <>
                       <div className="space-y-1">
                         <p className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2"><Database size={14}/> ストレージ要件</p>
                         <h4 className="text-lg font-bold">1時間あたりの占有量</h4>
                       </div>
                       <div className="pt-4">
                         <p className="text-3xl font-black text-blue-500 font-mono tracking-tighter">
                           {formatBytes(metadata.storageOneHour)}
                         </p>
                         <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                           このビットレートで収録した場合の推定ストレージ使用量です。
                         </p>
                       </div>
                     </>
                   ) : (
                     <div className="h-full flex items-center justify-center">
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest italic">追加の技術指標なし</p>
                     </div>
                   )}
                </div>
              </div>

              <InfoGrid items={[
                { label: 'アスペクト比', value: metadata.aspectRatio, icon: <Maximize2 size={18}/> },
                { label: 'サンプリング周波数', value: metadata.sampleRate ? `${(metadata.sampleRate / 1000).toFixed(1)} kHz` : 'N/A', icon: <Activity size={18}/> },
                { label: 'チャンネル数', value: metadata.channels ? `${metadata.channels} ch` : 'N/A', icon: <Settings size={18}/> },
              ]} />
            </section>

            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4 max-w-2xl">
                <span className="text-blue-500 shrink-0 mt-1"><Info size={18}/></span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="text-zinc-200 font-bold">プロのヒント:</span> 
                  {metadata.mimeType.startsWith('image/') 
                    ? " 圧縮率が5%を下回る場合、高度な効率化コーデック（WebP/AVIF等）または大きな情報欠損が発生している可能性があります。"
                    : " コンテナの構造（MP4/MOV等）によって総ビットレートと実効ビットレートには僅かな差が生じます。"}
                </p>
              </div>
              <div className="shrink-0 font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                技術解析エンジン / セキュアモード（オフライン対応）
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-zinc-600 text-[10px] font-mono tracking-tight uppercase">MediaProbe 技術仕様解析エンジン © 2024</p>
          <div className="w-[1px] h-3 bg-zinc-800"></div>
          <p className="text-zinc-600 text-[10px] font-mono tracking-tight uppercase">高精度メディアプロファイラー</p>
        </div>
        <p className="text-zinc-700 text-[10px] font-mono uppercase tracking-widest">映像資産管理・品質管理向けツール</p>
      </footer>
    </div>
  );
};

export default App;
