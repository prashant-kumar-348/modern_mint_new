"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

interface PasswordModalProps {
  initialPassword?: string;
  roomName?: string;
  availableRooms?: { id: string; name: string }[];
  selectedRoomId?: string;
  onSelectRoom?: (id: string) => void;
  onConfirm: (password: string, customCode?: string) => void;
  onCancel: () => void;
}

export default function PasswordModal({
  initialPassword = "",
  roomName,
  availableRooms,
  selectedRoomId,
  onSelectRoom,
  onConfirm,
  onCancel,
}: PasswordModalProps) {
  const [password, setPassword] = useState(initialPassword);
  const [customCode, setCustomCode] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPassword(initialPassword);
  }, [initialPassword]);

  const handleSubmit = () => {
    if (password.trim()) {
      onConfirm(password.trim(), customCode.trim());
    }
  };

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
      >
        {/* Close Button on top right */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-black/85 border border-[#DEBA62]/70 text-white/80 hover:text-white flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-pointer shadow-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Room badge / selector above card */}
        {availableRooms && availableRooms.length > 1 ? (
          <div className="mb-2 flex items-center gap-2 max-w-[340px] overflow-x-auto py-1 px-1">
            {availableRooms.map((r) => {
              const active = r.id === selectedRoomId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRoom?.(r.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    active
                      ? "text-[#2bf8b8] border border-[#2bf8b8] bg-[rgba(43,248,184,0.18)] shadow-[0_0_12px_rgba(43,248,184,0.4)]"
                      : "text-white/70 border border-white/20 bg-black/40 hover:text-white"
                  }`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        ) : roomName ? (
          <div
            className="mb-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-[0.20em] text-[#d6b25a] shadow-md border"
            style={{
              background: "rgba(10, 26, 18, 0.85)",
              borderColor: "rgba(214, 178, 90, 0.50)",
              backdropFilter: "blur(10px)",
            }}
          >
            Room: {roomName}
          </div>
        ) : (!availableRooms || availableRooms.length === 0) && !roomName ? (
          <div
            className="mb-3 w-[277px] h-[31px] flex items-center justify-center relative shadow-lg"
            style={{
              backgroundImage: "url('/lobby/password/Rectangle 603.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="ROOM CODE / NAME"
              className="w-full h-full bg-transparent text-center text-white text-xs font-bold tracking-[0.2em] focus:outline-none px-3 uppercase placeholder-white/40 z-10"
            />
          </div>
        ) : null}

        {/* Main Card (Rectangle 602.png: 338px x 90px) */}
        <div
          className="relative w-[338px] h-[90px] flex flex-col items-center justify-center px-6 shadow-2xl"
          style={{
            backgroundImage: "url('/lobby/password/Rectangle 602.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header image: PASSWORD.png */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lobby/password/PASSWORD.png"
            alt="PASSWORD"
            className="h-5 w-auto object-contain pointer-events-none mb-2.5 drop-shadow filter brightness-110"
          />

          {/* Input Container: Rectangle 603.png (277px x 31px) */}
          <div
            className="relative w-[277px] h-[31px] flex items-center justify-center"
            style={{
              backgroundImage: "url('/lobby/password/Rectangle 603.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password.trim()) {
                  handleSubmit();
                }
                if (e.key === "Escape") {
                  onCancel();
                }
              }}
              autoFocus
              className="w-full h-full bg-transparent text-center text-white text-base font-bold tracking-[0.25em] focus:outline-none px-4 placeholder-transparent z-10"
            />

            {/* Placeholder asterisks: asterisks.png */}
            {!password && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lobby/password/asterisks.png"
                  alt="••••••••"
                  className="h-[6px] w-auto object-contain opacity-75"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action button: Rectangle 561.png (146px x 33px) with JOIN.png */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!password.trim()}
            className="w-[146px] h-[33px] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed shadow-xl"
            style={{
              backgroundImage: "url('/lobby/password/Rectangle 561.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lobby/password/JOIN.png"
              alt="JOIN"
              className="h-[18px] w-auto object-contain pointer-events-none drop-shadow translate-y-[1px]"
            />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-white/60 hover:text-white uppercase tracking-wider font-semibold cursor-pointer transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
