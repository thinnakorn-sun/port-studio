'use client';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { NumberField } from '@/shared/ui/number-field';
import { format } from '@/shared/ui/format';
import { circumference } from '@/domain/engine/kinematics';
import { updateEngine } from '../state/project-commands';
import type { Studio } from '../hooks/use-studio';
export function EnginePanel({ studio }: { studio: Studio }) {
  const { state, dispatch, result } = studio,
    [draft, setDraft] = useState({ bore: '63', stroke: '57', rod: '105', rpm: '8000' });
  useEffect(() => {
    const e = state.project.engine;
    setDraft({
      bore: String(e.bore),
      stroke: String(e.stroke),
      rod: String(e.rod),
      rpm: String(e.rpm),
    });
  }, [state.project.engine]);
  const labels = {
    bore: 'Bore · เส้นผ่านศูนย์กลางลูกสูบ (mm)',
    stroke: 'Stroke · ช่วงชัก (mm)',
    rod: 'Conrod · ก้านสูบศูนย์ถึงศูนย์ (mm)',
    rpm: 'รอบเครื่อง (RPM)',
  };
  return (
    <section className="panel centered-panel">
      <p className="eyebrow">ENGINE SETUP</p>
      <h2>ขนาดเครื่องยนต์</h2>
      <p className="hint">ตั้งค่าพื้นฐานก่อนออกแบบพอร์ต · ระยะ Y วัดลงจาก TDC</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: 'commit',
            project: updateEngine(state.project, {
              bore: Number(draft.bore),
              stroke: Number(draft.stroke),
              rod: Number(draft.rod),
              rpm: Number(draft.rpm),
            }),
          });
        }}
      >
        <div className="fields">
          {(Object.keys(labels) as Array<keyof typeof draft>).map((k) => (
            <NumberField
              key={k}
              label={labels[k]}
              value={draft[k]}
              onChange={(v) => setDraft({ ...draft, [k]: v })}
              step={k === 'rpm' ? 100 : 0.1}
              min={k === 'rpm' ? 100 : 1}
            />
          ))}
        </div>
        <p className="hint">
          การเปลี่ยน Bore จะสเกลเฉพาะพิกัด X และความกว้างพอร์ต ส่วนระยะ Y คงเดิม
        </p>
        <button className="primary full-width" type="submit">
          ใช้ค่าเครื่องยนต์
        </button>
      </form>
      <div className="readout">
        ความจุ <strong>{format(result.cc)} CC</strong> · เส้นรอบวง{' '}
        {format(circumference(state.project.engine.bore))} มม.
      </div>
      <button onClick={() => dispatch({ type: 'tab', tab: 'design' })}>
        ไปออกแบบพอร์ต
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
