export function hasWebGL2(
  makeCanvas: () => { getContext(id: string): unknown } = () => document.createElement('canvas'),
): boolean {
  try {
    return !!makeCanvas().getContext('webgl2');
  } catch {
    return false;
  }
}
