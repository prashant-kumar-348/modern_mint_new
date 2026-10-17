"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Check, Crown, ArrowLeft, Play, ShieldAlert, Sparkles } from "lucide-react";
import PageBackground from "./PageBackground";

const AVATAR_IMAGE_MAP = {
  1: "/lobby/join/founder-avatar-1.png",
  2: "/lobby/join/founder-avatar-4.png",
  3: "/lobby/join/founder-avatar-3.png",
  4: "/lobby/join/founder-avatar-2.png",
  5: "/lobby/join/Ellipse 197.png",
  6: "/lobby/join/Ellipse 198.png",
};

export default function MultiplayerWaitingRoom({
  roomId,
  roomInfo,
  gameState,
  isHost,
  maxPlayers = 4,
  onStartGame,
  onLeave,
  localUsername,
}) {
  const [copied, setCopied] = useState(false);

  const players = gameState?.players || [];
  const currentCount = players.length;
  const targetCount = maxPlayers || 4;
  const isFull = currentCount >= targetCount;
  const canStart = currentCount >= 2;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/lobby/join/${roomId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roomName = roomInfo?.name || "Modern Mint Arena";
  const gameMode = roomInfo?.mode === "60mins" ? "60 Mins Mode" : roomInfo?.mode === "short" ? "Short Game" : "Full Game";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030806] flex items-center justify-center font-sans select-none">
      {/* Dynamic Background */}
      <PageBackground variant="lobby" blurred />

      {/* Main Waiting Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl mx-4 p-6 sm:p-8 rounded-2xl flex flex-col gap-6 shadow-2xl border"
        style={{
          background: "rgba(6, 26, 18, 0.88)",
          borderColor: "rgba(214, 178, 90, 0.45)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 50px rgba(0,0,0,0.85), inset 0 0 25px rgba(43,248,184,0.08)",
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onLeave}
              className="p-2 rounded-xl border border-white/10 hover:border-[#2bf8b8]/50 hover:bg-[#2bf8b8]/10 text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              title="Leave Room"
            >
              <ArrowLeft size={16} />
              <span>Leave</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-white via-[#ffe885] to-[#d4af37] bg-clip-text text-transparent">
                  {roomName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2bf8b8]/15 text-[#2bf8b8] border border-[#2bf8b8]/40">
                  {gameMode}
                </span>
              </div>
              <p className="text-xs text-white/50 tracking-wide mt-0.5">
                Multiplayer Waiting Room &bull; No AI Bots Allowed
              </p>
            </div>
          </div>

          {/* Share / Copy Room Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer text-xs font-bold uppercase tracking-wider shadow-md"
            style={{
              background: copied ? "rgba(43,248,184,0.25)" : "rgba(214,178,90,0.12)",
              borderColor: copied ? "#2bf8b8" : "rgba(214,178,90,0.5)",
              color: copied ? "#2bf8b8" : "#ffe885",
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? "Link Copied!" : "Invite Friends"}</span>
          </button>
        </div>

        {/* Players Counter Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2bf8b8]/15 border border-[#2bf8b8]/40 flex items-center justify-center text-[#2bf8b8]">
              <Users size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-black text-white">
                Player Capacity: {currentCount} / {targetCount} Joined
              </div>
              <div className="text-[11px] text-white/50">
                {isFull
                  ? "All player slots filled! Starting game..."
                  : `Waiting for ${targetCount - currentCount} more player${targetCount - currentCount === 1 ? "" : "s"} to fill room`}
              </div>
            </div>
          </div>

          {/* Pulsing Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isFull ? "bg-emerald-400 animate-ping" : "bg-[#2bf8b8] animate-pulse"
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              {isFull ? "Starting Game..." : "Waiting for Players..."}
            </span>
          </div>
        </div>

        {/* Players Grid (Slots) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 my-2">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const player = players[idx];
            const isLocal = player?.name === localUsername;
            const isPlayerHost = idx === 0;

            if (player) {
              const avatarSrc =
                AVATAR_IMAGE_MAP[player.avatarId] ||
                `/player-avatar-${(idx % 4) + 1}.png`;

              return (
                <motion.div
                  key={player.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative flex flex-col items-center gap-2 p-3.5 rounded-xl border bg-black/45 shadow-lg group hover:border-[#2bf8b8]/60 transition-all"
                  style={{
                    borderColor: isLocal ? "rgba(43,248,184,0.6)" : "rgba(255,255,255,0.12)",
                    boxShadow: isLocal ? "0 0 16px rgba(43,248,184,0.2)" : undefined,
                  }}
                >
                  {/* Host Crown Badge */}
                  {isPlayerHost && (
                    <div
                      className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full bg-[#FFE885] text-black text-[9px] font-black uppercase flex items-center gap-1 shadow-md"
                      title="Room Host"
                    >
                      <Crown size={10} />
                      <span>Host</span>
                    </div>
                  )}

                  {/* Avatar Frame */}
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center p-0.5 border-2 shadow-inner"
                    style={{
                      borderColor: player.color || "#2bf8b8",
                      boxShadow: `0 0 12px ${player.color || "#2bf8b8"}55`,
                      background: "rgba(0,0,0,0.6)",
                    }}
                  >
                    <img
                      src={avatarSrc}
                      alt={player.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  {/* Player Name */}
                  <div className="text-center w-full px-1">
                    <div className="text-xs font-black uppercase tracking-wider text-white truncate">
                      {player.name}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                      {player.role || "Founder"}
                    </div>
                  </div>

                  {/* Ready Indicator */}
                  <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-black uppercase text-emerald-300">
                    <Check size={10} />
                    <span>Ready</span>
                  </div>
                </motion.div>
              );
            }

            // Open Slot
            return (
              <div
                key={`open-${idx}`}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-white/20 bg-black/20 text-white/40 min-h-[160px]"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed transition-all"
                  style={{
                    borderColor: "rgba(43, 248, 184, 0.4)",
                    background: "rgba(43, 248, 184, 0.04)",
                  }}
                >
                  <span className="text-xl font-light text-[#2bf8b8]/70">+</span>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Open Slot
                  </div>
                  <div className="text-[10px] text-white/30 tracking-tight mt-0.5">
                    Waiting for player...
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="text-center sm:text-left">
            {isHost ? (
              <div className="text-xs text-white/70">
                <span className="font-bold text-[#ffe885]">Host Controls:</span> You can start early once at least 2 players have joined, or wait for the room to fill completely.
              </div>
            ) : (
              <div className="text-xs text-white/70">
                Waiting for the host to start the game, or for all <span className="font-bold text-[#2bf8b8]">{targetCount}</span> slots to be filled.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={`w-full sm:w-auto px-7 py-3 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  canStart
                    ? "bg-gradient-to-r from-[#d4af37] via-[#ffe885] to-[#d4af37] text-black hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,232,133,0.4)]"
                    : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
                }`}
              >
                <Play size={16} fill={canStart ? "currentColor" : "none"} />
                <span>{canStart ? "Start Game Now" : "Waiting for 2+ Players"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/60">
                <span className="w-2 h-2 rounded-full bg-[#2bf8b8] animate-pulse"></span>
                <span>Ready & Waiting</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
