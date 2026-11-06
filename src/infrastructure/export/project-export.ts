import { circumference } from '@/domain/engine/kinematics';
import { polygonArea, portOutline } from '@/domain/ports/geometry';
import type { Project } from '@/domain/ports/types';
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!,
  );
export function exportSVG(project: Project): string {
  const width = circumference(project.engine.bore),
    height = project.sleeve.height;
  const ports = project.ports
    .map(
      (p) =>
        `<g><title>${xml(p.name)}</title><polygon points="${portOutline(p)
          .map((pt) => pt.join(','))
          .join(' ')}" fill="none" stroke="black" stroke-width="0.15"/></g>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="white"/>${ports}<path d="M0 ${project.engine.stroke}H${width}" stroke="gray" stroke-width=".15" stroke-dasharray="1 1"/><path d="M2 4v2m0-1h10m0-1v2" stroke="black" stroke-width=".2"/><text x="2" y="3" font-size="2">10 mm</text></svg>`;
}
export function exportCSV(project: Project): string {
  const cell = (s: string) =>
    '"' + (/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
  return (
    '\uFEFFname,type,x_left_mm,x_right_mm,y_top_mm,y_bottom_mm,area_mm2\r\n' +
    project.ports
      .map((p) =>
        [
          cell(p.name),
          p.kind,
          p.centerX - p.width / 2,
          p.centerX + p.width / 2,
          p.top,
          p.bottom,
          polygonArea(portOutline(p)),
        ].join(','),
      )
      .join('\r\n')
  );
}
export function downloadFile(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const downloadProject = (project: Project) =>
  downloadFile('port-studio-project.json', JSON.stringify(project, null, 2), 'application/json');
