// Fraction of the canvas to shift the globe (x: right, y: up) so the open dossier does not cover the dived country.
export const framingFor = (panelOpen: boolean, narrow: boolean): { x: number; y: number } =>
  !panelOpen ? { x: 0, y: 0 } : narrow ? { x: 0, y: 0.2 } : { x: 0.17, y: 0 };
