import type { Engine } from '../ports/types';
export const circumference = (bore: number) => Math.PI * bore;
export const displacement = ({ bore, stroke }: Engine) => (Math.PI * bore * bore * stroke) / 4000;
/** Slider-crank displacement from TDC; angle is in degrees. */
export function pistonPosition(angle: number, { stroke, rod }: Engine): number {
  const r = stroke / 2;
  const theta = (angle * Math.PI) / 180;
  return r * (1 - Math.cos(theta)) + rod - Math.sqrt(rod * rod - r * r * Math.sin(theta) ** 2);
}
/** Minor-arc conversion. Arc must not exceed half the circumference. */
export function arcToChord(arc: number, bore: number): number {
  if (arc < 0 || arc > (Math.PI * bore) / 2) throw new RangeError('Arc exceeds minor-arc range');
  return bore * Math.sin(arc / bore);
}
export function chordToArc(chord: number, bore: number): number {
  if (chord < 0 || chord > bore) throw new RangeError('Chord must be between zero and bore');
  return bore * Math.asin(chord / bore);
}
