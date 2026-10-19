// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStatus } from '../../src/ui/status';
import { ShareButton } from '../../src/ui/ShareButton';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useStatus.setState({ message: '' });
});

describe('ShareButton', () => {
  it('copies the link built at click time and announces it', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    let n = 0;
    render(<ShareButton url={() => `https://x.test/#c=IND&t=${++n}`} />);
    fireEvent.click(screen.getByRole('button', { name: /share this view/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://x.test/#c=IND&t=1'));
    expect(useStatus.getState().message).toMatch(/link copied/i);
  });
  it('falls back to the share sheet, and then to telling the person to copy the address', async () => {
    const share = vi.fn(async () => {});
    vi.stubGlobal('navigator', { share, clipboard: { writeText: async () => Promise.reject(new Error('denied')) } });
    render(<ShareButton url={() => 'https://x.test/'} />);
    fireEvent.click(screen.getByRole('button', { name: /share this view/i }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ url: 'https://x.test/' }));
    cleanup();
    vi.stubGlobal('navigator', {});
    render(<ShareButton url={() => 'https://x.test/'} />);
    fireEvent.click(screen.getByRole('button', { name: /share this view/i }));
    await waitFor(() => expect(useStatus.getState().message).toMatch(/copy the address/i));
  });
});
