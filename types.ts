
export interface PrintSize {
  dpi: number;
  widthCm: number;
  heightCm: number;
}

export interface ColorInfo {
  colorModel?: string;
  colorSpace?: string;
  profileName?: string;
  bitDepth?: number;
  width?: number;
  height?: number;
  orientation?: number;
}

export interface ExifInfo {
  aperture?: number;
  brightness?: number;
  exposureTime?: number;
  iso?: number;
  focalLength?: number;
  focalLength35?: number;
  make?: string;
  model?: string;
  lensModel?: string;
  lensMake?: string;
  whiteBalance?: number | string;
  flash?: number | string;
  meteringMode?: number | string;
  software?: string;
  exifVersion?: string;
  exposureProgram?: number | string;
  exposureCompensation?: number;
  customRendering?: number | string;
  shutterSpeed?: number;
  subjectArea?: number[];
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;
}

export interface GpsInfo {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  altitudeRef?: number;
  gpsDateStamp?: string;
  gpsTimeStamp?: string;
  imgDirection?: number;
  imgDirectionRef?: string;
  destDirection?: number;
  destDirectionRef?: string;
  speed?: number;
  speedRef?: string;
}

export interface TiffInfo {
  compression?: number | string;
  dateTime?: string;
  xResolution?: number;
  yResolution?: number;
  resolutionUnit?: number;
  orientation?: number;
  make?: string;
  model?: string;
  software?: string;
  photometricInterpretation?: number | string;
  width?: number;
  height?: number;
}

export interface DngInfo {
  analogBalance?: number[];
  asShotNeutral?: number[];
  colorMatrix1?: number[];
  colorMatrix2?: number[];
  cameraCalibration1?: number[];
  cameraCalibration2?: number[];
  baselineExposure?: number;
  baselineSharpness?: number;
  blackLevel?: number | number[];
  dngVersion?: number[];
  dngBackwardVersion?: number[];
  dngOutVersion?: string;
  noiseProfile?: number[];
  noiseReductionApplied?: number;
  calibrationIlluminant1?: number;
  calibrationIlluminant2?: number;
  defaultBlackRender?: number | string;
  whiteLevel?: number;
  uniqueCameraModel?: string;
  imageWidth?: number;
  imageLength?: number;
}

export interface MediaMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  lastModified: number;
  width?: number;
  height?: number;
  duration?: number;
  totalBitrate?: number;
  mediaBitrate?: number;
  sampleRate?: number;
  channels?: number;
  aspectRatio?: string;
  previewUrl?: string;
  // 追加項目
  uncompressedSize?: number; // bytes
  compressionRatio?: number; // percentage
  standardLabel?: string; // e.g., "4K", "Full HD"
  printSizes?: PrintSize[];
  storageOneHour?: number; // bytes
  colorInfo?: ColorInfo;
  exif?: ExifInfo;
  gps?: GpsInfo;
  tiff?: TiffInfo;
  dng?: DngInfo;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
