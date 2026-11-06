import type { Port, Project } from './types';
const port = (
  id: string,
  name: string,
  kind: Port['kind'],
  centerX: number,
  width: number,
  top: number,
  bottom: number,
  preset: Port['preset'],
  mirrorId?: string,
): Port => ({ id, name, kind, centerX, width, top, bottom, preset, mirrorId });
export function createProject(): Project {
  const c = Math.PI * 63,
    center = c / 2;
  return {
    version: 1,
    engine: { bore: 63, stroke: 57, rod: 105, rpm: 8000 },
    sleeve: { height: 75, wall: 2 },
    targets: { exhaust: 0.00014, transfer: 0.00009 },
    ports: [
      port('ex', 'EX Main', 'exhaust', center, 35, 30, 57, 'rounded'),
      port('aux-l', 'EX Aux L', 'exhaust', center - 30, 16, 31, 44, 'roof', 'aux-r'),
      port('aux-r', 'EX Aux R', 'exhaust', center + 30, 16, 31, 44, 'roof', 'aux-l'),
      port('tr-l', 'Transfer L1', 'transfer', center - 51, 20, 44, 57, 'roof', 'tr-r'),
      port('tr-r', 'Transfer R1', 'transfer', center + 51, 20, 44, 57, 'roof', 'tr-l'),
      port('tr2-l', 'Transfer L2', 'transfer', center - 75, 18, 45, 57, 'rectangle', 'tr2-r'),
      port('tr2-r', 'Transfer R2', 'transfer', center + 75, 18, 45, 57, 'rectangle', 'tr2-l'),
      port('boost', 'Boost', 'boost', 5, 8, 45, 57, 'roof'),
    ],
  };
}
