import { circumference } from '@/domain/engine/kinematics';
import type { Engine, Port, Project } from '@/domain/ports/types';
export function updatePort(
  project: Project,
  id: string,
  patch: Partial<Port>,
  mirror: boolean,
): Project {
  const next = {
    ...project,
    ports: project.ports.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  };
  const changed = next.ports.find((p) => p.id === id);
  if (mirror && changed?.mirrorId)
    next.ports = next.ports.map((p) =>
      p.id === changed.mirrorId
        ? {
            ...p,
            kind: changed.kind,
            width: changed.width,
            top: changed.top,
            bottom: changed.bottom,
            preset: changed.preset,
            centerX: circumference(project.engine.bore) - changed.centerX,
            points: changed.points?.map(([x, y]) => [1 - x, y] as const).reverse(),
          }
        : p,
    );
  return next;
}
export function updateEngine(project: Project, engine: Engine): Project {
  const ratio = engine.bore / project.engine.bore;
  return {
    ...project,
    engine,
    ports: project.ports.map((p) => ({ ...p, centerX: p.centerX * ratio, width: p.width * ratio })),
  };
}
