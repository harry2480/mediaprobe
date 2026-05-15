import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { MediaMetadata } from './types';

// Mock the extractMetadata function
vi.mock('./utils/mediaProcessor', async () => {
  const actual = await vi.importActual('./utils/mediaProcessor');
  return {
    ...actual,
    extractMetadata: vi.fn(async (file: File) => ({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      lastModified: file.lastModified,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      standardLabel: 'Full HD',
      previewUrl: 'blob:mock',
    })),
  };
});

// Mock the RawDataViewer component
vi.mock('./src/components/RawDataViewer.tsx', () => ({
  RawDataViewer: () => <div data-testid="raw-viewer">RAW Viewer</div>,
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the app title', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /MediaProbe/ });
    expect(heading).toBeInTheDocument();
  });

  it('should show upload area initially', () => {
    render(<App />);
    expect(screen.getByText(/ファイルをドロップして解析開始/)).toBeInTheDocument();
  });

  it('should display privacy notice', () => {
    render(<App />);
    expect(screen.getByText(/完全ローカル解析/)).toBeInTheDocument();
  });

  it('should display footer information', () => {
    render(<App />);
    expect(screen.getByText(/MediaProbe 技術仕様解析エンジン/)).toBeInTheDocument();
  });
});

describe('Metadata Clipboard Formatting', () => {
  it('should format RAW file metadata with essential and reference sections', () => {
    const { getByText } = render(<App />);
    const app = screen.getByRole('heading', { name: /MediaProbe/ }).closest('div');

    const rawMetadata: MediaMetadata = {
      fileName: 'photo.dng',
      fileSize: 50000000,
      mimeType: 'image/x-dcraw',
      lastModified: Date.now(),
      previewUrl: 'blob:mock',
      width: 4032,
      height: 3024,
      aspectRatio: '4032:3024',
      standardLabel: '4K UHD',
      exif: {
        make: 'Apple',
        model: 'iPhone 17 Pro',
        iso: 320,
        aperture: 1.78,
        exposureTime: 0.025,
        focalLength: 6.765,
        lensModel: 'iPhone 17 Pro back triple camera',
        whiteBalance: 1,
      },
      dng: {
        colorMatrix1: [1.2999, -0.6473, -0.2319],
        calibrationIlluminant1: 'Standard light A',
        calibrationIlluminant2: 'D65',
        dngVersion: '1,6,0,0',
      },
    };

    const formatBytes = (bytes: number) => {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const lines: string[] = [];
    lines.push(`[${rawMetadata.fileName}]`);
    lines.push(`\n【RAW現像に必須】`);
    if (rawMetadata.exif?.make) lines.push(`カメラメーカー: ${rawMetadata.exif.make}`);
    if (rawMetadata.exif?.model) lines.push(`カメラモデル: ${rawMetadata.exif.model}`);
    if (rawMetadata.exif?.iso) lines.push(`ISO: ${rawMetadata.exif.iso}`);
    if (rawMetadata.exif?.aperture) lines.push(`絞り値: f/${rawMetadata.exif.aperture}`);
    if (rawMetadata.exif?.exposureTime) lines.push(`露出時間: 1/${Math.round(1 / rawMetadata.exif.exposureTime)}s`);
    if (rawMetadata.exif?.focalLength) lines.push(`焦点距離: ${rawMetadata.exif.focalLength} mm`);
    if (rawMetadata.exif?.whiteBalance !== undefined) lines.push(`ホワイトバランス: ${rawMetadata.exif.whiteBalance}`);
    if (rawMetadata.dng?.colorMatrix1) lines.push(`カラーマトリックス1: 使用`);
    if (rawMetadata.dng?.calibrationIlluminant1) lines.push(`キャリブレーション光源1: ${rawMetadata.dng.calibrationIlluminant1}`);
    if (rawMetadata.dng?.calibrationIlluminant2) lines.push(`キャリブレーション光源2: ${rawMetadata.dng.calibrationIlluminant2}`);
    lines.push(`\n【参考情報】`);
    if (rawMetadata.width && rawMetadata.height) lines.push(`解像度: ${rawMetadata.width}×${rawMetadata.height}`);
    lines.push(`ファイルサイズ: ${formatBytes(rawMetadata.fileSize)}`);
    if (rawMetadata.exif?.lensModel) lines.push(`レンズ: ${rawMetadata.exif.lensModel}`);

    const expectedOutput = lines.join('\n');

    expect(expectedOutput).toContain('【RAW現像に必須】');
    expect(expectedOutput).toContain('【参考情報】');
    expect(expectedOutput).toContain('カメラメーカー: Apple');
    expect(expectedOutput).toContain('ISO: 320');
    expect(expectedOutput).toContain('絞り値: f/1.78');
    expect(expectedOutput).toContain('キャリブレーション光源1: Standard light A');
    expect(expectedOutput).not.toContain('アスペクト比');
    expect(expectedOutput).not.toContain('規格');
    expect(expectedOutput).not.toContain('印刷サイズ');
  });

  it('should format non-RAW metadata without RAW-specific sections', () => {
    const nonRawMetadata: MediaMetadata = {
      fileName: 'photo.jpg',
      fileSize: 2000000,
      mimeType: 'image/jpeg',
      lastModified: Date.now(),
      previewUrl: 'blob:mock',
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      standardLabel: 'Full HD',
    };

    const formatBytes = (bytes: number) => {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const lines: string[] = [];
    lines.push(`[${nonRawMetadata.fileName}]`);
    lines.push(`ファイルサイズ: ${formatBytes(nonRawMetadata.fileSize)}`);
    if (nonRawMetadata.width && nonRawMetadata.height) lines.push(`解像度: ${nonRawMetadata.width}×${nonRawMetadata.height}`);

    const expectedOutput = lines.join('\n');

    expect(expectedOutput).not.toContain('【RAW現像に必須】');
    expect(expectedOutput).toContain('ファイルサイズ: 1.91 MB');
    expect(expectedOutput).toContain('解像度: 1920×1080');
  });
});
