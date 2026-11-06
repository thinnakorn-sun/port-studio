'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import { NumberField } from '@/shared/ui/number-field';
import type { Studio } from '../hooks/use-studio';
const SleeveViewport = dynamic(() => import('./sleeve-viewport'), {
  ssr: false,
  loading: () => <div className="webgl-fallback">กำลังเตรียมภาพ 3D…</div>,
});
export function SleevePanel({ studio }: { studio: Studio }) {
  const { state, dispatch } = studio,
    [wall, setWall] = useState('2'),
    [height, setHeight] = useState('75');
  useEffect(() => {
    setWall(String(state.project.sleeve.wall));
    setHeight(String(state.project.sleeve.height));
  }, [state.project.sleeve]);
  return (
    <section className="panel sleeve-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">LIVE PREVIEW</p>
          <h2>
            <Box size={18} />
            ภาพปลอกสูบ 3D
          </h2>
        </div>
        <span className="badge">มิลลิเมตร</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: 'commit',
            project: { ...state.project, sleeve: { wall: Number(wall), height: Number(height) } },
          });
        }}
      >
        <div className="fields">
          <NumberField
            label="ความหนาผนัง (mm)"
            value={wall}
            onChange={setWall}
            min={0.5}
            max={10}
          />
          <NumberField
            label="ความสูงปลอก (mm)"
            value={height}
            onChange={setHeight}
            min={state.project.engine.stroke}
            max={250}
          />
        </div>
        <button className="subtle compact" type="submit">
          อัปเดตขนาดปลอก
        </button>
      </form>
      <SleeveViewport project={state.project} />
      <p className="hint">
        ลากเพื่อหมุน · เลื่อนหรือจีบนิ้วเพื่อซูม · ช่องพอร์ตมีผิวด้านในและผนังขอบช่องจริง
        <br />
        ภาพพรีวิวใช้ตาข่ายแบ่งช่อง ขอบรูอาจหยักเล็กน้อย ยังไม่ใช่แบบ CAD/STL พร้อมผลิต
      </p>
    </section>
  );
}
