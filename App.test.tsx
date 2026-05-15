import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

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
