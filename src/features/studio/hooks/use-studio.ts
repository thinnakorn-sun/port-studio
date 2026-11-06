'use client';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { calculateTimeArea } from '@/domain/engine/time-area';
import { loadProject, persistProject } from '@/infrastructure/projects/storage';
import { initialState, studioReducer } from '../state/studio-reducer';
export function useStudio() {
  const [state, dispatch] = useReducer(studioReducer, initialState);
  const saveBlocked = useRef(false);
  useEffect(() => {
    try {
      const saved = loadProject();
      if (saved) dispatch({ type: 'restore', project: saved });
      else dispatch({ type: 'ready' });
    } catch {
      saveBlocked.current = true;
      dispatch({
        type: 'message',
        message: 'เปิดข้อมูลที่บันทึกไว้ไม่ได้ กำลังใช้ค่าเริ่มต้น กรุณาส่งออกข้อมูลก่อนบันทึกใหม่',
      });
      dispatch({ type: 'ready' });
    }
  }, []);
  useEffect(() => {
    if (!state.ready || (saveBlocked.current && state.project === initialState.project)) return;
    saveBlocked.current = false;
    const timer = setTimeout(() => {
      try {
        persistProject(state.project);
      } catch {
        dispatch({
          type: 'message',
          message: 'เบราว์เซอร์ไม่อนุญาตให้บันทึกอัตโนมัติ กรุณาดาวน์โหลด JSON เก็บไว้',
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state.project, state.ready]);
  const result = useMemo(() => calculateTimeArea(state.project), [state.project]);
  const selected =
    state.project.ports.find((p) => p.id === state.selectedId) ?? state.project.ports[0];
  return { state, dispatch, result, selected };
}
export type Studio = ReturnType<typeof useStudio>;
