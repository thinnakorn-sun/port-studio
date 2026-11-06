import type { Point, Port } from './types';
export function normalizedOutline(port: Port): Point[] {
  if (port.points) return port.points;
  if (port.preset === 'rectangle')
    return [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
  if (port.preset === 'roof')
    return [
      [0, 0.18],
      [0.2, 0.06],
      [0.5, 0],
      [0.8, 0.06],
      [1, 0.18],
      [1, 1],
      [0, 1],
    ];
  return Array.from({ length: 40 }, (_, i): Point => {
    const t = (i / 40) * Math.PI * 2;
    return [
      0.5 + 0.5 * Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** 0.58,
      0.5 + 0.5 * Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** 1.12,
    ];
  });
}
export function portOutline(port: Port): Point[] {
  return normalizedOutline(port).map(([x, y]) => [
    port.centerX + (x - 0.5) * port.width,
    port.top + y * (port.bottom - port.top),
  ]);
}
export function polygonArea(points: readonly Point[]): number {
  return (
    Math.abs(
      points.reduce((sum, a, i) => {
        const b = points[(i + 1) % points.length];
        return sum + a[0] * b[1] - b[0] * a[1];
      }, 0),
    ) / 2
  );
}
/** Clip to the portion ABOVE the piston crown (y <= crown). */
export function clipAtPiston(points: readonly Point[], crown: number): Point[] {
  const result: Point[] = [];
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    const aIn = a[1] <= crown,
      bIn = b[1] <= crown;
    if (aIn) result.push(a);
    if (aIn !== bIn) result.push([a[0] + ((crown - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), crown]);
  });
  return result;
}
export function containsPoint([x, y]: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
      inside = !inside;
  }
  return inside;
}
const cross = (a: Point, b: Point, c: Point) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
/** Reject crossed or degenerate custom outlines before they affect area calculations. */
export function isSimplePolygon(points: readonly Point[]): boolean {
  if (points.length < 3 || polygonArea(points) < 1e-6) return false;
  const on = (a: Point, b: Point, p: Point) =>
    Math.abs(cross(a, b, p)) < 1e-9 &&
    p[0] >= Math.min(a[0], b[0]) - 1e-9 &&
    p[0] <= Math.max(a[0], b[0]) + 1e-9 &&
    p[1] >= Math.min(a[1], b[1]) - 1e-9 &&
    p[1] <= Math.max(a[1], b[1]) + 1e-9;
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const a = points[i],
        b = points[(i + 1) % points.length],
        c = points[j],
        d = points[(j + 1) % points.length];
      if (
        (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) ||
        on(a, b, c) ||
        on(a, b, d) ||
        on(c, d, a) ||
        on(c, d, b)
      )
        return false;
    }
  return true;
}
