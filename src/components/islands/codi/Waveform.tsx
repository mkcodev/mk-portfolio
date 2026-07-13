import { useEffect, useRef, useState } from 'react';

interface Props {
  active: boolean;
}

const FREQS = [1.7, 2.3, 3.1] as const;
const OPACITIES = [0.9, 0.5, 0.3] as const;
const PHASE_SPEED = 2.4;
const W = 48;
const H = 20;
const CY = H / 2;

export default function Waveform({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envelopeRef = useRef(0);
  const phasesRef = useRef([0, 0, 0]);
  const rafRef = useRef(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    let lastTs = performance.now();

    const draw = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      if (active) {
        envelopeRef.current = Math.min(1, envelopeRef.current + dt / 0.4);
      } else {
        envelopeRef.current = Math.max(0, envelopeRef.current - dt / 0.25);
        if (envelopeRef.current === 0) {
          ctx.clearRect(0, 0, W, H);
          setGone(true);
          return;
        }
      }

      const breathe = 1 + 0.2 * Math.sin(ts * 0.001 * 0.8 * Math.PI * 2);
      const amplitude = 6 * envelopeRef.current * breathe;

      for (let i = 0; i < 3; i++) {
        phasesRef.current[i] = (phasesRef.current[i] ?? 0) + PHASE_SPEED * dt;
      }

      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,219,213,${OPACITIES[i] * envelopeRef.current})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= W; x++) {
          const t = (x / W) * Math.PI * 2 * FREQS[i] + (phasesRef.current[i] ?? 0);
          const y = CY + Math.sin(t) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (gone) return null;

  return (
    <canvas
      ref={canvasRef}
      className="codi-waveform"
      role="status"
      aria-label="Codi está pensando…"
    />
  );
}
