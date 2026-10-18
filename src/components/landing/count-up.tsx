"use client";

import { useEffect, useRef, useState } from "react";

/** Renders the final number on the server; on the client it counts up once from 0 (skipped for reduced motion). */
export function CountUp({ to, delay = 500, duration = 900 }: { to: number; delay?: number; duration?: number }) {
  const [n, setN] = useState(to);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    started.current = true;
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / duration));
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    setN(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, duration]);
  return <>{n.toLocaleString("en-MY")}</>;
}
