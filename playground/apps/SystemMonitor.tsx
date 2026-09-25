import { useEffect, useRef, useState } from 'react';
import { useDesktopState } from 'deskui';

// Gerçek tarayıcı ölçümleri: FPS, DOM düğümü sayısı, JS heap (Chromium), açık pencereler.

const HISTORY = 60;

function Sparkline({ values, max, color }: { values: number[]; max: number; color: string }) {
  const w = 240;
  const h = 56;
  const pts = values.map((v, i) => `${(i / (HISTORY - 1)) * w},${h - (Math.min(v, max) / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg className="demo-mon__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={`0,${h} ${pts} ${((values.length - 1) / (HISTORY - 1)) * w},${h}`} fill={color} opacity=".15" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SystemMonitorApp() {
  const windows = useDesktopState((s) => Object.keys(s.windows).length);
  const workspace = useDesktopState((s) => `${s.activeWorkspace + 1}/${s.preferences.workspaces}`);
  const viewport = useDesktopState((s) => s.viewport);
  const [fps, setFps] = useState<number[]>([]);
  const [nodes, setNodes] = useState<number[]>([]);
  const [heap, setHeap] = useState<number[]>([]);
  const frames = useRef(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      frames.current += 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    let last = performance.now();
    const timer = setInterval(() => {
      const t = performance.now();
      const f = Math.round((frames.current * 1000) / (t - last));
      frames.current = 0;
      last = t;
      const push = (arr: number[], v: number) => [...arr, v].slice(-HISTORY);
      setFps((a) => push(a, f));
      setNodes((a) => push(a, document.getElementsByTagName('*').length));
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      if (mem) setHeap((a) => push(a, mem.usedJSHeapSize / 1048576));
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, []);

  const lastOf = (a: number[]) => a[a.length - 1] ?? 0;

  return (
    <div className="demo-mon">
      <div className="demo-mon__card">
        <div className="demo-mon__head">
          <span>Kare hızı</span>
          <strong>{lastOf(fps)} FPS</strong>
        </div>
        <Sparkline values={fps} max={Math.max(60, ...fps)} color="var(--dui-accent)" />
      </div>
      <div className="demo-mon__card">
        <div className="demo-mon__head">
          <span>DOM düğümleri</span>
          <strong>{lastOf(nodes).toLocaleString('tr-TR')}</strong>
        </div>
        <Sparkline values={nodes} max={Math.max(100, ...nodes) * 1.2} color="#2ec27e" />
      </div>
      <div className="demo-mon__card">
        <div className="demo-mon__head">
          <span>JS bellek</span>
          <strong>{heap.length ? `${lastOf(heap).toFixed(1)} MB` : 'Bu tarayıcıda yok'}</strong>
        </div>
        {heap.length > 0 && <Sparkline values={heap} max={Math.max(...heap) * 1.3} color="#e5a50a" />}
      </div>
      <dl className="demo-mon__facts">
        <div>
          <dt>Açık pencere</dt>
          <dd>{windows}</dd>
        </div>
        <div>
          <dt>Çalışma alanı</dt>
          <dd>{workspace}</dd>
        </div>
        <div>
          <dt>Masaüstü alanı</dt>
          <dd>
            {viewport.width}×{viewport.height}
          </dd>
        </div>
      </dl>
    </div>
  );
}
