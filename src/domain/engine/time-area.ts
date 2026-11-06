import { displacement, pistonPosition } from './kinematics';
import { clipAtPiston, polygonArea, portOutline } from '../ports/geometry';
import type { AreaSample, Project } from '../ports/types';
export function calculateTimeArea(project: Project, intervals = 720) {
  const { engine } = project;
  const outlines = project.ports.map((port) => ({ kind: port.kind, points: portOutline(port) }));
  let exhaustIntegral = 0,
    transferIntegral = 0;
  const series: AreaSample[] = [];
  for (let i = 0; i <= intervals; i++) {
    const angle = (i / intervals) * 360,
      crown = pistonPosition(angle, engine);
    let exhaust = 0,
      transfer = 0;
    for (const port of outlines) {
      const opened = polygonArea(clipAtPiston(port.points, crown));
      if (port.kind === 'exhaust') exhaust += opened;
      else transfer += opened;
    }
    const weight = i === 0 || i === intervals ? 0.5 : 1;
    exhaustIntegral += exhaust * weight;
    transferIntegral += transfer * weight;
    if (i % 12 === 0 || i === intervals) series.push({ angle, exhaust, transfer });
  }
  // mm² -> cm², one revolution = 60/rpm seconds, normalized by cm³.
  const cc = displacement(engine),
    factor = 60 / engine.rpm / intervals / 100 / cc;
  const exhaustSTA = exhaustIntegral * factor,
    transferSTA = transferIntegral * factor;
  const exhaustRPM = (engine.rpm * exhaustSTA) / project.targets.exhaust;
  const transferRPM = (engine.rpm * transferSTA) / project.targets.transfer;
  return {
    cc,
    exhaustSTA,
    transferSTA,
    exhaustRPM,
    transferRPM,
    referenceRPM: Math.min(exhaustRPM, transferRPM),
    series,
  };
}
