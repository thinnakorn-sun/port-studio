import { BufferGeometry, Float32BufferAttribute } from 'three';
import { containsPoint, portOutline } from '@/domain/ports/geometry';
import { circumference } from '@/domain/engine/kinematics';
import type { Project } from '@/domain/ports/types';
/** Preview mesh with actual openings, inner/outer walls, rims and port reveal walls.
 * Grid approximation: not a manufacturing/CAD representation. */
export function createSleeveGeometry(project: Project, columns = 220, rows = 110): BufferGeometry {
  const { bore } = project.engine,
    { wall, height } = project.sleeve,
    r = bore / 2,
    c = circumference(bore);
  const outlines = project.ports.map(portOutline);
  const solid = Array.from({ length: columns }, (_, i) =>
    Array.from(
      { length: rows },
      (_, j) =>
        !outlines.some((poly) =>
          containsPoint([((i + 0.5) / columns) * c, ((j + 0.5) / rows) * height], poly),
        ),
    ),
  );
  const positions: number[] = [];
  const point = (i: number, j: number, radius: number): [number, number, number] => {
    const t = (i / columns) * Math.PI * 2;
    return [radius * Math.sin(t), height / 2 - (j / rows) * height, radius * Math.cos(t)];
  };
  const quad = (a: number[], b: number[], c: number[], d: number[]) =>
    positions.push(...a, ...c, ...b, ...a, ...d, ...c);
  for (let i = 0; i < columns; i++)
    for (let j = 0; j < rows; j++) {
      if (!solid[i][j]) continue;
      const a = point(i, j, r + wall),
        b = point(i + 1, j, r + wall),
        d = point(i, j + 1, r + wall),
        e = point(i + 1, j + 1, r + wall);
      const ai = point(i, j, r),
        bi = point(i + 1, j, r),
        di = point(i, j + 1, r),
        ei = point(i + 1, j + 1, r);
      quad(a, b, e, d);
      quad(bi, ai, di, ei);
      if (j === 0 || !solid[i][j - 1]) quad(ai, bi, b, a);
      if (j === rows - 1 || !solid[i][j + 1]) quad(d, e, ei, di);
      if (!solid[(i + columns - 1) % columns][j]) quad(ai, a, d, di);
      if (!solid[(i + 1) % columns][j]) quad(b, bi, ei, e);
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
