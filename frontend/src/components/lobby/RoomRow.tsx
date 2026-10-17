"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PlayerAvatar from "./PlayerAvatar";
import PasswordModal from "./PasswordModal";
import type { GameRoom, PlayerSlot } from "@/lib/lobby/types";
import { AVATAR_IMAGE_BY_ID } from "@/lib/lobby/types";
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

function resolveSlotImage(slot: PlayerSlot): string | undefined {
  if (slot.kind === "open" || slot.kind === "ai") return undefined;

  // 1. If this slot represents the logged-in user, check their stored profile image
  if (typeof window !== "undefined") {
    const user = getUser();
    if (
      user &&
      (slot.kind === "you" ||
        (slot.name && user.username && slot.name.trim().toLowerCase() === user.username.trim().toLowerCase()))
    ) {
      if (user.profile_image_url) {
        return user.profile_image_url.startsWith("http") || user.profile_image_url.startsWith("data:")
          ? user.profile_image_url
          : `${API_BASE_URL}${user.profile_image_url}`;
      }
    }
  }

  // 2. Backend-provided profile image for this player
  if (slot.profileImageUrl) {
    return slot.profileImageUrl.startsWith("http") || slot.profileImageUrl.startsWith("data:")
      ? slot.profileImageUrl
      : `${API_BASE_URL}${slot.profileImageUrl}`;
  }

  // No profile image uploaded -> return undefined so PlayerAvatar displays initials (e.g. "PR")
  return undefined;
}

// ── Mode badge with user-provided vector symbols ──────────────────────────

function ModeBadge({ mode }: { mode: GameRoom["mode"] }) {
  const cfg = {
    "60mins": {
      icon: "/lobby/modes/clock.png",
      label: "60 mins",
      imgClass: "h-[44px] md:h-[48px] max-w-[50px]",
    },
    short: {
      icon: "/lobby/modes/lightning.png",
      label: "Short Mode",
      imgClass: "h-[46px] md:h-[50px] max-w-[46px]",
    },
    full: {
      icon: "/lobby/modes/crown.png",
      label: "Full Mode",
      imgClass: "h-[40px] md:h-[44px] max-w-[52px]",
    },
  }[mode] || {
    icon: "/lobby/modes/clock.png",
    label: mode,
    imgClass: "h-[44px] md:h-[48px] max-w-[50px]",
  };

  return (
    <div className="relative flex items-center justify-center w-28 h-11 select-none">
      {/* Background symbol watermark from Figma */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cfg.icon}
        alt=""
        className={`absolute inset-0 m-auto ${cfg.imgClass} w-auto object-contain opacity-60 pointer-events-none select-none`}
      />
      <span
        className="relative z-10 text-white select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "15px",
          lineHeight: "100%",
          letterSpacing: "0%",
          textAlign: "center",
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── Slot group (Padded to 4 for Founders and 2 for Investors) ─────────────

function SlotGroup({
  slots,
  max,
}: {
  slots: GameRoom["founders"] | GameRoom["investors"];
  max: number;
}) {
  const filled = slots || [];
  const rendered = [...filled];
  while (rendered.length < max) {
    rendered.push({ kind: "open" } as (typeof filled)[number]);
  }

  const currentUser = typeof window !== "undefined" ? getUser() : null;

  return (
    <div className="flex items-center gap-2 justify-center">
      {rendered.slice(0, max).map((slot, i) => {
        const isOpen = slot.kind === "open";
        const isCurrent =
          slot.kind === "you" ||
          Boolean(
            currentUser &&
              slot.name &&
              currentUser.username &&
              slot.name.trim().toLowerCase() === currentUser.username.trim().toLowerCase()
          );

        const personName = isOpen
          ? undefined
          : isCurrent
          ? currentUser?.username || slot.name || "You"
          : slot.name || "Player";

        return (
          <PlayerAvatar
            key={i}
            kind={slot.kind}
            avatarId={slot.avatarId}
            imageSrc={isOpen ? undefined : resolveSlotImage(slot)}
            personName={personName}
            size="md"
            showStatus={!isOpen}
          />
        );
      })}
    </div>
  );
}



// ── RoomRow ───────────────────────────────────────────────────────────────

interface RoomRowProps {
  room:  GameRoom;
  index: number;
}

export default function RoomRow({ room, index }: RoomRowProps) {
  const router     = useRouter();
  const [showPw, setShowPw] = useState(false);
  const isPassword = room.privacy === "password";

  function handleJoin() {
    if (isPassword) {
      setShowPw((v) => !v);
    } else {
      router.push(`/lobby/join/${room.id}`);
    }
  }

  function handlePwSubmit(pw: string) {
    try { sessionStorage.setItem(`mm_room_pw_${room.id}`, pw); } catch { /* ignore */ }
    router.push(`/lobby/join/${room.id}`);
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      {/* Sleek rounded capsule row using user-provided row-bg.png */}
      <div
        className="group relative w-full rounded-full transition-all duration-150 hover:brightness-110"
        style={{
          backgroundImage: "url('/lobby/row-bg.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Main row items matching TableHeader columns */}
        <div className="flex items-center w-full min-h-[46px] pl-16 md:pl-20 pr-12 md:pr-16 py-1">
          {/* Game name */}
          <div className="w-[180px] lg:w-[200px] flex-shrink-0 text-left min-w-0 pr-4">
            <span
              className="truncate block text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                fontSize: "15px",
                lineHeight: "100%",
                letterSpacing: "0%",
              }}
            >
              {room.name}
            </span>
          </div>

          {/* Mode */}
          <div className="w-[110px] lg:w-[120px] flex-shrink-0 flex items-center justify-center">
            <ModeBadge mode={room.mode} />
          </div>

          {/* Founders (Max 4) */}
          <div className="w-[220px] lg:w-[240px] flex-shrink-0 flex items-center justify-center">
            <SlotGroup slots={room.founders} max={4} />
          </div>

          {/* Investors (Max 2) */}
          <div className="w-[180px] lg:w-[200px] flex-shrink-0 flex items-center justify-center">
            <SlotGroup slots={room.investors} max={2} />
          </div>

          {/* Join / Password Button */}
          <div className="flex-1 flex items-center justify-end">
            {isPassword ? (
              <button
                type="button"
                onClick={handleJoin}
                className="w-[130px] md:w-[138px] h-7 md:h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer hover:scale-105 active:scale-95 focus:outline-none shadow-md"
                style={{
                  backgroundImage: "url('/lobby/password-btn-bg.png')",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lobby/PASSWORD.png"
                  alt="PASSWORD"
                  className="h-[18px] md:h-[20px] w-auto object-contain pointer-events-none drop-shadow translate-y-[1.5px]"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                className="w-[130px] md:w-[138px] h-7 md:h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer hover:scale-105 active:scale-95 focus:outline-none shadow-md"
                style={{
                  backgroundImage: "url('/lobby/Rectangle 561.png')",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lobby/JOIN.png"
                  alt="JOIN"
                  className="h-[18px] md:h-[20px] w-auto object-contain pointer-events-none drop-shadow translate-y-[1.5px]"
                />
              </button>
            )}
          </div>
        </div>

        {/* Password unlock modal */}
        <AnimatePresence>
          {showPw && (
            <PasswordModal
              roomName={room.name}
              onConfirm={handlePwSubmit}
              onCancel={() => setShowPw(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
