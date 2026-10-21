"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  isYou = false,
}: SlotCardProps) {
  const [imgError, setImgError] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(() => 
    typeof window !== "undefined" ? getUser() : null
  );

  useEffect(() => {
    const handleUpdate = () => setCurrentUser(getUser());
    window.addEventListener("mm_profile_updated", handleUpdate);
    return () => window.removeEventListener("mm_profile_updated", handleUpdate);
  }, []);

  // Reset imgError when avatarId or name changes
  useEffect(() => {
    setImgError(false);
  }, [avatarId, name, currentUser?.profile_image_url]);

  const isOpen = dropdown === "Open";
  const isAI   = dropdown === "AI";

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
    >
      {/* ── Avatar / Open Circle (Fixed slot, no dropdown, displays profile) ── */}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200"
        title={isYou ? "Your slot" : isAI ? displayName : "Open slot"}
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
      </div>

      {/* ── Name Pill (using Rectangle 582.png from zip) ── */}
      <div
        className="relative w-[130px] h-8 flex items-center justify-center transition-transform"
        style={{
          backgroundImage: "url('/lobby/create/Rectangle 582.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span
          className={`text-[11px] font-black tracking-wider uppercase truncate px-2 ${
            isOpen ? "text-[#2bf8b8]" : "text-white"
          }`}
          style={{
            textShadow: isOpen
              ? "0 0 10px rgba(43, 248, 184, 0.4), 0 1px 2px rgba(0,0,0,0.9)"
              : "0 1px 2px rgba(0,0,0,0.9)",
          }}
        >
          {displayName}
        </span>
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
    </motion.div>
  );
}
