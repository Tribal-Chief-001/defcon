// Fraction of the canvas to shift the globe (x: right, y: up) so an open panel does not cover what it is about: the dossier sits on the
// left (the globe moves right), the War room is docked on the right (the globe moves left) or is a bottom sheet on a narrow screen.
export const framingFor = (panelOpen: boolean, narrow: boolean, war = false): { x: number; y: number } =>
  war ? (narrow ? { x: 0, y: 0.22 } : { x: -0.2, y: 0 }) : !panelOpen ? { x: 0, y: 0 } : narrow ? { x: 0, y: 0.2 } : { x: 0.17, y: 0 };
