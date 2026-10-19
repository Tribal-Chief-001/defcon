// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStatus } from '../../src/ui/status';
import { ExportButton } from '../../src/ui/war/ExportButton';

const mocks = vi.hoisted(() => ({ downloadText: vi.fn() }));
vi.mock('../../src/exports/download', () => ({ downloadText: mocks.downloadText }));

afterEach(() => {
  cleanup();
  mocks.downloadText.mockReset();
  useStatus.setState({ message: '' });
});

describe('ExportButton', () => {
  it('has a name that says what it downloads, builds the CSV only when clicked and announces the download', () => {
    mocks.downloadText.mockReturnValue(true);
    const build = vi.fn(() => 'a,b\n');
    render(<ExportButton label="conflicts" filename="defcon-conflicts-2026-08-31.csv" build={build} />);
    expect(build).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV: conflicts' }));
    expect(build).toHaveBeenCalledTimes(1);
    expect(mocks.downloadText).toHaveBeenCalledWith('defcon-conflicts-2026-08-31.csv', 'a,b\n');
    expect(useStatus.getState().message).toBe('Downloaded defcon-conflicts-2026-08-31.csv');
  });
  it('says so when the browser cannot download, and when building fails', () => {
    mocks.downloadText.mockReturnValue(false);
    render(<ExportButton label="x" filename="f.csv" build={() => 'a'} />);
    fireEvent.click(screen.getByRole('button'));
    expect(useStatus.getState().message).toMatch(/not available/i);
    cleanup();
    render(<ExportButton label="x" filename="f.csv" build={() => { throw new Error('boom'); }} />);
    fireEvent.click(screen.getByRole('button'));
    expect(useStatus.getState().message).toMatch(/could not/i);
  });
});
