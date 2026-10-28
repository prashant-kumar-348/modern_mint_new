"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageBackground  from "@/components/PageBackground";
import LobbyNavBar     from "@/components/lobby/LobbyNavBar";
import SlotCard        from "@/components/lobby/SlotCard";
import ModeCard        from "@/components/lobby/ModeCard";
import PrivacyOption   from "@/components/lobby/PrivacyOption";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { getUser }     from "@/lib/auth";
import { createRoom }  from "@/lib/lobby/api";
import { ApiError }    from "@/lib/api";
import type {
  AIDifficulty,
  GameMode,
  RoomPrivacy,
  SlotDropdown,
  CreateSlot,
} from "@/lib/lobby/types";

// ── Initial slots ─────────────────────────────────────────────────────────

function makeFounderSlots(username: string, vsAi: boolean = false): CreateSlot[] {
  if (vsAi) {
    return [
      { dropdown: "You",  avatarId: 1, name: username },  // host only
      { dropdown: "AI",   avatarId: 2, name: "Alpha Bot" },
      { dropdown: "AI",   avatarId: 3, name: "Delta Bot" },
      { dropdown: "AI",   avatarId: 4, name: "Omega Bot" },
    ];
  }
  return [
    { dropdown: "You",  avatarId: 1, name: username },  // host only
    { dropdown: "Open", avatarId: 2, name: "" },
    { dropdown: "Open", avatarId: 3, name: "" },
    { dropdown: "Open", avatarId: 4, name: "" },
  ];
}

function makeInvestorSlots(vsAi: boolean = false): CreateSlot[] {
  if (vsAi) {
    return [
      { dropdown: "AI", avatarId: 5, name: "Sigma Bot" },
      { dropdown: "AI", avatarId: 6, name: "Apex Bot" },
    ];
  }
  return [
    { dropdown: "Open", avatarId: 5, name: "" },
    { dropdown: "Open", avatarId: 6, name: "" },
  ];
}

// ── Difficulty toggle — Figma: /lobby/Group 357.png (active) & Group 347.png (inactive) ──

const DIFFICULTY_OPTIONS: { label: string; value: AIDifficulty; img: string }[] = [
  { label: "Easy",       value: "easy",   img: "/lobby/create/Easy.png" },
  { label: "Medium",     value: "medium", img: "/lobby/create/Medium.png" },
  { label: "Hard",       value: "hard",   img: "/lobby/create/Hard.png" },
  { label: "Super Hard", value: "unfair", img: "/lobby/create/Super Hard.png" },
];

function DifficultyToggle({
  label,
  img,
  active,
  onSelect,
}: {
  label: string;
  img: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3.5 py-1.5 px-2 cursor-pointer select-none transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
        active ? "opacity-100" : "opacity-75 hover:opacity-95"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={active ? "/lobby/Group 357.png" : "/lobby/Group 347.png"}
        alt={active ? "Active" : "Inactive"}
        className="w-[47px] h-[17px] object-contain flex-shrink-0 pointer-events-none select-none drop-shadow"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={label}
        className="h-4.5 max-h-[19px] w-auto object-contain pointer-events-none drop-shadow"
      />
    </div>
  );
}

// ── Section label — Figma pill using Rectangle 595.png from zip ───────────

