'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Trash2 } from 'lucide-react';
import {
  normalizedOutline,
  polygonArea,
  portOutline,
  isSimplePolygon,
} from '@/domain/ports/geometry';
import { circumference } from '@/domain/engine/kinematics';
import type { Point, Port } from '@/domain/ports/types';
import { NumberField } from '@/shared/ui/number-field';
import { format, portColors } from '@/shared/ui/format';
import { updatePort } from '../state/project-commands';
import type { Studio } from '../hooks/use-studio';
function ShapeCanvas({
  port,
  onChange,
  onError,
}: {
  port: Port;
  onChange: (points: Point[]) => void;
  onError: () => void;
}) {
  const svg = useRef<SVGSVGElement>(null),
    [draft, setDraft] = useState<Point[] | null>(null),
    [index, setIndex] = useState<number | null>(null);
  useEffect(() => {
    setDraft(null);
    setIndex(null);
  }, [port]);
  const points = draft ?? normalizedOutline(port),
    scale = Math.min(350 / port.width, 170 / (port.bottom - port.top));
  const w = port.width * scale,
    h = (port.bottom - port.top) * scale,
    ox = (400 - w) / 2,
    oy = (230 - h) / 2;
  const position = ([x, y]: Point): Point => [ox + x * w, oy + y * h];
  function move(event: PointerEvent<SVGSVGElement>) {
    if (index === null || !svg.current) return;
    const pt = svg.current.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const matrix = svg.current.getScreenCTM();
    if (!matrix) return;
    const p = pt.matrixTransform(matrix.inverse());
    const next = [...points];
    next[index] = [
      Math.max(0, Math.min(1, (p.x - ox) / w)),
      Math.max(0, Math.min(1, (p.y - oy) / h)),
    ];
    setDraft(next);
  }
  function end() {
    if (index !== null && draft) {
      if (isSimplePolygon(draft)) onChange(draft);
      else onError();
    }
    setIndex(null);
    setDraft(null);
  }
  return (
    <div className="shape-preview">
      <svg
        ref={svg}
        viewBox="0 0 400 230"
        role="img"
        aria-label="รูปพอร์ตที่เลือกและจุดปรับรูปทรง"
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => {
          setIndex(null);
          setDraft(null);
        }}
      >
        <defs>
          <pattern
            id="shape-grid"
            width={scale}
            height={scale}
            patternUnits="userSpaceOnUse"
            x={ox}
            y={oy}
          >
            <path d={`M${scale} 0H0V${scale}`} fill="none" stroke="#34505e" strokeWidth=".6" />
          </pattern>
        </defs>
        <rect x={ox} y={oy} width={w} height={h} fill="url(#shape-grid)" />
        <polygon
          points={points
            .map(position)
            .map((p) => p.join(','))
            .join(' ')}
          fill={portColors[port.kind]}
          fillOpacity=".4"
          stroke={portColors[port.kind]}
        />
        {points.map((p, i) => {
          const [x, y] = position(p);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="#ffe0ad"
              onPointerDown={(event) => {
                event.preventDefault();
                svg.current?.setPointerCapture(event.pointerId);
                setDraft([...points]);
                setIndex(i);
              }}
            />
          );
        })}
        <text x="200" y="222" textAnchor="middle">
          {format(port.width)} × {format(port.bottom - port.top)} mm · ลากจุดเพื่อปรับรูปทรง
        </text>
      </svg>
    </div>
  );
}
export function ShapeEditor({ studio }: { studio: Studio }) {
  const { state, dispatch, selected: port } = studio;
  const [draft, setDraft] = useState({
    left: '',
    right: '',
    top: '',
    bottom: '',
    width: '',
    height: '',
  });
  useEffect(
    () =>
      setDraft({
        left: (port.centerX - port.width / 2).toFixed(2),
        right: (port.centerX + port.width / 2).toFixed(2),
        top: port.top.toFixed(2),
        bottom: port.bottom.toFixed(2),
        width: port.width.toFixed(2),
        height: (port.bottom - port.top).toFixed(2),
      }),
    [port],
  );
  function change(key: keyof typeof draft, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      const n = Number(value);
      if (value === '' || !Number.isFinite(n)) return next;
      if (key === 'left' || key === 'right')
        next.width = String(Number(next.right) - Number(next.left));
      if (key === 'width') next.right = String(Number(next.left) + n);
      if (key === 'top' || key === 'bottom')
        next.height = String(Number(next.bottom) - Number(next.top));
      if (key === 'height') next.bottom = String(Number(next.top) + n);
      return next;
    });
  }
  function patch(patch: Partial<Port>) {
    dispatch({ type: 'commit', project: updatePort(state.project, port.id, patch, state.mirror) });
  }
  function remove() {
    const ports = state.project.ports
      .filter((p) => p.id !== port.id)
      .map((p) => (p.mirrorId === port.id ? { ...p, mirrorId: undefined } : p));
    dispatch({ type: 'commit', project: { ...state.project, ports }, selectedId: ports[0]?.id });
  }
  const fieldLabels = {
    left: 'X Left (mm)',
    right: 'X Right (mm)',
    top: 'Y Top (mm)',
    bottom: 'Y Bottom (mm)',
    width: 'ความกว้างแผ่นคลี่ (mm)',
    height: 'ความสูง (mm)',
  };
  return (
    <aside className="panel editor-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SELECT & REFINE</p>
          <h2>Shape Editor</h2>
        </div>
        <span className="badge">mm</span>
      </div>
      <ShapeCanvas
        port={port}
        onChange={(points) => patch({ points })}
        onError={() => dispatch({ type: 'message', message: 'รูปพอร์ตต้องไม่มีเส้นตัดกัน' })}
      />
      <div className="field">
        <label htmlFor="port-select">เลือกพอร์ต</label>
        <select
          id="port-select"
          value={port.id}
          onChange={(e) => dispatch({ type: 'select', id: e.target.value })}
        >
          {state.project.ports.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.kind}
            </option>
          ))}
        </select>
      </div>
      <div className="divider" />
      <h3>
        Grid Coordinates <span>(mm)</span>
      </h3>
      <p className="hint">X วัดตามแผ่นคลี่ · Y วัดลงจาก TDC</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const left = Number(draft.left),
            right = Number(draft.right);
          patch({
            centerX: (left + right) / 2,
            width: right - left,
            top: Number(draft.top),
            bottom: Number(draft.bottom),
          });
        }}
      >
        <div className="fields">
          {(Object.keys(fieldLabels) as Array<keyof typeof draft>).map((key) => (
            <NumberField
              key={key}
              label={fieldLabels[key]}
              value={draft[key]}
              onChange={(v) => change(key, v)}
              step={0.01}
            />
          ))}
        </div>
        <button type="submit" className="primary full-width">
          ใช้ค่าที่กรอก
        </button>
      </form>
      <div className="divider" />
      <div className="fields">
        <div className="field">
          <label htmlFor="port-preset">รูปทรงสำเร็จรูป</label>
          <select
            id="port-preset"
            value={port.preset}
            onChange={(e) => patch({ preset: e.target.value as Port['preset'], points: undefined })}
          >
            <option value="rounded">โค้งมน</option>
            <option value="roof">หลังคาโค้ง</option>
            <option value="rectangle">สี่เหลี่ยม</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="port-kind">ประเภทพอร์ต</label>
          <select
            id="port-kind"
            value={port.kind}
            onChange={(e) => patch({ kind: e.target.value as Port['kind'] })}
          >
            <option value="exhaust">ไอเสีย</option>
            <option value="transfer">Transfer</option>
            <option value="boost">Boost</option>
          </select>
        </div>
      </div>
      <div className="readout">
        พื้นที่ <strong>{format(polygonArea(portOutline(port)))} mm²</strong> ·{' '}
        {format(polygonArea(portOutline(port)) / 100)} cm²
      </div>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={state.mirror}
          onChange={(e) => dispatch({ type: 'mirror', value: e.target.checked })}
        />
        ปรับพอร์ตคู่ซ้าย–ขวาพร้อมกัน
      </label>
      <p className="hint">
        ขอบแผ่นคลี่ 0–{format(circumference(state.project.engine.bore))} มม. ·
        รูปพอร์ตต้องไม่มีเส้นตัดกัน
      </p>
      <div className="divider" />
      <button className="danger" disabled={state.project.ports.length === 1} onClick={remove}>
        <Trash2 size={15} />
        ลบพอร์ตที่เลือก
      </button>
    </aside>
  );
}
