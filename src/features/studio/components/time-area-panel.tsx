'use client';
import { useEffect, useState } from 'react';
import { NumberField } from '@/shared/ui/number-field';
import { format } from '@/shared/ui/format';
import type { Studio } from '../hooks/use-studio';
export function TimeAreaPanel({ studio }: { studio: Studio }) {
  const { state, dispatch, result } = studio,
    [ex, setEx] = useState(''),
    [tr, setTr] = useState('');
  useEffect(() => {
    setEx(String(state.project.targets.exhaust));
    setTr(String(state.project.targets.transfer));
  }, [state.project.targets]);
  const max = Math.max(1, ...result.series.flatMap((s) => [s.exhaust, s.transfer]));
  return (
    <section className="panel">
      <p className="eyebrow">AREA × TIME / DISPLACEMENT</p>
      <h2>Specific Time–Area</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: 'commit',
            project: { ...state.project, targets: { exhaust: Number(ex), transfer: Number(tr) } },
          });
        }}
      >
        <div className="fields">
          <NumberField
            label="Exhaust STA เป้าหมาย (cm²·s/cm³)"
            value={ex}
            onChange={setEx}
            min={0.0000001}
            step={0.0000001}
          />
          <NumberField
            label="Transfer STA เป้าหมาย (cm²·s/cm³)"
            value={tr}
            onChange={setTr}
            min={0.0000001}
            step={0.0000001}
          />
        </div>
        <button className="primary compact" type="submit">
          ใช้ค่าเป้าหมาย
        </button>
      </form>
      <div className="readout">
        Exhaust STA <strong>{result.exhaustSTA.toFixed(7)}</strong> · Transfer + Boost STA{' '}
        <strong>{result.transferSTA.toFixed(7)}</strong>
      </div>
      <div className="chart">
        <svg viewBox="0 0 1000 310" role="img" aria-label="กราฟพื้นที่พอร์ตเปิดตามมุมข้อเหวี่ยง">
          <text x="45" y="25">
            พื้นที่เปิด (mm²) · สูงสุด {format(max)}
          </text>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1="45" x2="950" y1={50 + i * 52.5} y2={50 + i * 52.5} stroke="#263f4e" />
              <text x="35" y={54 + i * 52.5} textAnchor="end">
                {format(max * (1 - i / 4), 0)}
              </text>
            </g>
          ))}
          {(['exhaust', 'transfer'] as const).map((k, i) => (
            <polyline
              key={k}
              fill="none"
              stroke={i ? '#39bddc' : '#ff9138'}
              strokeWidth="3"
              points={result.series
                .map((s) => `${45 + (s.angle / 360) * 900},${260 - (s[k] / max) * 210}`)
                .join(' ')}
            />
          ))}
          {[0, 90, 180, 270, 360].map((a) => (
            <text key={a} x={45 + (a / 360) * 900} y="288" textAnchor="middle">
              {a}°
            </text>
          ))}
        </svg>
      </div>
      <p className="hint">
        อินทิเกรตพื้นที่เปิด 720 ช่วงต่อรอบด้วยวิธี trapezoid หารด้วยปริมาตรต่อสูบ
        <br />
        ค่าเป้าหมายเริ่มต้นเป็นตัวอย่างที่ปรับได้ ไม่ใช่ค่ารับรองสำหรับเครื่องยนต์ ไม่รวมแรงดัน
        ค่าสัมประสิทธิ์การไหล และผลของท่อไอเสีย
      </p>
    </section>
  );
}
