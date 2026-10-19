// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadText } from '../../src/exports/download';

const saved = { c: URL.createObjectURL, r: URL.revokeObjectURL };
afterEach(() => {
  vi.restoreAllMocks();
  URL.createObjectURL = saved.c;
  URL.revokeObjectURL = saved.r;
});

describe('downloadText', () => {
  it('builds a Blob with a byte-order mark (so spreadsheets read UTF-8), clicks a temporary link named safely and revokes the URL', async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), 'blob:x'));
    URL.revokeObjectURL = vi.fn();
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(`${this.download}|${this.href}|${this.rel}`);
    });
    expect(downloadText('a b/c.csv', 'é,1\n')).toBe(true);
    expect(clicks).toEqual(['a-b-c.csv|blob:x|noopener']);
    expect(blob!.type).toMatch(/text\/csv/);
    const bytes = await new Promise<Uint8Array>((res) => {
      const r = new FileReader();
      r.onload = () => res(new Uint8Array(r.result as ArrayBuffer));
      r.readAsArrayBuffer(blob!);
    });
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // the UTF-8 byte-order mark
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('é,1\n');
    await new Promise((r) => setTimeout(r, 5));
    expect(document.querySelector('a[download]')).toBeNull(); // the link is removed again
  });
  it('returns false instead of throwing where object URLs are not available', () => {
    (URL as unknown as { createObjectURL?: unknown }).createObjectURL = undefined;
    expect(downloadText('x.csv', 'a')).toBe(false);
  });
});
