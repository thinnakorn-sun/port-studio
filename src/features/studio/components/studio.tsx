'use client';
import { useRef } from 'react';
import {
  Download,
  FolderOpen,
  RotateCcw,
  Undo2,
  Redo2,
  AlertCircle,
  X,
  Layers3,
} from 'lucide-react';
import { createProject } from '@/domain/ports/defaults';
import { validationMessage } from '@/domain/ports/validation';
import { downloadProject } from '@/infrastructure/export/project-export';
import { importProject } from '@/infrastructure/projects/storage';
import { useStudio } from '../hooks/use-studio';
import type { Tab } from '../state/studio-reducer';
import { PortMap } from './port-map';
import { ShapeEditor } from './shape-editor';
import { SleevePanel } from './sleeve-panel';
import { Metrics } from './metrics';
import { EnginePanel } from './engine-panel';
import { TimeAreaPanel } from './time-area-panel';
import { ExportPanel } from './export-panel';
import './studio.css';
const tabs: { id: Tab; label: string }[] = [
  { id: 'engine', label: '1 · คำนวณเครื่องยนต์' },
  { id: 'design', label: '2 · Port Design' },
  { id: 'export', label: '3 · ส่งออกไฟล์' },
  { id: 'time-area', label: 'Time–Area' },
];
export function Studio() {
  const studio = useStudio(),
    { state, dispatch } = studio,
    file = useRef<HTMLInputElement>(null);
  return (
    <main className="studio">
      <header className="studio-header">
        <div className="brand">
          <div className="brand-symbol">
            <Layers3 size={24} />
          </div>
          <div>
            <h1>PORT STUDIO</h1>
            <p>2-STROKE · CYLINDER PORT DESIGN</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="history-actions">
            <button
              title="เลิกทำ"
              aria-label="เลิกทำ"
              disabled={!state.past.length}
              onClick={() => dispatch({ type: 'undo' })}
            >
              <Undo2 size={16} />
            </button>
            <button
              title="ทำซ้ำ"
              aria-label="ทำซ้ำ"
              disabled={!state.future.length}
              onClick={() => dispatch({ type: 'redo' })}
            >
              <Redo2 size={16} />
            </button>
          </div>
          <button onClick={() => downloadProject(state.project)}>
            <Download size={15} />
            <span>บันทึกโปรเจกต์</span>
          </button>
          <button onClick={() => file.current?.click()}>
            <FolderOpen size={15} />
            <span>เปิดโปรเจกต์</span>
          </button>
          <button
            aria-label="คืนค่าเริ่มต้น"
            onClick={() => {
              if (window.confirm('คืนค่าโปรเจกต์เป็นค่าเริ่มต้น? สามารถกดเลิกทำเพื่อย้อนกลับได้'))
                dispatch({ type: 'commit', project: createProject(), selectedId: 'ex' });
            }}
          >
            <RotateCcw size={15} />
            <span>ค่าเริ่มต้น</span>
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const input = e.currentTarget,
              chosen = input.files?.[0];
            if (!chosen) return;
            try {
              dispatch({
                type: 'commit',
                project: await importProject(chosen),
                selectedId: undefined,
              });
            } catch (error) {
              dispatch({
                type: 'message',
                message:
                  error instanceof Error && error.message === 'ไฟล์ใหญ่เกิน 1 MB'
                    ? error.message
                    : validationMessage(error),
              });
            }
            input.value = '';
          }}
        />
      </header>
      <nav className="tabs" aria-label="ส่วนการออกแบบ">
        {tabs.map((t) => (
          <button
            key={t.id}
            aria-current={state.tab === t.id ? 'page' : undefined}
            className={state.tab === t.id ? 'active' : ''}
            onClick={() => dispatch({ type: 'tab', tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {state.message && (
        <div className="notice" role="alert">
          <AlertCircle size={18} />
          <span>{state.message}</span>
          <button
            aria-label="ปิดข้อความ"
            onClick={() => dispatch({ type: 'message', message: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {state.tab === 'design' && (
        <>
          <Metrics studio={studio} />
          <div className="design-workspace">
            <PortMap studio={studio} />
            <ShapeEditor studio={studio} />
            <SleevePanel studio={studio} />
          </div>
        </>
      )}
      {state.tab === 'engine' && <EnginePanel studio={studio} />}
      {state.tab === 'time-area' && <TimeAreaPanel studio={studio} />}
      {state.tab === 'export' && <ExportPanel project={state.project} />}
      <footer>
        <span className="status-dot" />
        {state.ready ? 'บันทึกอัตโนมัติในเบราว์เซอร์เครื่องนี้' : 'กำลังเปิดโปรเจกต์…'}
        <span className="footer-separator">/</span>PORT STUDIO · ENGINEERING WORKSPACE
      </footer>
    </main>
  );
}
