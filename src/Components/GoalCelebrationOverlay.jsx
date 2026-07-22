import React, { useEffect, useMemo } from "react";

const COLORS = ["#3B82F6", "#60A5FA", "#F59E0B", "#22C55E", "#A855F7"];

export default function GoalCelebrationOverlay({
  open,
  durationMs = 5000,
  onDone,
}) {
  const pieces = useMemo(() => {
    const count = 120;
    return Array.from({ length: count }, (_, idx) => {
      const left = Math.random() * 100;
      const size = 6 + Math.random() * 6;
      const delay = Math.random() * 0.25;
      const fall = 1.6 + Math.random() * 0.8;
      const color = COLORS[idx % COLORS.length];

      return {
        id: idx,
        left,
        size,
        delay,
        fall,
        color,
      };
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onDone?.(), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onDone]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <style>{`
        @keyframes rh_confetti_fall {
          0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(0, 110vh, 0) rotate(540deg); opacity: 0.95; }
        }
        @keyframes rh_pop {
          0% { transform: translate3d(-50%, -50%, 0) scale(0.95); opacity: 0; }
          15% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
          100% { transform: translate3d(-50%, -50%, 0) scale(1); opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black/10" />

      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${Math.max(6, p.size * 1.4)}px`,
            backgroundColor: p.color,
            animation: `rh_confetti_fall ${p.fall}s linear ${p.delay}s both`,
            transformOrigin: "center",
          }}
        />
      ))}

      <div
        className="absolute left-1/2 top-1/2 px-6 py-4 rounded-2xl bg-white shadow-2xl text-center"
        style={{ animation: "rh_pop 0.25s ease-out both" }}
      >
        <p className="text-lg font-semibold text-gray-900">
          congratulations you&apos;ve reached your goal
        </p>
      </div>
    </div>
  );
}
