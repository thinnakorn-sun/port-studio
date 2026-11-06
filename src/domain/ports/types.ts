/** All dimensions are millimetres; normalized shape points are in [0, 1]. */
export type Point = readonly [number, number];
export type PortKind = 'exhaust' | 'transfer' | 'boost';
export type PortPreset = 'rounded' | 'roof' | 'rectangle';
export interface Port {
  id: string;
  name: string;
  kind: PortKind;
  centerX: number;
  width: number;
  top: number;
  bottom: number;
  preset: PortPreset;
  points?: Point[];
  mirrorId?: string;
}
export interface Engine {
  bore: number;
  stroke: number;
  rod: number;
  rpm: number;
}
export interface Project {
  version: 1;
  engine: Engine;
  sleeve: { height: number; wall: number };
  targets: { exhaust: number; transfer: number };
  ports: Port[];
}
export interface AreaSample {
  angle: number;
  exhaust: number;
  transfer: number;
}
