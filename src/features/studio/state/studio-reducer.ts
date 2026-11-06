import { createProject } from '@/domain/ports/defaults';
import { parseProject, validationMessage } from '@/domain/ports/validation';
import type { Project } from '@/domain/ports/types';
export type Tab = 'engine' | 'design' | 'export' | 'time-area';
export interface StudioState {
  project: Project;
  selectedId: string;
  mirror: boolean;
  tab: Tab;
  past: Project[];
  future: Project[];
  message: string;
  ready: boolean;
}
export type Action =
  | { type: 'commit'; project: Project; selectedId?: string }
  | { type: 'restore'; project: Project }
  | { type: 'select'; id: string }
  | { type: 'tab'; tab: Tab }
  | { type: 'mirror'; value: boolean }
  | { type: 'message'; message: string }
  | { type: 'ready' }
  | { type: 'undo' }
  | { type: 'redo' };
export const initialState: StudioState = {
  project: createProject(),
  selectedId: 'ex',
  mirror: true,
  tab: 'design',
  past: [],
  future: [],
  message: '',
  ready: false,
};
export function studioReducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
    case 'commit':
    case 'restore': {
      try {
        const project = parseProject(action.project);
        return {
          ...state,
          project,
          selectedId:
            action.type === 'commit' &&
            project.ports.some((p) => p.id === (action.selectedId ?? state.selectedId))
              ? (action.selectedId ?? state.selectedId)
              : project.ports[0].id,
          past: action.type === 'commit' ? [...state.past, state.project].slice(-30) : [],
          future: [],
          message: '',
          ready: true,
        };
      } catch (error) {
        return { ...state, message: validationMessage(error) };
      }
    }
    case 'undo': {
      const project = state.past.at(-1);
      return project
        ? {
            ...state,
            project,
            selectedId: project.ports.some((p) => p.id === state.selectedId)
              ? state.selectedId
              : project.ports[0].id,
            past: state.past.slice(0, -1),
            future: [state.project, ...state.future],
            message: '',
          }
        : state;
    }
    case 'redo': {
      const project = state.future[0];
      return project
        ? {
            ...state,
            project,
            selectedId: project.ports.some((p) => p.id === state.selectedId)
              ? state.selectedId
              : project.ports[0].id,
            past: [...state.past, state.project],
            future: state.future.slice(1),
            message: '',
          }
        : state;
    }
    case 'select':
      return { ...state, selectedId: action.id };
    case 'tab':
      return { ...state, tab: action.tab };
    case 'mirror':
      return { ...state, mirror: action.value };
    case 'message':
      return { ...state, message: action.message };
    case 'ready':
      return { ...state, ready: true };
  }
}
