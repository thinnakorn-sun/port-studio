'use client';
import { useRef, useState, type PointerEvent } from 'react';
import { Maximize2, Minimize2, Plus } from 'lucide-react';
import { circumference, arcToChord } from '@/domain/engine/kinematics';
import { portOutline } from '@/domain/ports/geometry';
import { format, portColors } from '@/shared/ui/format';
import { updatePort } from '../state/project-commands';
import type { Studio } from '../hooks/use-studio';
interface Drag {
  id: string;
  startX: number;
  center: number;
  next: number;
}
export function PortMap({ studio }: { studio: Studio }) {
  const { state, dispatch } = studio,
    { project } = state;
  const svgRef = useRef<SVGSVGElement>(null),
    [drag, setDrag] = useState<Drag | null>(null),
    [expanded, setExpanded] = useState(false);
  const c = circumference(project.engine.bore),
    h = Math.max(project.engine.stroke + 5, ...project.ports.map((p) => p.bottom + 3));
  const sx = 930 / c,
    sy = 280 / h,
    main = project.ports.find((p) => p.id === 'ex') ?? project.ports[0];
  const shown = drag ? updatePort(project, drag.id, { centerX: drag.next }, state.mirror) : project;
  function move(e: PointerEvent<SVGSVGElement>) {
    if (!drag || !svgRef.current) return;
    const p = project.ports.find((p) => p.id === drag.id)!;
    const delta =
      (((e.clientX - drag.startX) / svgRef.current.getBoundingClientRect().width) * 1000) / sx;
    setDrag({
      ...drag,
      next: Math.max(p.width / 2, Math.min(c - p.width / 2, drag.center + delta)),
    });
  }
  function end() {
    if (!drag) return;
    if (Math.abs(drag.next - drag.center) > 1e-8)
      dispatch({
        type: 'commit',
        project: updatePort(project, drag.id, { centerX: drag.next }, state.mirror),
      });
    setDrag(null);
  }
  function add() {
    const id = crypto.randomUUID();
    dispatch({
      type: 'commit',
      selectedId: id,
      project: {
        ...project,
        ports: [
          ...project.ports,
          {
            id,
            name: `New Port ${project.ports.length + 1}`,
            kind: 'transfer',
            centerX: c / 2,
            width: 12,
            top: project.engine.stroke * 0.75,
            bottom: project.engine.stroke,
            preset: 'roof',
          },
        ],
      },
    });
  }
  return (
    <section
      className={`panel map-panel ${expanded ? 'map-expanded' : ''}`}
      aria-label="แผนผังพอร์ต"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">UNWRAPPED CYLINDER</p>
          <h2>
            Port Map <span>กริด 1 × 1 มม.</span>
          </h2>
        </div>
        <div className="button-row">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'ย่อพื้นที่ทำงาน' : 'ขยายพื้นที่ทำงาน'}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={add} disabled={project.ports.length >= 40}>
            <Plus size={16} />
            เพิ่มพอร์ต
          </button>
        </div>
      </div>
      <div className="legend">
        {Object.entries(portColors).map(([kind, color]) => (
          <span key={kind}>
            <i style={{ background: color }} />
            {{ exhaust: 'ไอเสีย', transfer: 'ทรานสเฟอร์', boost: 'บูสต์' }[kind]}
          </span>
        ))}
      </div>
      <div className="readout">
        {main.name} · วัดตรง{' '}
        <strong>{format(arcToChord(main.width, project.engine.bore))} มม.</strong> (
        {format((arcToChord(main.width, project.engine.bore) / project.engine.bore) * 100)}%) ·
        บนแผ่นคลี่ {format(main.width)} มม.
      </div>
      <div className="map-scroll">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 350"
          role="img"
          aria-label="แผนผังพอร์ตคลี่กระบอกสูบ"
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={() => setDrag(null)}
        >
          <defs>
            <pattern
              id="millimetres"
              width={sx}
              height={sy}
              patternUnits="userSpaceOnUse"
              x="45"
              y="35"
            >
              <path d={`M${sx} 0H0V${sy}`} fill="none" stroke="#233a47" strokeWidth=".45" />
            </pattern>
          </defs>
          <rect x="45" y="35" width="930" height="280" fill="url(#millimetres)" />
          {Array.from({ length: Math.floor(c / 10) + 1 }, (_, i) => (
            <line
              key={`x${i}`}
              x1={45 + i * 10 * sx}
              x2={45 + i * 10 * sx}
              y1="35"
              y2="315"
              stroke="#304858"
              strokeWidth=".65"
            />
          ))}
          {Array.from({ length: Math.floor(h / 10) + 1 }, (_, i) => (
            <g key={`y${i}`}>
              <line
                x1="45"
                x2="975"
                y1={35 + i * 10 * sy}
                y2={35 + i * 10 * sy}
                stroke="#304858"
                strokeWidth=".65"
              />
              <text x="32" y={39 + i * 10 * sy} textAnchor="end">
                {i * 10}
              </text>
            </g>
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <text key={i} x={45 + (i / 8) * 930} y="20" textAnchor="middle">
              {i * 45}°
            </text>
          ))}
          <line
            x1={45 + main.centerX * sx}
            x2={45 + main.centerX * sx}
            y1="35"
            y2="315"
            stroke="#b79a72"
            strokeDasharray="5 5"
          />
          <text x={45 + main.centerX * sx} y="48" textAnchor="middle" className="center-label">
            EX MAIN CENTER
          </text>
          <line
            x1="45"
            x2="975"
            y1={35 + project.engine.stroke * sy}
            y2={35 + project.engine.stroke * sy}
            stroke="#b89c73"
          />
          <text x="970" y={31 + project.engine.stroke * sy} textAnchor="end">
            BDC {format(project.engine.stroke)} mm
          </text>
          {shown.ports.map((p) => (
            <g key={p.id}>
              <polygon
                role="button"
                tabIndex={0}
                aria-label={`เลือก ${p.name}`}
                aria-pressed={p.id === state.selectedId}
                points={portOutline(p)
                  .map(([x, y]) => `${45 + x * sx},${35 + y * sy}`)
                  .join(' ')}
                fill={portColors[p.kind]}
                fillOpacity={0.62}
                stroke={p.id === state.selectedId ? '#fff' : portColors[p.kind]}
                strokeWidth={p.id === state.selectedId ? 2 : 1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dispatch({ type: 'select', id: p.id });
                  }
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  dispatch({ type: 'select', id: p.id });
                  svgRef.current?.setPointerCapture(e.pointerId);
                  setDrag({ id: p.id, startX: e.clientX, center: p.centerX, next: p.centerX });
                }}
              />
              <text
                pointerEvents="none"
                x={45 + p.centerX * sx}
                y={35 + ((p.top + p.bottom) / 2) * sy}
                textAnchor="middle"
                className="port-label"
              >
                {p.name}
              </text>
            </g>
          ))}
          <text x="510" y="342" textAnchor="middle">
            ระยะตามเส้นรอบวง (mm) — π × Bore
          </text>
        </svg>
      </div>
      <p className="hint">
        คลิกเลือกพอร์ต · ลากซ้าย–ขวาเพื่อย้ายตำแหน่ง · ใช้ Enter เลือกพอร์ตด้วยคีย์บอร์ด
      </p>
    </section>
  );
}
