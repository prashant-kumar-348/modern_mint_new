"use client";

import { motion } from "framer-motion";
import type { GameMode } from "@/lib/lobby/types";

interface ModeCardProps {
  mode:     GameMode;
  selected: boolean;
  onSelect: () => void;
}

const MODE_CONFIG: Record<
  GameMode,
  {
    titleImg: string;
    titleAlt: string;
    subImg: string;
    subAlt: string;
    subHeight: string;
    symbol: string;
    symbolClass: string;
  }
> = {
  "60mins": {
    titleImg: "/lobby/create/60 Mins.png",
    titleAlt: "60 Mins",
    subImg: "/lobby/create/Standard Gameplay for 60 mins.png",
    subAlt: "Standard Gameplay for 60 mins",
    subHeight: "h-9 max-h-[38px]",
    symbol: "/lobby/modes/clock.png",
    symbolClass: "w-[185px] h-[185px]",
  },
  short: {
    titleImg: "/lobby/create/Short Mode.png",
    titleAlt: "Short Mode",
    subImg: "/lobby/create/Fast paced game for quick play.png",
    subAlt: "Fast paced game for quick play",
    subHeight: "h-9 max-h-[38px]",
    symbol: "/lobby/modes/lightning.png",
    symbolClass: "w-[165px] h-[215px]",
  },
  full: {
    titleImg: "/lobby/create/Full Mode.png",
    titleAlt: "Full Mode",
    subImg: "/lobby/create/Unlimited time.png",
    subAlt: "Unlimited time",
    subHeight: "h-4 max-h-[18px]",
    symbol: "/lobby/modes/crown.png",
    symbolClass: "w-[185px] h-[165px]",
  },
};

export default function ModeCard({ mode, selected, onSelect }: ModeCardProps) {
  const cfg = MODE_CONFIG[mode];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`relative w-[192px] h-[304px] rounded-[20px] flex flex-col items-center justify-center p-4 overflow-hidden cursor-pointer select-none transition-all duration-200 focus:outline-none flex-shrink-0 ${
        selected ? "opacity-100 brightness-105" : "opacity-75 hover:opacity-90"
      }`}
      style={{
        width: "192px",
        height: "304px",
        borderRadius: "20px",
        border: selected
          ? "1px solid transparent"
          : "1px solid rgba(135, 110, 55, 0.35)",
        background: selected
          ? "url('/lobby/create/mode-selected-bg.png') center/100% 100% no-repeat"
          : "url('/lobby/create/Rectangle 592.png') center/100% 100% no-repeat, radial-gradient(ellipse at 50% 20%, rgba(16, 44, 30, 0.85) 0%, rgba(8, 22, 15, 0.92) 65%, rgba(42, 32, 14, 0.85) 100%)",
        boxShadow: selected
          ? "0 0 28px rgba(240, 207, 116, 0.50), inset 0 0 16px rgba(240, 207, 116, 0.20)"
          : "0 8px 24px rgba(0,0,0,0.45)",
      }}
    >
      {/* ── Mode Symbol Watermark (User-provided Figma Vectors) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cfg.symbol}
          alt=""
          className={`${cfg.symbolClass} object-contain opacity-35 filter drop-shadow pointer-events-none select-none transition-opacity duration-200`}
        />
      </div>

      {/* ── Text Content using Figma embossed graphics ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cfg.titleImg}
          alt={cfg.titleAlt}
          className="h-5 max-h-[22px] w-auto object-contain pointer-events-none drop-shadow"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cfg.subImg}
          alt={cfg.subAlt}
          className={`${cfg.subHeight} w-auto object-contain pointer-events-none drop-shadow mt-3`}
        />
      </div>
    </motion.button>
  );
}
