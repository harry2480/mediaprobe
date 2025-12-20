
export interface PrintSize {
  dpi: number;
  widthCm: number;
  heightCm: number;
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
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
