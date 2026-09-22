import { useEffect, useRef } from "react";

/**
 * Slow-drifting starfield painted on a 2D canvas (cheap enough for mobile,
 * and it never blocks the 3D globe's GPU budget).
 */
export function Starfield({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let stars: { x: number; y: number; r: number; a: number; s: number }[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const count = Math.round(((w * h) / 9000) * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.25,
        a: Math.random() * Math.PI * 2,
        s: Math.random() * 0.45 + 0.15,
      }));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const star of stars) {
        star.a += 0.012 * star.s;
        const twinkle = 0.45 + Math.sin(star.a) * 0.35;
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = "#E8E6E1";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
