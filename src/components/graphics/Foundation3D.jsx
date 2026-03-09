import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Foundation3D({ foundation, results }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const A  = ((results?.dimensions?.A  || foundation.base_width_A  || 200)) / 100;
    const B  = ((results?.dimensions?.B  || foundation.base_length_B || 200)) / 100;
    const H  = (foundation.base_height_H || 50) / 100;
    const cx = (foundation.column_cx || 30) / 100;
    const cy = (foundation.column_cy || 30) / 100;
    const colH = H * 2;
    const cover = 0.075; // 7.5 cm in scene units

    const W = el.clientWidth;
    const HEIGHT = 380;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    // Camera
    const diag = Math.max(A, B) * 1.4;
    const camera = new THREE.PerspectiveCamera(40, W / HEIGHT, 0.01, 200);
    camera.position.set(diag, diag * 0.9, diag);
    camera.lookAt(0, H, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    scene.add(dir);

    // Ground
    const gGeo = new THREE.PlaneGeometry(A * 4, B * 4);
    const gMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.005;
    ground.receiveShadow = true;
    scene.add(ground);

    // Foundation slab
    const fGeo = new THREE.BoxGeometry(A, H, B);
    const fMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const fMesh = new THREE.Mesh(fGeo, fMat);
    fMesh.position.y = H / 2;
    fMesh.castShadow = true;
    fMesh.receiveShadow = true;
    scene.add(fMesh);

    // Foundation wireframe
    const fEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(fGeo),
      new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 1 })
    );
    fEdge.position.y = H / 2;
    scene.add(fEdge);

    // Column stub
    const cGeo = new THREE.BoxGeometry(cx, colH, cy);
    const cMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.y = H + colH / 2;
    cMesh.castShadow = true;
    scene.add(cMesh);
    const cEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(cGeo),
      new THREE.LineBasicMaterial({ color: 0x1e293b })
    );
    cEdge.position.y = H + colH / 2;
    scene.add(cEdge);

    // Rebars X (red) — parallel to X axis
    const bx = results?.reinforcement?.bars_x;
    if (bx) {
      const n = Math.min(bx.count || 4, 10);
      const db = Math.max((bx.diameter / 10) / 100 / 2, 0.006);
      const rLen = A - cover * 2;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const z = -B / 2 + cover + t * (B - cover * 2);
        const geo = new THREE.CylinderGeometry(db, db, rLen, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(0, cover + db, z);
        scene.add(mesh);
      }
    }

    // Rebars Y (blue) — parallel to Z axis
    const by = results?.reinforcement?.bars_y;
    if (by) {
      const n = Math.min(by.count || 4, 10);
      const db = Math.max((by.diameter / 10) / 100 / 2, 0.006);
      const rLen = B - cover * 2;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const x = -A / 2 + cover + t * (A - cover * 2);
        const geo = new THREE.CylinderGeometry(db, db, rLen, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, cover + db * 2.5, 0);
        scene.add(mesh);
      }
    }

    // Legend labels via HTML overlay (simple, no canvas text)
    // Auto-rotating camera
    let animId;
    let theta = Math.PI / 4;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      theta += 0.006;
      camera.position.x = Math.sin(theta) * diag * 1.8;
      camera.position.z = Math.cos(theta) * diag * 1.8;
      camera.lookAt(0, H, 0);
      renderer.render(scene, camera);
    };
    animate();

    // Mouse drag to pause/resume rotation
    let isDragging = false;
    let prevX = 0, autoTheta = theta;

    const onDown = (e) => { isDragging = true; prevX = e.clientX; };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      theta += dx * 0.01;
      prevX = e.clientX;
    };
    const onUp = () => { isDragging = false; };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [foundation, results]);

  return (
    <div className="space-y-2">
      <div
        ref={mountRef}
        className="w-full rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: 380 }}
      />
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Arm. X
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> Arm. Y
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-400" /> Hormigón
        </span>
        <span className="text-slate-400 italic">Arrastar para rotar</span>
      </div>
    </div>
  );
}