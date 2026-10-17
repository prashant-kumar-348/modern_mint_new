"use client";

import { motion } from "framer-motion";

interface PageBackgroundProps {
  variant?: "default" | "lobby";
  blurred?: boolean;
}

export default function PageBackground({
  variant = "default",
  blurred = false,
}: PageBackgroundProps) {
  if (variant === "lobby") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        {/* Dark base — only fills overscroll/rubber-band gutters so they never flash green */}
        <div className="absolute inset-0" style={{ background: "#05080a" }} />

        {/* The SAME lobby-bg.jpg artwork as the full-page environment — same image/theme,
            blurred into soft cinematic bokeh when blurred is true. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/lobby-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: blurred
              ? "blur(5px) brightness(0.62) contrast(0.98) saturate(1.05)"
              : "brightness(0.55) contrast(0.92) saturate(0.9)",
            transform: blurred ? "scale(1.03)" : "none",
          }}
        />

        {/* Neutral darkening overlay — pushes the artwork back so the UI panels are the
            primary focus. */}
        <div
          className="absolute inset-0"
          style={{
            background: blurred
              ? "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.12) 0%, rgba(2,6,4,0.60) 100%)"
              : "rgba(2,6,4,0.45)",
          }}
        />
      </div>
    );
  }

  /* ── Default: teal circuit-board atmosphere ─────────────────────────── */
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ background: "var(--bg-deep)" }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(29,233,214,0.09) 0%, transparent 65%)",
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700, height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(29,233,214,0.05) 0%, rgba(212,168,67,0.03) 40%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--circuit) 1px, transparent 1px),
            linear-gradient(90deg, var(--circuit) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(29,233,214,0.35) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
          backgroundPosition: "26px 26px",
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(29,233,214,0.12) 0%, transparent 65%)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(212,168,67,0.07) 0%, transparent 65%)" }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(29,233,214,0.5) 20%, rgba(29,233,214,0.8) 50%, rgba(29,233,214,0.5) 80%, transparent)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(29,233,214,0.25) 50%, transparent)" }}
      />
      <div
        className="absolute top-0 left-0 bottom-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(29,233,214,0.3) 30%, rgba(29,233,214,0.3) 70%, transparent)",
        }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(29,233,214,0.3) 30%, rgba(29,233,214,0.3) 70%, transparent)",
        }}
      />
    </div>
  );
}
