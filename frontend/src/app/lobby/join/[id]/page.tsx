"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageBackground from "@/components/PageBackground";
import LobbyNavBar   from "@/components/lobby/LobbyNavBar";
import RoleCard       from "@/components/lobby/RoleCard";
import { getUser }    from "@/lib/auth";
import { fetchRoom, joinRoom, joinRoomWithPassword } from "@/lib/lobby/api";
import { ApiError } from "@/lib/api";
import type { GameRoom, GameMode, PlayerRole } from "@/lib/lobby/types";
import { useAuthGuard } from "@/lib/useAuthGuard";

// ── Role-specific avatars matching Modern Mint Figma design ───────────────
const FOUNDER_AVATARS = [
  { id: 1, src: "/lobby/join/founder-avatar-1.png" },
  { id: 4, src: "/lobby/join/founder-avatar-2.png" },
  { id: 3, src: "/lobby/join/founder-avatar-3.png" },
  { id: 2, src: "/lobby/join/founder-avatar-4.png" },
];
const INVESTOR_AVATARS = [
  { id: 5, src: "/lobby/join/Ellipse 197.png" },
  { id: 6, src: "/lobby/join/Ellipse 198.png" },
];

function avatarsForRole(role: PlayerRole) {
  return role === "founder" ? FOUNDER_AVATARS : INVESTOR_AVATARS;
}

