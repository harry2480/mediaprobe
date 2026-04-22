import { render, screen } from '@testing-library/react';
import { RawDataViewer } from '../RawDataViewer';

describe('RawDataViewer', () => {
  it('renders a prompt when no file is selected', () => {
    render(<RawDataViewer file={null} />);
    expect(screen.getByText('No RAW file selected')).not.toBeNull();
  });

  // Example of testing with a mock file. In a real scenario, you'd mock the Worker logic too.
  it('shows processing message when a file is provided', () => {
    const mockFile = new File(['dummy binary'], 'test.raw', { type: 'image/x-raw' });
    render(<RawDataViewer file={mockFile} />);
    expect(screen.getByText(/RAW Preview & Analysis/i)).not.toBeNull();
    expect(screen.getByText(/Processing RAW data/i)).not.toBeNull();
  });
});