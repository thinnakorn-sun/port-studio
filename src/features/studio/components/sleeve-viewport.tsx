'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Project } from '@/domain/ports/types';
import { createSleeveGeometry } from '@/rendering/three/sleeve-geometry';
interface SceneHandle {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  mesh: THREE.Mesh;
  render: () => void;
}
export default function SleeveViewport({ project }: { project: Project }) {
  const host = useRef<HTMLDivElement>(null),
    handle = useRef<SceneHandle | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 2000);
    camera.position.set(100, 65, 145);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 65;
    controls.maxDistance = 400;
    controls.enablePan = false;
    const material = new THREE.MeshStandardMaterial({
      color: 0xf18b38,
      roughness: 0.48,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    scene.add(mesh);
    scene.add(new THREE.HemisphereLight(0xd8edff, 0x1b1210, 2));
    const key = new THREE.DirectionalLight(0xffe0bf, 3);
    key.position.set(70, 100, 80);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fd0ff, 1.4);
    rim.position.set(-70, 30, -70);
    scene.add(rim);
    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const width = container.clientWidth,
        height = 360;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    controls.addEventListener('change', render);
    container.appendChild(renderer.domElement);
    const lose = (e: Event) => {
      e.preventDefault();
      setError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', lose);
    handle.current = { renderer, scene, camera, controls, mesh, render };
    resize();
    return () => {
      observer.disconnect();
      controls.removeEventListener('change', render);
      controls.dispose();
      mesh.geometry.dispose();
      material.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', lose);
      renderer.dispose();
      renderer.domElement.remove();
      handle.current = null;
    };
  }, []);
  useEffect(() => {
    const h = handle.current;
    if (!h) return;
    const previous = h.mesh.geometry;
    h.mesh.geometry = createSleeveGeometry(project);
    previous.dispose();
    h.render();
  }, [project.engine.bore, project.sleeve.height, project.sleeve.wall, project.ports]);
  function view(action: 'in' | 'out' | 'reset') {
    const h = handle.current;
    if (!h) return;
    if (action === 'reset') h.camera.position.set(100, 65, 145);
    else {
      h.camera.position.multiplyScalar(action === 'in' ? 0.88 : 1.12);
      h.camera.position.clampLength(65, 400);
    }
    h.controls.update();
    h.render();
  }
  return (
    <div className="viewport-wrap">
      <div className="viewport-tools">
        <button aria-label="ซูมเข้า 3D" onClick={() => view('in')}>
          <ZoomIn size={16} />
        </button>
        <button aria-label="ซูมออก 3D" onClick={() => view('out')}>
          <ZoomOut size={16} />
        </button>
        <button aria-label="รีเซ็ตมุม 3D" onClick={() => view('reset')}>
          <RotateCcw size={16} />
        </button>
      </div>
      {error ? (
        <div className="webgl-fallback" role="status">
          <Box size={32} />
          <p>เครื่องนี้ไม่รองรับ WebGL หรือการแสดงผล 3D ถูกหยุด</p>
          <small>ยังออกแบบและส่งออกแผนผัง 2D ได้ตามปกติ</small>
        </div>
      ) : null}
      <div
        ref={host}
        className="sleeve-viewport"
        role="img"
        aria-label="ปลอกสูบสามมิติ ลากเพื่อหมุนและเลื่อนเพื่อซูม"
        hidden={error}
      />
      <span className="viewport-caption">THREE.JS · LIVE GEOMETRY</span>
    </div>
  );
}
