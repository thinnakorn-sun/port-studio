import { parseProject } from '@/domain/ports/validation';
import type { Project } from '@/domain/ports/types';
const KEY = 'port-studio:project:v1';
export function loadProject(): Project | null {
  const data = localStorage.getItem(KEY);
  return data ? parseProject(JSON.parse(data)) : null;
}
export function persistProject(project: Project): void {
  localStorage.setItem(KEY, JSON.stringify(project));
}
export async function importProject(file: File): Promise<Project> {
  if (file.size > 1_000_000) throw new Error('ไฟล์ใหญ่เกิน 1 MB');
  return parseProject(JSON.parse(await file.text()));
}
