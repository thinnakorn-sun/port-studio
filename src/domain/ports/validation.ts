import { z } from 'zod';
import { isSimplePolygon } from './geometry';
const point = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]);
const portSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(80),
  kind: z.enum(['exhaust', 'transfer', 'boost']),
  centerX: z.number().finite(),
  width: z.number().positive(),
  top: z.number().min(0),
  bottom: z.number().positive(),
  preset: z.enum(['rounded', 'roof', 'rectangle']),
  mirrorId: z.string().optional(),
  points: z.array(point).min(3).max(100).optional(),
});
export const projectSchema = z
  .object({
    version: z.literal(1),
    engine: z.object({
      bore: z.number().min(20).max(150),
      stroke: z.number().min(10).max(150),
      rod: z.number().min(10).max(400),
      rpm: z.number().min(100).max(40000),
    }),
    sleeve: z.object({ height: z.number().min(20).max(250), wall: z.number().min(0.5).max(10) }),
    targets: z.object({
      exhaust: z.number().min(0.0000001).max(0.1),
      transfer: z.number().min(0.0000001).max(0.1),
    }),
    ports: z.array(portSchema).min(1).max(40),
  })
  .superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (s.engine.rod <= s.engine.stroke / 2) fail('ก้านสูบต้องยาวกว่าครึ่งช่วงชัก');
    if (s.sleeve.height < s.engine.stroke) fail('ปลอกสูบต้องสูงไม่น้อยกว่าช่วงชัก');
    const ids = new Set(s.ports.map((p) => p.id));
    if (ids.size !== s.ports.length) fail('รหัสพอร์ตซ้ำกัน');
    for (const p of s.ports) {
      if (p.bottom <= p.top || p.bottom > s.sleeve.height)
        fail('ขอบล่างต้องอยู่ใต้ขอบบนและไม่เกินความสูงปลอก');
      if (
        p.width > (Math.PI * s.engine.bore) / 2 ||
        p.centerX - p.width / 2 < -1e-7 ||
        p.centerX + p.width / 2 > Math.PI * s.engine.bore + 1e-7
      )
        fail('พอร์ตต้องอยู่ในแผ่นคลี่ และกว้างไม่เกินครึ่งเส้นรอบวง');
      if (p.points && !isSimplePolygon(p.points)) fail('รูปพอร์ตมีเส้นตัดกันหรือพื้นที่เป็นศูนย์');
      if (p.mirrorId) {
        const q = s.ports.find((q) => q.id === p.mirrorId);
        if (!q || q.id === p.id || q.mirrorId !== p.id) fail('ข้อมูลคู่สมมาตรไม่ถูกต้อง');
      }
    }
  });
export function parseProject(value: unknown) {
  return projectSchema.parse(value);
}
export function validationMessage(error: unknown): string {
  return error instanceof z.ZodError
    ? (error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง')
    : 'ไม่สามารถอ่านโปรเจกต์ได้';
}
