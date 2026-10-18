// Tokens for "only the newest request may update the UI" (a slow response must not overwrite a newer selection).
export function createLatest() {
  let n = 0;
  return { next: () => ++n, isLatest: (token: number) => token === n };
}
