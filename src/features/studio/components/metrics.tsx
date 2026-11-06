import { Gauge } from 'lucide-react';
import { format } from '@/shared/ui/format';
import type { Studio } from '../hooks/use-studio';
export function Metrics({ studio }: { studio: Studio }) {
  const { state, result } = studio,
    metrics = [
      ['รอบเครื่อง (RPM)', state.project.engine.rpm, ''],
      ['RPM เทียบเป้า Exhaust', result.exhaustRPM, 'orange'],
      ['RPM เทียบเป้า Transfer', result.transferRPM, 'cyan'],
      ['RPM อ้างอิงจาก STA', result.referenceRPM, 'green'],
    ];
  return (
    <section className="panel metrics-panel">
      <div className="panel-heading">
        <h2>
          <Gauge size={17} />
          RPM / Time–Area <span>จาก Port Map</span>
        </h2>
        <span className="live-label">
          <i />
          LIVE
        </span>
      </div>
      <div className="metrics">
        {metrics.map(([label, value, color]) => (
          <div className="metric" key={String(label)}>
            <span>{label}</span>
            <strong className={String(color)}>{format(Number(value), 0)}</strong>
          </div>
        ))}
      </div>
      <p className="hint">
        RPM เทียบเป้า STA เป็นค่าประเมินจากพื้นที่และเวลาเปิด · RPM อ้างอิงใช้ค่าที่ต่ำกว่าระหว่าง
        Exhaust และ Transfer · ไม่ใช่รอบแรงม้าสูงสุดหรือรอบปลอดภัย
      </p>
    </section>
  );
}
