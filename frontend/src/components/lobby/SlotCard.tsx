"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SlotDropdown } from "@/lib/lobby/types";
import { BotIcon } from "./PlayerAvatar";
import { personInitials } from "./PersonAvatar";
import { getUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";

const AVATAR_IMAGE_MAP: Record<number, string> = {
  1: "/lobby/join/founder-avatar-1.png",
  2: "/lobby/join/founder-avatar-4.png",
  3: "/lobby/join/founder-avatar-3.png",
  4: "/lobby/join/founder-avatar-2.png",
  5: "/lobby/join/Ellipse 197.png",
  6: "/lobby/join/Ellipse 198.png",
};

interface SlotCardProps {
  index:    number;
  dropdown: SlotDropdown;
  avatarId: number;
  name:     string;
  onChange: (dropdown: SlotDropdown) => void;
  isYou?:   boolean;
  allowAI?: boolean;
}

const ALL_DROPDOWN_OPTIONS: { value: SlotDropdown; label: string; icon: string }[] = [
  { value: "Open",   label: "Open Slot", icon: "➕" },
  { value: "Friend", label: "Friend",    icon: "👤" },
  { value: "AI",     label: "AI Bot",    icon: "🤖" },
];

export default function SlotCard({
  index,
  dropdown,
  avatarId,
  name,
  onChange,
  isYou = false,
  allowAI = false,
}: SlotCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset imgError when avatarId or name changes
  useEffect(() => {
    setImgError(false);
  }, [avatarId, name]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const isOpen = dropdown === "Open";
  const isAI   = dropdown === "AI";

  const currentUser = typeof window !== "undefined" ? getUser() : null;
  const displayName = isYou
    ? (name && name !== "You" ? name.toUpperCase() : currentUser?.username?.toUpperCase() || "YOU")
    : isAI
    ? (name ? name.toUpperCase() : index === 3 ? "ROHAN" : "AI BOT")
    : isOpen
    ? "OPEN SLOT"
    : (name ? name.toUpperCase() : "FRIEND");

  let resolvedAvatar: string | undefined = undefined;
  if (!isOpen && !isAI) {
    if (isYou && currentUser?.profile_image_url) {
      resolvedAvatar = currentUser.profile_image_url.startsWith("http") || currentUser.profile_image_url.startsWith("data:")
        ? currentUser.profile_image_url
        : `${API_BASE_URL}${currentUser.profile_image_url}`;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative flex flex-col items-center gap-2 flex-1 select-none"
      ref={menuRef}
    >
      {/* ── Avatar / Open Circle ── */}
      <div
        onClick={() => {
          if (!isYou) setMenuOpen((prev) => !prev);
        }}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
          !isYou ? "cursor-pointer hover:scale-105" : ""
        }`}
        title={!isYou ? "Click to configure slot" : "Your slot"}
      >
        {isOpen ? (
          // Dashed mint circle with "+"
          <div
            className="w-full h-full rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              border: "2px dashed rgba(43, 248, 184, 0.70)",
              background: "rgba(6, 26, 18, 0.35)",
              boxShadow: "inset 0 0 14px rgba(43, 248, 184, 0.12)",
            }}
          >
            <span
              className="text-2xl font-light leading-none select-none"
              style={{ color: "#2bf8b8", textShadow: "0 0 10px rgba(43,248,184,0.6)" }}
            >
              +
            </span>
          </div>
        ) : isAI ? (
          // AI Bot Slot
          <div
            className="w-full h-full rounded-full flex items-center justify-center relative"
            style={{
              border: "1.5px solid rgba(29,233,214,0.35)",
              background: "rgba(29,233,214,0.08)",
              boxShadow: "0 0 14px rgba(29,233,214,0.20)",
            }}
          >
            <BotIcon size={70} />
          </div>
        ) : (
          // Solid mint glowing circle with player avatar or initials
          <div
            className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center font-black text-2xl select-none"
            style={{
              border: "2px solid #2bf8b8",
              boxShadow: "0 0 18px rgba(43, 248, 184, 0.65), inset 0 0 10px rgba(43, 248, 184, 0.3)",
              background:
                resolvedAvatar && !imgError
                  ? "#04190d"
                  : "radial-gradient(circle at 38% 32%, rgba(40,220,110,0.55), rgba(4,26,13,0.96))",
              color: "#d6ffe6",
            }}
          >
            {resolvedAvatar && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedAvatar}
                alt={displayName}
                className="w-full h-full object-cover object-center pointer-events-none"
                onError={() => setImgError(true)}
              />
            ) : (
              personInitials(displayName)
            )}

            {/* Green online dot at bottom-right */}
            <span
              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#04190d]"
              style={{
                background: "#2bff84",
                boxShadow: "0 0 8px #2bff84",
              }}
            />
          </div>
        )}

        {/* Small subtle edit indicator for host on hover */}
        {!isYou && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0a2e1d] border border-[#d6b25a] text-[#d6b25a] text-[10px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-md"
            title="Configure slot"
          >
            ⚙
          </span>
        )}
      </div>

      {/* ── Name Pill (using Rectangle 582.png from zip) ── */}
      <div
        onClick={() => {
          if (!isYou) setMenuOpen((prev) => !prev);
        }}
        className={`relative w-[130px] h-8 flex items-center justify-center transition-transform ${
          !isYou ? "cursor-pointer hover:scale-[1.03]" : ""
        }`}
        style={{
          backgroundImage: "url('/lobby/create/Rectangle 582.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {isOpen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/lobby/create/OPEN SLOT.png"
            alt="OPEN SLOT"
            className="h-3.5 max-h-[16px] w-auto object-contain pointer-events-none drop-shadow"
          />
        ) : displayName === "BECK" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/lobby/create/BECK.png"
            alt="BECK"
            className="h-3.5 max-h-[16px] w-auto object-contain pointer-events-none drop-shadow"
          />
        ) : displayName === "ROHAN" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/lobby/create/ROHAN.png"
            alt="ROHAN"
            className="h-3.5 max-h-[16px] w-auto object-contain pointer-events-none drop-shadow"
          />
        ) : (
          <span
            className="text-[11px] font-black tracking-wider uppercase truncate px-2 text-white"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.9)",
            }}
          >
            {displayName}
          </span>
        )}
      </div>

      {/* ── Optional AI Bot tag below pill only when isAI ── */}
      {isAI && (
        <div className="mt-1 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lobby/create/AI Bot.png"
            alt="AI Bot"
            className="h-3 max-h-[13px] w-auto object-contain pointer-events-none drop-shadow"
          />
        </div>
      )}

      {/* ── Host slot configuration popup menu (Functionality Preserved) ── */}
      <AnimatePresence>
        {menuOpen && !isYou && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full z-40 mt-1 w-32 py-1.5 rounded-xl border flex flex-col gap-1 shadow-2xl"
            style={{
              background: "rgba(6, 26, 18, 0.96)",
              borderColor: "rgba(214, 178, 90, 0.65)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.7), 0 0 15px rgba(43,248,184,0.2)",
            }}
          >
            {ALL_DROPDOWN_OPTIONS.filter((opt) => allowAI || opt.value !== "AI").map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-left transition-colors cursor-pointer ${
                  dropdown === opt.value
                    ? "text-[#2bf8b8] bg-[rgba(43,248,184,0.15)]"
                    : "text-white/80 hover:text-white hover:bg-[rgba(214,178,90,0.15)]"
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
