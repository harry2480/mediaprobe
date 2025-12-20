
import { MediaMetadata, PrintSize } from "../types.ts";

const getStandardLabel = (w: number, h: number): string | undefined => {
  const pixels = w * h;
  if (w >= 7680 || h >= 4320) return "8K UHD";
  if (w >= 3840 || h >= 2160) return "4K UHD";
  if (w >= 2560 || h >= 1440) return "QHD (2K)";
  if (w >= 1920 || h >= 1080) return "Full HD";
  if (w >= 1280 || h >= 720) return "HD";
  if (pixels >= 480000) return "SD";
  return undefined;
};

const calculatePrintSizes = (w: number, h: number): PrintSize[] => {
  const dpis = [72, 300];
  return dpis.map(dpi => ({
    dpi,
    widthCm: (w / dpi) * 2.54,
    heightCm: (h / dpi) * 2.54
  }));
};

const isImageFile = (file: File): boolean => {
  if (file.type.startsWith('image/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif', 'heif', 'heic', 'avif'].includes(ext || '');
};

const isVideoFile = (file: File): boolean => {
  if (file.type.startsWith('video/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext || '');
};

const isAudioFile = (file: File): boolean => {
  if (file.type.startsWith('audio/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || '');
};

async function probeAudioMetadata(file: File): Promise<{ sampleRate?: number; channels?: number }> {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.slice(0, 2 * 1024 * 1024).arrayBuffer();
    
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer).catch(async () => {
      if (file.size < 50 * 1024 * 1024) {
        const fullBuffer = await file.arrayBuffer();
        return await audioCtx.decodeAudioData(fullBuffer);
      }
      throw new Error("Decoding failed");
    });
    const result = { sampleRate: audioBuffer.sampleRate, channels: audioBuffer.numberOfChannels };
    await audioCtx.close();
    return result;
  } catch (e) {
    return {};
  }
}

export const extractMetadata = async (file: File): Promise<MediaMetadata> => {
  const baseMetadata: MediaMetadata = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
    previewUrl: URL.createObjectURL(file)
  };

  if (isVideoFile(file)) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = async () => {
        const duration = video.duration;
        const totalBitrate = (file.size * 8) / duration;
        const audioInfo = await probeAudioMetadata(file);
        const standardLabel = getStandardLabel(video.videoWidth, video.videoHeight);
        const uncompressedSize = video.videoWidth * video.videoHeight * 1.5 * 30 * duration; 

        resolve({
          ...baseMetadata,
          width: video.videoWidth,
          height: video.videoHeight,
          duration,
          totalBitrate,
          mediaBitrate: totalBitrate * 0.98,
          ...audioInfo,
          aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
          standardLabel,
          uncompressedSize,
          compressionRatio: (file.size / uncompressedSize) * 100,
          storageOneHour: (totalBitrate / 8) * 3600
        });
      };
      video.onerror = () => resolve(baseMetadata);
      video.src = baseMetadata.previewUrl!;
    });
  }

  if (isAudioFile(file)) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = async () => {
        const duration = audio.duration;
        const totalBitrate = (file.size * 8) / duration;
        const audioInfo = await probeAudioMetadata(file);
        resolve({
          ...baseMetadata,
          duration,
          totalBitrate,
          mediaBitrate: totalBitrate * 0.98,
          ...audioInfo
        });
      };
      audio.onerror = () => resolve(baseMetadata);
      audio.src = baseMetadata.previewUrl!;
    });
  }

  if (isImageFile(file)) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const standardLabel = getStandardLabel(img.width, img.height);
        const printSizes = calculatePrintSizes(img.width, img.height);
        const uncompressedSize = img.width * img.height * 4;

        resolve({
          ...baseMetadata,
          width: img.width,
          height: img.height,
          aspectRatio: `${img.width}:${img.height}`,
          standardLabel,
          printSizes,
          uncompressedSize,
          compressionRatio: (file.size / uncompressedSize) * 100
        });
      };
      img.onerror = () => resolve(baseMetadata);
      img.src = baseMetadata.previewUrl!;
    });
  }

  return baseMetadata;
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 
    ? [h, m, s].map(v => v < 10 ? '0' + v : v).join(':')
    : [m, s].map(v => v < 10 ? '0' + v : v).join(':');
};
