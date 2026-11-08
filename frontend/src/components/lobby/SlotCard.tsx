"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SlotDropdown } from "@/lib/lobby/types";
import { BotIcon } from "./PlayerAvatar";
import { personInitials } from "./PersonAvatar";
import { getUser, type StoredUser } from "@/lib/auth";
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
  onChange?: (dropdown: SlotDropdown) => void;
  isYou?:   boolean;
  allowAI?: boolean;
}

export default function SlotCard({
  index,
  dropdown,
  avatarId,
  name,
  onChange,
  isYou = false,
  allowAI = true,
}: SlotCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => 
    typeof window !== "undefined" ? getUser() : null
  );

  useEffect(() => {
    const handleUpdate = () => setCurrentUser(getUser());
    window.addEventListener("mm_profile_updated", handleUpdate);
    return () => window.removeEventListener("mm_profile_updated", handleUpdate);
  }, []);

  // Close menu on outside click
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

  // Reset imgError when avatarId or name changes
  useEffect(() => {
    setImgError(false);
  }, [avatarId, name, currentUser?.profile_image_url]);

  const isOpen = dropdown === "Open";
  const isAI   = dropdown === "AI";

  const displayName = isYou
    ? (name && name !== "You" ? name.toUpperCase() : currentUser?.username?.toUpperCase() || "YOU")
    : isAI
    ? (name ? name.toUpperCase() : "AI BOT")
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
      {/* ── Avatar / Open Circle (Clickable when not host) ── */}
      <div
        onClick={() => {
          if (!isYou) setMenuOpen((prev) => !prev);
        }}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 group ${
          !isYou ? "cursor-pointer hover:scale-105 active:scale-95" : ""
        }`}
        title={!isYou ? "Click to toggle between Open Slot and AI Bot" : "Your slot"}
      >
        {isOpen ? (
          // Dashed mint circle with "+"
          <div
            className="w-full h-full rounded-full flex items-center justify-center transition-all duration-200 group-hover:border-[#2bf8b8]"
            style={{
              border: "2px dashed rgba(43, 248, 184, 0.70)",
              background: "rgba(6, 26, 18, 0.35)",
              boxShadow: "inset 0 0 14px rgba(43, 248, 184, 0.12)",
            }}
          >
            <span
              className="text-2xl font-light leading-none select-none transition-transform group-hover:scale-110"
              style={{ color: "#2bf8b8", textShadow: "0 0 10px rgba(43,248,184,0.6)" }}
            >
              +
            </span>
          </div>
        ) : isAI ? (
          // AI Bot Slot
          <div
            className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-200 group-hover:border-[#1de9d6]"
            style={{
              border: "2px solid rgba(29,233,214,0.6)",
              background: "radial-gradient(circle at 38% 32%, rgba(29,233,214,0.25), rgba(4,26,13,0.96))",
              boxShadow: "0 0 16px rgba(29,233,214,0.35)",
            }}
          >
            <BotIcon size={56} />
            {/* Small AI status dot at bottom-left */}
            <div
              className="absolute bottom-1 left-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#04190d] bg-[#1de9d6] flex items-center justify-center pointer-events-none z-20"
              style={{ boxShadow: "0 0 6px #1de9d6" }}
            />
          </div>
        ) : (
          <>
            {/* Solid mint glowing circle with player avatar or initials */}
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
            </div>

            {/* Green online dot using user-provided Ellipse 92.png — placed OUTSIDE overflow-hidden at bottom-left */}
            <div
              className="absolute bottom-1 left-1.5 w-4 h-4 rounded-full border-2 border-[#04190d] overflow-hidden flex items-center justify-center pointer-events-none z-20"
              style={{
                boxShadow: "0 0 8px #2bff84",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/lobby/Ellipse 92.png"
                alt="Online"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>
          </>
        )}

        {/* Small subtle dropdown arrow badge on circle hover */}
        {!isYou && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#061a12] border border-[#d4af37] text-[#ffe885] text-[9px] flex items-center justify-center shadow-md transition-transform group-hover:scale-110 z-30"
            title="Configure Slot"
          >
            ▼
          </span>
        )}
      </div>

      {/* ── Name Pill (using Rectangle 582.png from zip) ── */}
      <div
        onClick={() => {
          if (!isYou) setMenuOpen((prev) => !prev);
        }}
        className={`relative w-[130px] h-8 flex items-center justify-center px-2 transition-transform ${
          !isYou ? "cursor-pointer hover:scale-[1.03] active:scale-[0.98]" : ""
        }`}
        style={{
          backgroundImage: "url('/lobby/create/Rectangle 582.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
        title={!isYou ? "Click to toggle between Open Slot and AI Bot" : "Your slot"}
      >
        <span
          className={`text-[11px] font-black tracking-wider uppercase truncate flex items-center gap-1.5 ${
            isOpen ? "text-[#2bf8b8]" : isAI ? "text-[#1de9d6]" : "text-white"
          }`}
          style={{
            textShadow: isOpen
              ? "0 0 10px rgba(43, 248, 184, 0.4), 0 1px 2px rgba(0,0,0,0.9)"
              : "0 1px 2px rgba(0,0,0,0.9)",
          }}
        >
          <span>{displayName}</span>
          {!isYou && (
            <span className="text-[8px] text-[#ffe885] opacity-90 leading-none">▼</span>
          )}
        </span>
      </div>

      {/* ── Optional AI Bot tag below pill only when isAI ── */}
      {isAI && (
        <div className="mt-0.5 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lobby/create/AI Bot.png"
            alt="AI Bot"
            className="h-3 max-h-[13px] w-auto object-contain pointer-events-none drop-shadow"
          />
        </div>
      )}

      {/* ── Host slot configuration popup menu (Open Slot / AI Bot) ── */}
      <AnimatePresence>
        {menuOpen && !isYou && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full z-50 mt-1.5 w-36 py-1.5 rounded-xl border flex flex-col gap-1 shadow-2xl"
            style={{
              background: "rgba(6, 26, 18, 0.98)",
              borderColor: "rgba(214, 178, 90, 0.65)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.85), 0 0 15px rgba(43,248,184,0.25)",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("Open");
                setMenuOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition-colors cursor-pointer rounded-lg mx-1 ${
                dropdown === "Open"
                  ? "text-[#2bf8b8] bg-[rgba(43,248,184,0.18)]"
                  : "text-white/80 hover:text-white hover:bg-[rgba(214,178,90,0.15)]"
              }`}
            >
              <span className="text-sm">➕</span>
              <span>Open Slot</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("AI");
                setMenuOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-left transition-colors cursor-pointer rounded-lg mx-1 ${
                dropdown === "AI"
                  ? "text-[#1de9d6] bg-[rgba(29,233,214,0.18)]"
                  : "text-white/80 hover:text-white hover:bg-[rgba(214,178,90,0.15)]"
              }`}
            >
              <span className="text-sm">🤖</span>
              <span>AI Bot</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
