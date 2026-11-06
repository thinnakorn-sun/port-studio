'use client';
import { FileCode2, FileJson, Table2, Download } from 'lucide-react';
import {
  downloadFile,
  downloadProject,
  exportCSV,
  exportSVG,
} from '@/infrastructure/export/project-export';
import type { Project } from '@/domain/ports/types';
export function ExportPanel({ project }: { project: Project }) {
  const options = [
    {
      title: 'SVG · แผนผังขนาดจริง',
      description: 'เวกเตอร์หน่วยมิลลิเมตร พร้อมสเกลตรวจระยะ',
      icon: FileCode2,
      run: () => downloadFile('port-map.svg', exportSVG(project), 'image/svg+xml'),
    },
    {
      title: 'CSV · มิติและพื้นที่',
      description: 'ข้อมูลพอร์ตสำหรับเปิดใน Excel หรือ Sheets',
      icon: Table2,
      run: () => downloadFile('port-dimensions.csv', exportCSV(project), 'text/csv;charset=utf-8'),
    },
    {
      title: 'JSON · โปรเจกต์',
      description: 'เก็บรูปทรงและค่าทั้งหมดเพื่อเปิดแก้ไขต่อ',
      icon: FileJson,
      run: () => downloadProject(project),
    },
  ];
  return (
    <section className="panel">
      <p className="eyebrow">TAKE YOUR DESIGN WITH YOU</p>
      <h2>ส่งออกไฟล์</h2>
      <div className="export-grid">
        {options.map(({ title, description, icon: Icon, run }) => (
          <button className="export-card" key={title} onClick={run}>
            <Icon size={30} />
            <strong>{title}</strong>
            <span>{description}</span>
            <Download size={17} />
          </button>
        ))}
      </div>
      <div className="readout">
        พิมพ์ SVG ด้วยขนาด 100% / Actual size แล้วตรวจสเกล 10 มม. ด้วยไม้บรรทัดก่อนใช้งาน
      </div>
      <p className="hint">
        ยังไม่เปิดส่งออก STL เพราะพรีวิว 3D เป็นตาข่ายแบ่งช่อง ไม่ใช่โมเดลสำหรับผลิต
      </p>
    </section>
  );
}
