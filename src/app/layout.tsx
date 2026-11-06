import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Port Studio — ออกแบบพอร์ตเสื้อสูบ',
  description: 'ออกแบบพอร์ตเครื่องยนต์สองจังหวะ แผนผัง 2D ภาพปลอกสูบ 3D และ Time–Area',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
