
import exifr from 'exifr';
import { MediaMetadata, PrintSize, ColorInfo, ExifInfo, GpsInfo, TiffInfo, DngInfo } from "../types.ts";

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
  return ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'heif', 'heic', 'avif', 'dng', 'cr2', 'cr3', 'arw', 'nef', 'nrw', 'raf', 'rw2', 'orf', 'srw', 'x3f'].includes(ext || '');
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

function hasAnyValue(obj: object): boolean {
  return Object.values(obj).some(v => v !== undefined && v !== null);
}

function mapExifOutput(raw: any, imgWidth?: number, imgHeight?: number): {
  colorInfo?: ColorInfo; exif?: ExifInfo; gps?: GpsInfo; tiff?: TiffInfo; dng?: DngInfo;
} {
  if (!raw) return {};
  const e = raw;
  const icc = raw.icc ?? {};
  const xmp = raw.xmp ?? {};

  const colorInfo: ColorInfo = {
    colorModel: icc.ColorSpaceData ?? xmp.ColorMode,
    colorSpace: icc.ProfileDescription ?? (e.ColorSpace === 1 ? 'sRGB' : e.ColorSpace != null ? String(e.ColorSpace) : undefined),
    profileName: icc.ProfileDescription,
    bitDepth: e.BitsPerSample ?? xmp.BitsPerSample,
    width: imgWidth,
    height: imgHeight,
    orientation: e.Orientation,
  };
  const exif: ExifInfo = {
    aperture: e.FNumber,
    brightness: e.BrightnessValue,
    exposureTime: e.ExposureTime,
    iso: e.ISO,
    focalLength: e.FocalLength,
    focalLength35: e.FocalLengthIn35mmFilm,
    make: e.Make,
    model: e.Model,
    lensModel: e.LensModel,
    lensMake: e.LensMake,
    whiteBalance: e.WhiteBalance,
    flash: e.Flash,
    meteringMode: e.MeteringMode,
    software: e.Software,
    exifVersion: e.ExifVersion,
    exposureProgram: e.ExposureProgram,
    exposureCompensation: e.ExposureBiasValue,
    customRendering: e.CustomRendering,
    shutterSpeed: e.ShutterSpeedValue,
    subjectArea: e.SubjectArea,
    dateTimeOriginal: e.DateTimeOriginal?.toString(),
    dateTimeDigitized: e.DateTimeDigitized?.toString(),
  };
  const gps: GpsInfo = {
    latitude: e.latitude ?? e.GPSLatitude,
    longitude: e.longitude ?? e.GPSLongitude,
    altitude: e.GPSAltitude,
    altitudeRef: e.GPSAltitudeRef,
    gpsDateStamp: e.GPSDateStamp,
    gpsTimeStamp: e.GPSTimeStamp ? (Array.isArray(e.GPSTimeStamp) ? e.GPSTimeStamp.map((n: number) => String(n).padStart(2,'0')).join(':') : String(e.GPSTimeStamp)) : undefined,
    imgDirection: e.GPSImgDirection,
    imgDirectionRef: e.GPSImgDirectionRef,
    destDirection: e.GPSDestBearing,
    destDirectionRef: e.GPSDestBearingRef,
    speed: e.GPSSpeed,
    speedRef: e.GPSSpeedRef,
  };
  const tiff: TiffInfo = {
    compression: e.Compression,
    dateTime: e.DateTimeOriginal?.toString() ?? e.DateTime?.toString(),
    xResolution: e.XResolution,
    yResolution: e.YResolution,
    resolutionUnit: e.ResolutionUnit,
    orientation: e.Orientation,
    make: e.Make,
    model: e.Model,
    software: e.Software,
    photometricInterpretation: e.PhotometricInterpretation,
  };
  const dng: DngInfo = {
    analogBalance: e.AnalogBalance,
    asShotNeutral: e.AsShotNeutral,
    colorMatrix1: e.ColorMatrix1,
    colorMatrix2: e.ColorMatrix2,
    cameraCalibration1: e.CameraCalibration1,
    cameraCalibration2: e.CameraCalibration2,
    baselineExposure: e.BaselineExposure,
    baselineSharpness: e.BaselineSharpness,
    blackLevel: e.BlackLevel,
    dngVersion: e.DNGVersion,
    dngBackwardVersion: e.DNGBackwardVersion,
    dngOutVersion: e.DNGOutVersion?.toString(),
    noiseProfile: e.NoiseProfile,
    noiseReductionApplied: e.NoiseReductionApplied,
    calibrationIlluminant1: e.CalibrationIlluminant1,
    calibrationIlluminant2: e.CalibrationIlluminant2,
    defaultBlackRender: e.DefaultBlackRender,
    whiteLevel: e.WhiteLevel,
    uniqueCameraModel: e.UniqueCameraModel,
  };

  const hasTiff = imgWidth !== undefined || imgHeight !== undefined || hasAnyValue(tiff);
  return {
    colorInfo: (imgWidth !== undefined || imgHeight !== undefined || hasAnyValue(colorInfo)) ? colorInfo : undefined,
    exif: hasAnyValue(exif) ? exif : undefined,
    gps: hasAnyValue(gps) ? gps : undefined,
    tiff: hasTiff ? tiff : undefined,
    dng: hasAnyValue(dng) ? dng : undefined,
  };
}

async function extractExifMetadata(file: File, imgWidth?: number, imgHeight?: number): Promise<{
  colorInfo?: ColorInfo; exif?: ExifInfo; gps?: GpsInfo; tiff?: TiffInfo; dng?: DngInfo;
}> {
  try {
    const raw = await exifr.parse(file, {
      tiff: true, exif: true, gps: true,
      icc: true, xmp: true,
      ifd1: false, iptc: false, jfif: false, ihdr: false,
      mergeOutput: false,
    });
    return mapExifOutput(raw, imgWidth, imgHeight);
  } catch {
    return {};
  }
}

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
      img.onload = async () => {
        const standardLabel = getStandardLabel(img.width, img.height);
        const printSizes = calculatePrintSizes(img.width, img.height);
        const uncompressedSize = img.width * img.height * 4;
        const exifData = await extractExifMetadata(file, img.width, img.height);

        resolve({
          ...baseMetadata,
          width: img.width,
          height: img.height,
          aspectRatio: `${img.width}:${img.height}`,
          standardLabel,
          printSizes,
          uncompressedSize,
          compressionRatio: (file.size / uncompressedSize) * 100,
          ...exifData,
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
