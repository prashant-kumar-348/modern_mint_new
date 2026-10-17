"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageBackground from "@/components/PageBackground";
import LobbyNavBar   from "@/components/lobby/LobbyNavBar";
import RoomRow        from "@/components/lobby/RoomRow";
import PasswordModal  from "@/components/lobby/PasswordModal";
import Button         from "@/components/ui/Button";
import { fetchRooms } from "@/lib/lobby/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { GameRoom } from "@/lib/lobby/types";

// ── Table header row matching Figma mockup ────────────────────────────────

function TableHeader() {
  return (
    <div className="flex items-center w-full pl-16 md:pl-20 pr-12 md:pr-16 pt-2 pb-3 select-none">
      <div className="w-[180px] lg:w-[200px] flex-shrink-0 flex items-center justify-start pr-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lobby/headers/game-name.png"
          alt="GAME NAME"
          className="h-[15px] md:h-[17px] w-auto object-contain pointer-events-none select-none drop-shadow"
        />
      </div>
      <div className="w-[110px] lg:w-[120px] flex-shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lobby/headers/mode.png"
          alt="MODE"
          className="h-[15px] md:h-[17px] w-auto object-contain pointer-events-none select-none drop-shadow"
        />
      </div>
      <div className="w-[220px] lg:w-[240px] flex-shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lobby/headers/founders.png"
          alt="FOUNDERS (MAX-4)"
          className="h-[15px] md:h-[17px] w-auto object-contain pointer-events-none select-none drop-shadow"
        />
      </div>
      <div className="w-[180px] lg:w-[200px] flex-shrink-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lobby/headers/investors.png"
          alt="INVESTORS (MAX-2)"
          className="h-[15px] md:h-[17px] w-auto object-contain pointer-events-none select-none drop-shadow"
        />
      </div>
      <div className="flex-1" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-3xl opacity-30">🎮</span>
      <p
        className="text-[11px] font-black uppercase tracking-[0.35em]"
        style={{ color: "var(--text-muted)" }}
      >
        No rooms available
      </p>
      <p
        className="text-[10px] uppercase tracking-widest"
        style={{ color: "var(--text-faint)" }}
      >
        Be the first — create a game!
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function LobbyPage() {
  const ready     = useAuthGuard();
  const router    = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [rooms,    setRooms]    = useState<GameRoom[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  function handleOpenPasswordModal() {
    const pwRooms = rooms.filter((r) => r.privacy === "password");
    if (selectedRoom) {
      setShowPwModal(true);
      return;
    }
    if (pwRooms.length > 0) {
      setSelectedRoom(pwRooms[0]);
      setShowPwModal(true);
      return;
    }
    if (rooms.length > 0) {
      setSelectedRoom(rooms[0]);
      setShowPwModal(true);
      return;
    }
    setShowPwModal(true);
  }

  function handlePasswordSubmit(enteredPassword: string, customCode?: string) {
    let targetId = selectedRoom?.id;
    if (!targetId && customCode) {
      const match = rooms.find(
        (r) =>
          r.id.toLowerCase() === customCode.toLowerCase() ||
          r.name.toLowerCase() === customCode.toLowerCase()
      );
      targetId = match ? match.id : customCode;
    }
    if (!targetId) return;

    try {
      sessionStorage.setItem(`mm_room_pw_${targetId}`, enteredPassword);
    } catch {
      // ignore
    }
    setShowPwModal(false);
    router.push(`/lobby/join/${targetId}`);
  }

  const loadRooms = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    startTransition(() => { loadRooms(); });
    const poll = setInterval(() => {
      startTransition(() => { loadRooms(); });
    }, 5000);
    const onProfileUpdate = () => {
      startTransition(() => { loadRooms(); });
    };
    window.addEventListener("mm_profile_updated", onProfileUpdate);
    return () => {
      clearInterval(poll);
      window.removeEventListener("mm_profile_updated", onProfileUpdate);
    };
  }, [ready, loadRooms]);

  if (!ready) return null;

  return (
    <div className="relative flex flex-col h-screen overflow-hidden select-none">
      <PageBackground variant="lobby" blurred />

      {/* Nav bar with Modern Mint logo image */}
      <LobbyNavBar />

      {/* Main body */}
      <div className="flex-1 min-h-0 px-6 py-2 flex flex-col items-center justify-center">
        <motion.div
          className="w-full max-w-[1140px] flex flex-col h-full max-h-[620px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* ── Main Frame Card using user-provided main-card-bg.png ── */}
          <div
            className="relative overflow-hidden rounded-[26px] flex flex-col flex-1 p-5 shadow-2xl"
            style={{
              backgroundImage: "url('/lobby/main-card-bg.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              boxShadow:
                "0 16px 60px rgba(0,0,0,0.65), 0 0 35px rgba(214, 178, 90, 0.18)",
            }}
          >
            {/* Table Header */}
            <TableHeader />

            {/* Scrollable Room Rows */}
            <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-2 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.35em] animate-pulse text-white/70"
                  >
                    Loading rooms…
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: "#ef4444" }}>
                    ▲ {error}
                  </p>
                  <Button size="sm" variant="ghost" onClick={loadRooms}>Retry</Button>
                </div>
              ) : rooms.length === 0 ? (
                <EmptyState />
              ) : (
                rooms.map((room, i) => <RoomRow key={room.id} room={room} index={i} />)
              )}
            </div>

            {/* Bottom action buttons inside the panel */}
            <div className="relative z-10 flex-shrink-0 flex items-center gap-5 pt-4 px-1">
              {/* CREATE YOUR OWN GAME */}
              <button
                type="button"
                onClick={() => router.push("/lobby/create")}
                className="flex-1 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none shadow-lg"
                style={{
                  background: "rgba(45, 34, 14, 0.70)",
                  border: "1.5px solid rgba(214, 178, 90, 0.70)",
                  boxShadow: "inset 0 1px 0 rgba(214, 178, 90, 0.25), 0 4px 14px rgba(0,0,0,0.4)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lobby/CREATE YOUR OWN GAME.png"
                  alt="Create Your Own Game"
                  className="h-[20px] md:h-[22px] w-auto object-contain pointer-events-none drop-shadow translate-y-[2px]"
                />
              </button>

              {/* JOIN WITH PASSWORD */}
              <button
                type="button"
                onClick={handleOpenPasswordModal}
                className="flex-1 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none shadow-lg"
                style={{
                  background: "rgba(45, 34, 14, 0.70)",
                  border: "1.5px solid rgba(214, 178, 90, 0.70)",
                  boxShadow: "inset 0 1px 0 rgba(214, 178, 90, 0.25), 0 4px 14px rgba(0,0,0,0.4)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lobby/JOIN WITH PASSWORD.png"
                  alt="Join with Password"
                  className="h-[23px] md:h-[25px] w-auto object-contain pointer-events-none drop-shadow translate-y-[3px]"
                />
              </button>
            </div>
          </div>

          {/* ← BACK — green pill below the panel on the bottom left */}
          <div className="flex items-center pt-3 px-1">
            <button
              type="button"
              onClick={() => router.push("/menu")}
              className="px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.22em] font-black flex items-center gap-2 cursor-pointer transition-all duration-150 shadow-md hover:scale-105 active:scale-95 focus:outline-none"
              style={{
                background: "rgba(10, 38, 24, 0.90)",
                border: "1.5px solid rgba(214, 178, 90, 0.60)",
                color: "#f0d89a",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = "0 0 16px rgba(222,186,98,0.35)";
                el.style.borderColor = "rgba(43,214,115,0.7)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = "none";
                el.style.borderColor = "rgba(214, 178, 90, 0.60)";
              }}
            >
              ← BACK
            </button>
          </div>
        </motion.div>
      </div>

      {/* Password modal (Figma Design) */}
      <AnimatePresence>
        {showPwModal && (
          <PasswordModal
            roomName={selectedRoom?.name}
            availableRooms={rooms
              .filter((r) => r.privacy === "password")
              .map((r) => ({ id: r.id, name: r.name }))}
            selectedRoomId={selectedRoom?.id}
            onSelectRoom={(id) => {
              const target = rooms.find((r) => r.id === id);
              if (target) setSelectedRoom(target);
            }}
            onConfirm={handlePasswordSubmit}
            onCancel={() => setShowPwModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
