"use client";

import { motion } from "framer-motion";
import type { PlayerRole } from "@/lib/lobby/types";

interface RoleCardProps {
  role:     PlayerRole;
  selected: boolean;
  onSelect: () => void;
}

export default function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  const isFounder = role === "founder";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`relative flex flex-col items-center justify-between p-5 rounded-[24px] w-full h-[410px] cursor-pointer text-center select-none transition-all duration-200 focus:outline-none ${
        selected ? "opacity-100 brightness-105" : "opacity-75 hover:opacity-90"
      }`}
      style={{
        backgroundImage: `url('${selected ? "/lobby/join/Rectangle 593.png" : "/lobby/join/Rectangle 592.png"}')`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        boxShadow: selected
          ? "0 0 30px rgba(240, 207, 116, 0.50), inset 0 0 16px rgba(240, 207, 116, 0.25)"
          : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top section: Icon & Title & Tagline */}
      <div className="flex flex-col items-center w-full pt-7 md:pt-8">
        <div className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isFounder ? "/lobby/join/Frame-1.png" : "/lobby/join/Frame.png"}
            alt=""
            className="w-20 h-20 md:w-24 md:h-24 object-contain pointer-events-none drop-shadow"
          />
        </div>

        {/* Title */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isFounder ? "/lobby/join/FOUNDER.png" : "/lobby/join/INVESTOR.png"}
          alt={isFounder ? "FOUNDER" : "INVESTOR"}
          className="h-4 md:h-5 w-auto object-contain pointer-events-none drop-shadow mt-5 md:mt-6"
        />

        {/* Tagline */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            isFounder
              ? "/lobby/join/Build . Risk . Survive.png"
              : "/lobby/join/Fund . Controll . Multiply..png"
          }
          alt=""
          className="h-3 md:h-3.5 w-auto object-contain pointer-events-none drop-shadow mt-2"
        />
      </div>

      {/* Middle section: Round details */}
      <div className="flex flex-col items-center justify-center my-auto py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            isFounder
              ? "/lobby/join/Round 1 _ $500k.png"
              : "/lobby/join/Round 1 _ $2000k Round 2 _ $5000k Round 7 _ $10000k.png"
          }
          alt="Rounds"
          className={
            isFounder
              ? "h-5 md:h-5.5 w-auto object-contain pointer-events-none drop-shadow"
              : "h-12 md:h-14 w-auto object-contain pointer-events-none drop-shadow"
          }
        />
      </div>

      {/* Bottom section: Footer pitch */}
      <div className="pb-3 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            isFounder
              ? "/lobby/join/Build your vision , lead the team and pitch the investors.png"
              : "/lobby/join/Build your vision , lead the team and pitch the investors-1.png"
          }
          alt="Build your vision"
          className="h-7 md:h-8 w-auto object-contain pointer-events-none drop-shadow"
        />
      </div>
    </motion.button>
  );
}
