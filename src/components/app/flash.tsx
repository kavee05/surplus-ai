"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps a value that can change while the user watches (for example after an
 * assumption edit). On change, never on first render, it gets a short fading highlight.
 */
export function Flash({ value, children }: { value: string | number; children?: React.ReactNode }) {
  const first = useRef(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTick((t) => t + 1);
  }, [value]);
  return (
    <span key={tick} className={tick ? "num-flash" : undefined}>
      {children ?? value}
    </span>
  );
}
