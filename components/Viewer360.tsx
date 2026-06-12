"use client";

import { useEffect, useRef, useState } from "react";
import { frames360 } from "@/lib/frames360";

export type Viewer360Props = {
  slug: string;          // id del catálogo → busca frames en el manifest
  fallbackImg: string;   // foto estática si no hay frames (ej. "/motos/GSX-R1000R.png")
  alt: string;
  progreso: number;      // 0..1, controla el ángulo. Lo provee el padre (scroll-scrub o drag).
  className?: string;    // clases para el contenedor raíz
};

export default function Viewer360({
  slug,
  fallbackImg,
  alt,
  progreso,
  className,
}: Viewer360Props) {
  const { count, framePath } = frames360(slug);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);

  const [framesListas, setFramesListas] = useState(false);
  const [reduce, setReduce] = useState(false);

  // ─── Respetar prefers-reduced-motion ──────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // ─── Precargar frames reales (solo si count > 1) ──────────────────────────
  useEffect(() => {
    if (count <= 1) return;

    const imgs: HTMLImageElement[] = [];
    let cargadas = 0;

    for (let i = 1; i <= count; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        cargadas++;
        if (cargadas === count) setFramesListas(true);
      };
      imgs.push(img);
    }

    framesRef.current = imgs;
  }, [count, framePath]);

  // ─── Dibujar frame en canvas según progreso ───────────────────────────────
  const dibujar = (idx: number) => {
    const canvas = canvasRef.current;
    const frame = framesRef.current[idx];
    if (!canvas || !frame || !frame.complete || frame.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw === 0 || ch === 0) return;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const ir = frame.naturalWidth / frame.naturalHeight;
    const cr = cw / ch;
    let dw: number, dh: number;
    if (ir > cr) { dw = cw; dh = cw / ir; }
    else         { dw = ch * ir; dh = ch; }
    ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  };

  useEffect(() => {
    if (!framesListas) return;
    const idx = reduce
      ? Math.floor(count / 2)
      : Math.min(count - 1, Math.floor(progreso * count));
    dibujar(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progreso, framesListas, reduce, count]);

  // ─── Modo placeholder: transform CSS según progreso ───────────────────────
  const giro = reduce ? 0 : (progreso - 0.5) * 28;   // grados rotateY
  const escala = reduce ? 1 : 1 + progreso * 0.08;

  // ─── RENDER: modo frames reales ───────────────────────────────────────────
  if (count > 1) {
    return (
      <div className={`relative ${className ?? ""}`}>
        {/* Fallback visible mientras los frames no han cargado */}
        {!framesListas && (
          <img
            src={fallbackImg}
            alt={alt}
            className="h-full w-full object-contain drop-shadow-[0_30px_80px_rgba(226,35,26,0.28)]"
          />
        )}

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`h-full w-full${framesListas ? "" : " hidden"}`}
          style={{ willChange: "transform" }}
        />
      </div>
    );
  }

  // ─── RENDER: modo placeholder (no hay frames) ─────────────────────────────
  return (
    <div className={`relative ${className ?? ""}`}>
      <img
        src={fallbackImg}
        alt={alt}
        className="h-full w-full object-contain drop-shadow-[0_30px_80px_rgba(226,35,26,0.28)]"
        style={{
          transform: `perspective(1400px) rotateY(${giro}deg) scale(${escala})`,
          willChange: "transform",
        }}
      />
    </div>
  );
}
