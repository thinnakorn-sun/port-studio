import { describe, expect, it } from 'vitest';
import { createProject } from '@/domain/ports/defaults';
import { arcToChord, chordToArc, displacement, pistonPosition } from '@/domain/engine/kinematics';
import { calculateTimeArea } from '@/domain/engine/time-area';
import { clipAtPiston, polygonArea, isSimplePolygon } from '@/domain/ports/geometry';
import { parseProject } from '@/domain/ports/validation';
import { updateEngine, updatePort } from '@/features/studio/state/project-commands';
import { initialState, studioReducer } from '@/features/studio/state/studio-reducer';
import { exportSVG, exportCSV } from '@/infrastructure/export/project-export';
import { createSleeveGeometry } from '@/rendering/three/sleeve-geometry';
describe('engineering invariants', () => {
  it('matches dead centres and is symmetric on either side of BDC', () => {
    const { engine } = createProject();
    expect(pistonPosition(0, engine)).toBeCloseTo(0, 10);
    expect(pistonPosition(180, engine)).toBeCloseTo(engine.stroke, 10);
    expect(pistonPosition(360, engine)).toBeCloseTo(0, 10);
    expect(pistonPosition(110, engine)).toBeCloseTo(pistonPosition(250, engine), 10);
  });
  it('computes displacement in cm³', () =>
    expect(displacement(createProject().engine)).toBeCloseTo(177.6829827, 6));
  it('round-trips chord and minor arc, rejecting impossible chords', () => {
    expect(arcToChord(chordToArc(40, 63), 63)).toBeCloseTo(40, 10);
    expect(() => chordToArc(64, 63)).toThrow();
  });
  it('clips the open portion of a rectangular port', () => {
    const p = [
      [0, 20],
      [10, 20],
      [10, 40],
      [0, 40],
    ] as const;
    expect(polygonArea(clipAtPiston(p, 10))).toBe(0);
    expect(polygonArea(clipAtPiston(p, 30))).toBe(100);
    expect(polygonArea(clipAtPiston(p, 50))).toBe(200);
  });
  it('STA halves as RPM doubles, but equivalent target RPM stays fixed', () => {
    const p = createProject(),
      a = calculateTimeArea(p);
    const b = calculateTimeArea({ ...p, engine: { ...p.engine, rpm: p.engine.rpm * 2 } });
    expect(b.exhaustSTA).toBeCloseTo(a.exhaustSTA / 2, 12);
    expect(b.transferSTA).toBeCloseTo(a.transferSTA / 2, 12);
    expect(b.referenceRPM).toBeCloseTo(a.referenceRPM, 8);
  });
  it('does not expose a port at TDC and rejects crossed custom polygons', () => {
    expect(calculateTimeArea(createProject()).series[0].exhaust).toBe(0);
    expect(
      isSimplePolygon([
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 1],
      ]),
    ).toBe(false);
  });
});
describe('project edits and file boundaries', () => {
  it('validates defaults and JSON round-trips', () =>
    expect(parseProject(JSON.parse(JSON.stringify(createProject())))).toEqual(createProject()));
  it('rejects invalid rod length, zero STA targets and duplicate identifiers', () => {
    const p = createProject();
    expect(() => parseProject({ ...p, engine: { ...p.engine, rod: 10 } })).toThrow();
    expect(() => parseProject({ ...p, targets: { ...p.targets, exhaust: 0 } })).toThrow();
    expect(() => parseProject({ ...p, ports: [p.ports[0], p.ports[0]] })).toThrow();
  });
  it('mirrors width, coordinates and custom shape without mutating the source', () => {
    const p = createProject();
    const updated = updatePort(
      p,
      'tr-l',
      {
        width: 22,
        points: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      },
      true,
    );
    const l = updated.ports.find((p) => p.id === 'tr-l')!,
      r = updated.ports.find((p) => p.id === 'tr-r')!;
    expect(l.centerX + r.centerX).toBeCloseTo(Math.PI * p.engine.bore);
    expect(r.width).toBe(22);
    expect(p.ports.find((p) => p.id === 'tr-l')!.width).toBe(20);
    expect(r.points).toEqual([
      [1, 1],
      [0, 1],
      [0, 0],
      [1, 0],
    ]);
  });
  it('scales X dimensions when bore changes, leaving Y dimensions unchanged', () => {
    const p = createProject(),
      next = updateEngine(p, { ...p.engine, bore: 126 });
    expect(next.ports[0].width).toBe(p.ports[0].width * 2);
    expect(next.ports[0].top).toBe(p.ports[0].top);
  });
  it('rejects invalid edits atomically and supports undo / redo', () => {
    const p = createProject(),
      next = { ...p, engine: { ...p.engine, rpm: 9000 } };
    const edited = studioReducer(initialState, { type: 'commit', project: next });
    expect(studioReducer(edited, { type: 'undo' }).project.engine.rpm).toBe(8000);
    expect(
      studioReducer(studioReducer(edited, { type: 'undo' }), { type: 'redo' }).project.engine.rpm,
    ).toBe(9000);
    const bad = studioReducer(edited, { type: 'commit', project: { ...next, ports: [] } });
    expect(bad.project).toBe(edited.project);
    expect(bad.message.length).toBeGreaterThan(0);
  });
  it('exports millimetre dimensions, escaped XML and spreadsheet-safe names', () => {
    const p = createProject();
    p.ports[0].name = '=SUM(1,2)<tag>';
    expect(exportSVG(p)).toContain('mm"');
    expect(exportSVG(p)).toContain('&lt;tag&gt;');
    expect(exportCSV(p)).toContain('"\'=SUM(1,2)<tag>"');
  });
  it('produces finite 3D vertices and outward normals, then disposes geometry', () => {
    const p = createProject();
    const g = createSleeveGeometry(p, 64, 40),
      pos = g.getAttribute('position'),
      normal = g.getAttribute('normal');
    expect(pos.count).toBeGreaterThan(0);
    for (let i = 0; i < pos.count; i++)
      expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true);
    expect(pos.getX(0) * normal.getX(0) + pos.getZ(0) * normal.getZ(0)).toBeGreaterThan(0);
    g.dispose();
  });
});
