import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import * as THREE from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ── Satellite canvas ─────────────────────────────────────── */
function SatelliteCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 7);

    // Light-mode lighting — strong directional, warm
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(6, 8, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8080ff, 0.4);
    fill.position.set(-5, -2, -5);
    scene.add(fill);

    const sat = new THREE.Group();
    scene.add(sat);

    const loader = new GLTFLoader();
    loader.load('src/satellite.glb',
      function (gltf) {
        const model = gltf.scene;
        sat.add(model)
      }
    )

    sat.scale.setScalar(1.6);
    sat.position.set(2.5, 0.2, -1);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      sat.rotation.y = t * 0.18;
      sat.rotation.x = Math.sin(t * 0.11) * 0.15;
      sat.rotation.z = Math.cos(t * 0.07) * 0.08;
      sat.position.y = 0.2 + Math.sin(t * 0.4) * 0.12;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.2 }} />
  );
}

/* ── Subtle crosses canvas ────────────────────────────────── */
function CrossCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const SPACING = 80;
    const crosses = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      crosses.length = 0;
      const cols = Math.ceil(canvas.width  / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          crosses.push({ x: c * SPACING, y: r * SPACING, angle: Math.random() * Math.PI * 2, speed: (Math.random() - 0.5) * 0.01 });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      for (const c of crosses) {
        c.angle += c.speed;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.scale(1.5,1.5);
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
      }
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
}

/* ── Wandering photo ──────────────────────────────────────── */
const IMG_SIZE = 180;
const PADDING  = 20;

function WanderingPhoto({ containerRef }) {
  const posRef   = useRef({ x: 200, y: 100 });
  const velRef   = useRef({ x: 0.6, y: 0.4 });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const imgRef   = useRef(null);
  const animId   = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    const REPEL_RADIUS = 200, REPEL_STRENGTH = 3.5, SPEED = 1.2, DAMPING = 0.98;
    const onMouseMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouseMove);

    const loop = () => {
      const container = containerRef.current;
      if (!container) { animId.current = requestAnimationFrame(loop); return; }
      const rect = container.getBoundingClientRect();
      const maxX = rect.width  - IMG_SIZE - PADDING;
      const maxY = rect.height - IMG_SIZE - PADDING;
      const absX = rect.left + posRef.current.x + IMG_SIZE / 2;
      const absY = rect.top  + posRef.current.y + IMG_SIZE / 2;
      const dx = absX - mouseRef.current.x;
      const dy = absY - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
        velRef.current.x += (dx / dist) * force;
        velRef.current.y += (dy / dist) * force;
      }
      velRef.current.x *= DAMPING;
      velRef.current.y *= DAMPING;
      const speed = Math.sqrt(velRef.current.x ** 2 + velRef.current.y ** 2);
      if (speed < SPEED) {
        velRef.current.x += (velRef.current.x / (speed || 1)) * 0.05;
        velRef.current.y += (velRef.current.y / (speed || 1)) * 0.05;
      }
      posRef.current.x += velRef.current.x;
      posRef.current.y += velRef.current.y;
      if (posRef.current.x < PADDING) { posRef.current.x = PADDING; velRef.current.x =  Math.abs(velRef.current.x) * 1.1; }
      if (posRef.current.x > maxX)    { posRef.current.x = maxX;    velRef.current.x = -Math.abs(velRef.current.x) * 1.1; }
      if (posRef.current.y < PADDING) { posRef.current.y = PADDING; velRef.current.y =  Math.abs(velRef.current.y) * 1.1; }
      if (posRef.current.y > maxY)    { posRef.current.y = maxY;    velRef.current.y = -Math.abs(velRef.current.y) * 1.1; }
      setStyle({ transform: `translate(${posRef.current.x}px, ${posRef.current.y}px)` });
      animId.current = requestAnimationFrame(loop);
    };

    animId.current = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMouseMove); cancelAnimationFrame(animId.current); };
  }, [containerRef]);

  return (
    <img
      ref={imgRef}
      src="face.jpg"
      alt="Toby Tomkinson"
      style={{
        position: 'absolute', top: 0, left: 0,
        width: `${IMG_SIZE}px`, height: `${IMG_SIZE}px`,
        objectFit: 'cover', borderRadius: '50%',
        border: '3px solid rgba(108, 99, 255, 0.4)',
        boxShadow: '0 4px 24px rgba(108, 99, 255, 0.25)',
        willChange: 'transform', pointerEvents: 'none', zIndex: 3,
        ...style,
      }}
    />
  );
}


/* ── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const containerRef = useRef(null);

  return (
    <React.Fragment>
      <SatelliteCanvas />
      <CrossCanvas />

      <div className="fade-in-element" style={{ position: 'relative', zIndex: 2 }}>
        <div
          ref={containerRef}
          style={{ position: 'relative', minHeight: '320px', padding: '3rem 0 2rem', overflow: 'hidden' }}
        >
          <WanderingPhoto containerRef={containerRef} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '560px' }}>
            <span className="label">Portfolio</span>
            <h1 style={{ marginBottom: '0.4em' }}>Toby Tomkinson</h1>
            <h2 style={{ fontWeight: 400, color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem', letterSpacing: '0' }}>
              Doctoral Student · Software Developer · CS Graduate
            </h2>
            <p style={{ marginBottom: '1rem'}}>
              I research satellite networking, low Earth orbit (LEO) systems, and caching strategies at the University of Auckland — building simulation tools and visualisers along the way.
            </p>
            <p style={{ marginBottom: '2rem'}}>
              This site showcases my work, from satellite simulators to game dev. Always happy to connect about research, project ideas, or tech.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="https://www.linkedin.com/in/toby-j-tomkinson/">
                <button type="button">LinkedIn</button>
              </Link>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-light)', letterSpacing: '0.08em' }}>
                Updated March 2026
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0 2rem' }} />

        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          {[
            { value: 'PhD',   label: 'Current study' },
            { value: 'UoA',   label: 'University of Auckland' },
            { value: 'LEO',   label: 'Research focus' },
            { value: 'UE4/5', label: 'Game dev stack' },
          ].map(({ value, label }) => (
            <div key={value}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-light)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}