function PanelLabel({
  image,
  alt,
  label,
  children,
}: {
  image?: string;
  alt?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  const text = label || children || alt;
  return (
    <div className="flex justify-center mb-3">
      <div
        className="relative px-6 h-8 flex items-center justify-center select-none min-w-[190px]"
        style={{
          backgroundImage: "url('/lobby/create/Rectangle 595.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span
          className="text-xs font-black uppercase tracking-[0.20em] text-white select-none whitespace-nowrap"
          style={{
            textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// ── Group header — Founders / Investors pill ───────────────────────────────

function GroupHeader({ type, max }: { type: "founders" | "investors"; max: number }) {
  const isFounders = type === "founders";
  const label = isFounders ? `FOUNDERS (MAX-${max})` : `INVESTORS (MAX-${max})`;

  return (
    <div className="flex justify-center mb-3">
      <div
        className="relative px-6 h-8 flex items-center justify-center select-none min-w-[216px]"
        style={{
          backgroundImage: "url('/lobby/create/Rectangle 595.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span
          className="text-xs font-black uppercase tracking-[0.20em] text-white select-none whitespace-nowrap"
          style={{
            textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}



// ── Main Page ─────────────────────────────────────────────────────────────

export default function CreateGamePage() {
  const ready   = useAuthGuard();
  const router  = useRouter();

  const [isVsAi,       setIsVsAi]       = useState(false);
  const [username,     setUsername]     = useState("You");
  const [roomName,     setRoomName]     = useState("");
  const [founderSlots, setFounderSlots] = useState<CreateSlot[]>(() => makeFounderSlots("You"));
  const [investorSlots, setInvestorSlots] = useState<CreateSlot[]>(makeInvestorSlots);
  const [difficulty,    setDifficulty]    = useState<AIDifficulty>("easy");
  const [mode,          setMode]          = useState<GameMode>("60mins");
  const [privacy,       setPrivacy]       = useState<RoomPrivacy>("open");
  const [password,      setPassword]      = useState("");
  const [starting,      setStarting]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const vsAiMode = searchParams?.get("vsAi") === "true";
    setIsVsAi(vsAiMode);

    const user = getUser();
    const activeUsername = user?.username || "You";
    startTransition(() => {
      setUsername(activeUsername);
      setFounderSlots(makeFounderSlots(activeUsername, vsAiMode));
      setInvestorSlots(makeInvestorSlots(vsAiMode));
      if (vsAiMode) {
        setPrivacy("closed");
        setRoomName(`${activeUsername}'s Arena (VS AI)`);
      } else {
        setRoomName(user?.username ? `${user.username}'s Arena` : "Modern Mint Arena");
      }
    });
  }, []);

  // Update founder slot dropdown
  function updateFounder(i: number, dropdown: SlotDropdown) {
    const defaultAiNames = ["Alpha Bot", "Delta Bot", "Omega Bot", "Sigma Bot"];
    setFounderSlots((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? {
              ...s,
              dropdown,
              name: dropdown === "Open" ? "" : dropdown === "AI" ? (s.name && s.name !== "FRIEND" && s.name !== "" ? s.name : defaultAiNames[idx - 1] || "AI BOT") : s.name || "FRIEND",
            }
          : s
      )
    );
  }

  // Update investor slot dropdown
  function updateInvestor(i: number, dropdown: SlotDropdown) {
    const defaultAiNames = ["Sigma Bot", "Apex Bot"];
    setInvestorSlots((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? {
              ...s,
              dropdown,
              name: dropdown === "Open" ? "" : dropdown === "AI" ? (s.name && s.name !== `INVESTOR ${idx + 1}` && s.name !== "" ? s.name : defaultAiNames[idx] || "AI BOT") : s.name || `INVESTOR ${idx + 1}`,
            }
          : s
      )
    );
  }

  // Privacy selection
  function handlePrivacySelect(v: RoomPrivacy) {
    setPrivacy(v);
  }

  async function handleStart() {
    if (privacy === "password" && !password.trim()) {
      setError("Please enter a password for this room.");
      return;
    }
    const finalName = roomName.trim() || `${username}'s Game`;
    setError(null);
    setStarting(true);

    const aiFounders = isVsAi ? 3 : 0;
    const aiInvestors = isVsAi ? 2 : 0;
    const isAiGame = isVsAi;

    try {
      const room = await createRoom({
        name:          finalName,
        mode,
        privacy:       isAiGame ? "closed" : privacy,
        password:      privacy === "password" ? password : undefined,
        ai_difficulty: difficulty,
        max_founders:  4,
        max_investors: 2,
        ai_founders:   aiFounders,
        ai_investors:  aiInvestors,
        avatar_id:     founderSlots[0].avatarId,
        display_name:  username,
      });

      router.push(`/lobby/join/${room.id}${isAiGame ? "?vsAi=true" : ""}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create room.");
      setStarting(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="relative flex flex-col min-h-screen overflow-y-auto select-none">
      <PageBackground variant="lobby" blurred />
      <LobbyNavBar title="Create New Game" />

      {/* Main viewport body */}
      <div className="flex-1 min-h-0 px-6 py-4 flex flex-col items-center justify-center my-auto">
        <motion.div
          className="w-full max-w-[1140px] flex flex-col"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Main Frame: User-provided Figma card image ── */}
          <div
            className="relative overflow-hidden rounded-[26px] flex flex-col w-full"
            style={{
              backgroundImage: "url('/lobby/main-card-bg.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              boxShadow:
                "0 16px 60px rgba(0,0,0,0.65), 0 0 35px rgba(214, 178, 90, 0.18)",
            }}
          >

            {/* Content Container */}
            <div className="relative z-10 flex flex-col p-6">

              {/* ── TOP SECTION: Founders (Left) | Vertical Gold Divider | Investors (Right) ── */}
              <div className="grid grid-cols-[1.9fr_auto_1fr] gap-6 items-start">
                {/* Founders */}
                <div>
                  <GroupHeader type="founders" max={4} />
                  <div className="flex gap-2.5 justify-around">
                    {founderSlots.map((slot, i) => (
                      <SlotCard
                        key={i}
                        index={i}
                        dropdown={slot.dropdown}
                        avatarId={slot.avatarId}
                        name={slot.name}
                        onChange={(d) => updateFounder(i, d)}
                        isYou={i === 0}
                        allowAI={true}
                      />
                    ))}
                  </div>
                </div>

                {/* Vertical gold divider (Line 2.png from zip) */}
                <div className="relative self-stretch flex items-center justify-center my-1 w-px">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lobby/create/Line 2.png"
                    alt=""
                    className="absolute inset-y-0 left-0 w-[1px] h-full max-h-[140px] object-cover pointer-events-none opacity-85 m-auto"
                  />
                </div>

                {/* Investors */}
                <div>
                  <GroupHeader type="investors" max={2} />
                  <div className="flex gap-2.5 justify-around">
                    {investorSlots.map((slot, i) => (
                      <SlotCard
                        key={i}
                        index={i}
                        dropdown={slot.dropdown}
                        avatarId={slot.avatarId}
                        name={slot.name}
                        onChange={(d) => updateInvestor(i, d)}
                        allowAI={true}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── HORIZONTAL GOLD DIVIDER LINE (Line 1.png from zip) ── */}
              <div className="w-full mt-2 mb-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lobby/create/Line 1.png"
                  alt=""
                  className="w-full h-[1px] object-cover pointer-events-none opacity-85"
                />
              </div>

              {/* ── BOTTOM SECTION: 3 Columns (Difficulty Level | Mode | Game Privacy) ── */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] gap-4 items-start">
                
                {/* Column 1: DIFFICULTY LEVEL */}
                <div className="flex flex-col h-full">
                  <PanelLabel label="DIFFICULTY LEVEL" />
                  <div className="flex flex-col justify-around flex-1 px-4 py-2 min-h-[304px]">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <DifficultyToggle
                        key={opt.value}
                        label={opt.label}
                        img={opt.img}
                        active={difficulty === opt.value}
                        onSelect={() => setDifficulty(opt.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Vertical gold divider (Line 2.png from zip) */}
                <div className="flex items-center justify-center self-stretch my-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lobby/create/Line 2.png"
                    alt=""
                    className="w-[1px] h-full max-h-[310px] object-cover pointer-events-none opacity-85"
                  />
                </div>

                {/* Column 2: MODE */}
                <div className="flex flex-col items-center">
                  <PanelLabel label="MODE" />
                  <div className="flex gap-3 px-1 items-center justify-center">
                    {(["60mins", "short", "full"] as GameMode[]).map((m) => (
                      <ModeCard
                        key={m}
                        mode={m}
                        selected={mode === m}
                        onSelect={() => setMode(m)}
                      />
                    ))}
                  </div>
                </div>

                {/* Vertical gold divider (Line 2.png from zip) */}
                <div className="flex items-center justify-center self-stretch my-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/lobby/create/Line 2.png"
                    alt=""
                    className="w-[1px] h-full max-h-[310px] object-cover pointer-events-none opacity-85"
                  />
                </div>

                {/* Column 3: GAME PRIVACY */}
                <div className="flex flex-col h-full">
                  <PanelLabel label="GAME PRIVACY" />
                  <div className="flex flex-col justify-around flex-1 items-center px-1 py-2 min-h-[304px]">
                    {(["open", "closed", "password"] as RoomPrivacy[]).map((v) => (
                      <PrivacyOption
                        key={v}
                        value={v}
                        selected={privacy}
                        onSelect={handlePrivacySelect}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 px-4 py-2 text-xs rounded-lg text-center"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.35)",
                    color: "#f87171",
                  }}
                >
                  ▲ {error}
                </motion.div>
              )}

              {/* ── PASSWORD OVERLAY BOX (When Privacy = Password, matches Figma exactly) ── */}
              <AnimatePresence>
                {privacy === "password" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none"
                  >
                    {/* Card: Rectangle 602.png (338px x 90px) */}
                    <div
                      className="relative w-[338px] h-[90px] flex flex-col items-center justify-center px-6 shadow-2xl"
                      style={{
                        backgroundImage: "url('/lobby/password/Rectangle 602.png')",
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      {/* Header: PASSWORD.png (99px x 20px) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/lobby/password/PASSWORD.png"
                        alt="PASSWORD"
                        className="h-5 w-auto object-contain pointer-events-none mb-2 drop-shadow filter brightness-110"
                      />

                      {/* Input: Rectangle 603.png (277px x 31px) */}
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
                          onKeyDown={(e) => e.key === "Enter" && handleStart()}
                          autoFocus
                          className="w-full h-full bg-transparent text-center text-white text-base font-bold tracking-[0.25em] focus:outline-none px-4 placeholder-transparent z-10"
                        />

                        {/* Placeholder asterisks */}
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

                    {/* Action Button: Rectangle 561.png (146px x 33px) with JOIN.png */}
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={starting}
                      className="mt-2 w-[146px] h-[33px] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-xl focus:outline-none"
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
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* ── Bottom Action Bar: BACK (left) · Room Name (center) · START GAME (right) ── */}
          <div className="flex items-center justify-between px-2 pt-3">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.push("/lobby")}
              className="text-[11px] uppercase tracking-[0.25em] font-black flex items-center gap-2 cursor-pointer transition-colors duration-150 py-2 px-3 rounded-lg"
              style={{ color: "rgba(214, 178, 90, 0.85)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#2bf8b8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(214, 178, 90, 0.85)")}
            >
              ← BACK
            </button>

            {/* Room Name Input Pill */}
            <div
              className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-md"
              style={{
                background: "rgba(10, 26, 18, 0.85)",
                borderColor: "rgba(214, 178, 90, 0.50)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-[0.22em] select-none"
                style={{ color: "var(--gold)" }}
              >
                Room:
              </span>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Modern Mint Arena"
                maxLength={40}
                className="bg-transparent text-xs font-bold text-white focus:outline-none w-48 tracking-wide"
              />
            </div>

            {/* Start Game Button (using Rectangle 587.png from zip, only when not password mode) */}
            {privacy !== "password" ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                className="relative px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-[0.20em] cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                style={{
                  backgroundImage: "url('/lobby/create/Rectangle 587.png')",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "rgba(24, 162, 88, 0.45)",
                  color: "#ffffff",
                  boxShadow: "0 0 20px rgba(43,214,115,0.40)",
                  border: "1px solid rgba(120,255,180,0.40)",
                }}
              >
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {starting ? "Starting…" : "▶ START GAME"}
                </span>
              </button>
            ) : (
              <div className="w-28" />
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
