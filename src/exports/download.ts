import { safeFileName } from './csv';

// Saves text as a file in the browser (a Blob and a temporary link). A byte-order mark makes spreadsheets read the file as UTF-8.
// Returns false where object URLs are not available.
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8'): boolean {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFileName(filename);
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
  return true;
}