export default function JoinGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ready    = useAuthGuard();
  const { id }   = use(params);
  const router   = useRouter();

  const [room,       setRoom]       = useState<GameRoom | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [role,       setRole]       = useState<PlayerRole>("founder");
  const [name,       setName]       = useState("");
  const [avatarId,   setAvatarId]   = useState<number | null>(FOUNDER_AVATARS[0].id);
  const [password,   setPassword]   = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`mm_room_pw_${id}`) || "";
    }
    return "";
  });
  const [starting,   setStarting]   = useState(false);
  const [joinError,  setJoinError]  = useState<string | null>(null);

  // Display name comes from the signed-in user
  useEffect(() => {
    const user = getUser();
    if (user?.username) setName(user.username);
    else if (user?.email) setName(user.email);
  }, []);

  // Fetch the room on mount
  useEffect(() => {
    if (!ready) return;

    async function load() {
      try {
        const result = await fetchRoom(id);
        setRoom(result);
      } catch (err) {
        setFetchError(
          err instanceof ApiError ? err.message : "Failed to load room."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ready, id]);

  const modeInfo: Record<GameMode, { label: string; icon: string }> = {
    "60mins": { label: "60 mins",    icon: "/lobby/modes/clock.png"     },
    short:    { label: "Short Mode", icon: "/lobby/modes/lightning.png" },
    full:     { label: "Full Mode",  icon: "/lobby/modes/crown.png"     },
  };

  function selectRole(r: PlayerRole) {
    setRole(r);
    setAvatarId(avatarsForRole(r)[0].id);
  }

  async function handleStart() {
    if (!name.trim() || !avatarId) return;
    setJoinError(null);
    setStarting(true);

    try {
      if (room?.privacy === "password") {
        const storedPw =
          (typeof window !== "undefined" && sessionStorage.getItem(`mm_room_pw_${id}`)) || "";
        const finalPw = password.trim() || storedPw;
        await joinRoomWithPassword(id, {
          role,
          avatar_id:    avatarId,
          display_name: name.trim(),
          password:     finalPw,
        });
        if (typeof window !== "undefined" && finalPw) {
          sessionStorage.setItem(`mm_room_pw_${id}`, finalPw);
        }
      } else {
        await joinRoom(id, {
          role,
          avatar_id:    avatarId,
          display_name: name.trim(),
        });
      }
      router.push(`/room/${id}`);
    } catch (err) {
      setJoinError(
        err instanceof ApiError ? err.message : "Failed to join room."
      );
      setStarting(false);
    }
  }

  if (!ready) return null;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="relative flex flex-col h-screen overflow-hidden select-none">
        <PageBackground variant="lobby" blurred />
        <LobbyNavBar />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[11px] font-black uppercase tracking-[0.35em] animate-pulse text-white/70">
            Loading room...
          </span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (fetchError || !room) {
    return (
      <div className="relative flex flex-col h-screen overflow-hidden select-none">
        <PageBackground variant="lobby" blurred />
        <LobbyNavBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-400">
            ▲ {fetchError ?? "Room not found."}
          </p>
          <button
            onClick={() => router.push("/lobby")}
            className="px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.22em] font-black cursor-pointer text-[#f0d89a] border border-[rgba(214,178,90,0.6)] bg-[rgba(10,38,24,0.9)]"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const avatars = avatarsForRole(role);

  return (
    <div className="relative flex flex-col h-screen overflow-hidden select-none">
      <PageBackground variant="lobby" blurred />
      <LobbyNavBar />

      <div className="flex-1 min-h-0 px-6 py-2 flex flex-col items-center justify-center">
        <motion.div
          className="w-full max-w-[1080px] flex flex-col h-full max-h-[620px]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Main Frame Card with gold border and background seal */}
          <div
            className="relative overflow-hidden rounded-[26px] flex flex-col flex-1 p-6 md:p-8 shadow-2xl"
            style={{
              backgroundImage: "url('/lobby/main-card-bg.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              boxShadow:
                "0 16px 60px rgba(0,0,0,0.65), 0 0 35px rgba(214, 178, 90, 0.18)",
            }}
          >
            {/* Main content grid: Left 2/3 (Role selection), Divider, Right 1/3 (Avatar & Join) */}
            <div className="flex-1 flex items-stretch min-h-0 gap-6 md:gap-8">
              {/* Left side: Header + 2 Role Cards */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="mb-4 text-center">
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.35em] text-[#3dd6b5]">
                    You are joining
                  </span>
                  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.06em] text-white mt-1 drop-shadow truncate">
                    {room.name || "Global Leader Summit"}
                  </h1>
                  <div
                    className="flex items-center justify-center gap-2 text-white/80 mt-1.5"
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "100%",
                      letterSpacing: "0%",
                      textAlign: "center",
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={modeInfo[room.mode]?.icon || "/lobby/modes/clock.png"}
                        alt=""
                        className="w-4.5 h-4.5 object-contain opacity-85"
                      />
                      {modeInfo[room.mode]?.label || room.mode}
                    </span>
                    <span className="text-white/40">|</span>
                    <span className="flex items-center gap-1.5">
                      {room.privacy === "password" ? (
                        <>🔒 Password Protected</>
                      ) : room.privacy === "closed" ? (
                        <>🔒 Private Room</>
                      ) : (
                        <>✓ Open Room</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Two Role Cards */}
                <div className="flex-1 grid grid-cols-2 gap-5 items-stretch min-h-0 max-h-[420px]">
                  <RoleCard
                    role="founder"
                    selected={role === "founder"}
                    onSelect={() => selectRole("founder")}
                  />
                  <RoleCard
                    role="investor"
                    selected={role === "investor"}
                    onSelect={() => selectRole("investor")}
                  />
                </div>
              </div>

              {/* Vertical Gold Divider using Line 2.png */}
              <div className="w-[1px] self-stretch my-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/lobby/join/Line 2.png" alt="" className="h-full w-[1px] object-cover pointer-events-none" />
              </div>

              {/* Right side: Avatar selection, Password, Join */}
              <div className="w-[280px] lg:w-[310px] flex-shrink-0 flex flex-col items-center justify-between py-1">
                {/* Avatar Selection Group: Header Badge + Avatars directly connected */}
                <div className="flex flex-col items-center my-auto">
                  {/* Choose your avatar header badge */}
                  <div
                    className="w-[245px] h-[33px] rounded-full flex items-center justify-center select-none shadow-md mb-4"
                    style={{
                      backgroundImage: "url('/lobby/join/Rectangle 601.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/lobby/join/CHOOSE YOUR AVATAR.png"
                      alt="CHOOSE YOUR AVATAR"
                      className="h-[18px] md:h-5 w-auto object-contain pointer-events-none drop-shadow translate-y-[2px]"
                    />
                  </div>

                  {/* Avatar choices: 2x2 for Founder, vertical 2 for Investor */}
                  <div className="flex items-center justify-center">
                    {role === "founder" ? (
                      <div className="grid grid-cols-2 gap-4">
                        {avatars.map((a) => {
                          const active = avatarId === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setAvatarId(a.id)}
                              className={`relative rounded-full overflow-hidden cursor-pointer transition-transform duration-150 focus:outline-none ${
                                active ? "scale-105" : "opacity-80 hover:opacity-100 hover:scale-102"
                              }`}
                              style={{
                                width: 78,
                                height: 78,
                                boxShadow: active
                                  ? "0 0 20px rgba(240, 207, 116, 0.7), 0 0 0 2.5px #f0cf74"
                                  : "0 0 0 1px rgba(240, 207, 116, 0.25)",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={a.src} alt="" className="w-full h-full object-contain pointer-events-none" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {avatars.map((a) => {
                          const active = avatarId === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setAvatarId(a.id)}
                              className={`relative rounded-full overflow-hidden cursor-pointer transition-transform duration-150 focus:outline-none ${
                                active ? "scale-105" : "opacity-80 hover:opacity-100 hover:scale-102"
                              }`}
                              style={{
                                width: 86,
                                height: 86,
                                boxShadow: active
                                  ? "0 0 20px rgba(240, 207, 116, 0.7), 0 0 0 2.5px #f0cf74"
                                  : "none",
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={a.src} alt="" className="w-full h-full object-contain pointer-events-none" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom action section: Password (if required) + Join button */}
                <div className="w-full flex flex-col items-center gap-3">
                  {room.privacy === "password" && (
                    <div
                      className="w-full max-w-[275px] h-[78px] rounded-xl flex flex-col items-center justify-center px-4"
                      style={{
                        backgroundImage: "url('/lobby/join/Rectangle 602.png')",
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/lobby/join/PASSWORD.png"
                        alt="PASSWORD"
                        className="h-3.5 w-auto object-contain pointer-events-none drop-shadow mb-1"
                      />
                      <div
                        className="w-full h-7 rounded-full flex items-center justify-center px-3 relative"
                        style={{
                          backgroundImage: "url('/lobby/join/Rectangle 603.png')",
                          backgroundSize: "100% 100%",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleStart()}
                          placeholder="••••••••"
                          className="w-full bg-transparent text-center text-white placeholder-white/35 tracking-[0.35em] text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Join Button */}
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={starting || !name.trim() || !avatarId || (room.privacy === "password" && !password.trim())}
                    className="w-[146px] h-[33px] rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none shadow-lg"
                    style={{
                      backgroundImage: "url('/lobby/join/Rectangle 561.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/lobby/join/JOIN.png"
                      alt="JOIN"
                      className="h-[20px] md:h-[22px] w-auto object-contain pointer-events-none drop-shadow translate-y-[2px]"
                    />
                  </button>

                  {joinError && (
                    <span className="text-[10px] text-center font-bold text-red-400">
                      ▲ {joinError}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ← BACK button */}
          <div className="flex items-center pt-3 px-1">
            <button
              type="button"
              onClick={() => router.push("/lobby")}
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
    </div>
  );
}
