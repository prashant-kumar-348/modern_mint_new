"use client";

import type { RoomPrivacy } from "@/lib/lobby/types";

interface PrivacyOptionProps {
  value:    RoomPrivacy;
  selected: RoomPrivacy;
  onSelect: (v: RoomPrivacy) => void;
}

const PRIVACY_ASSETS: Record<
  RoomPrivacy,
  {
    selected:   string;
    unselected: string;
    alt:        string;
  }
> = {
  open: {
    selected:   "/lobby/Group 353.png",
    unselected: "/lobby/Group 350.png",
    alt:        "Open - Anyone can join",
  },
  closed: {
    selected:   "/lobby/Group 354.png",
    unselected: "/lobby/Group 351.png",
    alt:        "Closed - Invite Only",
  },
  password: {
    selected:   "/lobby/Group 355.png",
    unselected: "/lobby/Group 352.png",
    alt:        "Password - Password to enter",
  },
};

export default function PrivacyOption({
  value,
  selected,
  onSelect,
}: PrivacyOptionProps) {
  const isSelected = selected === value;
  const asset = PRIVACY_ASSETS[value];

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="w-full flex justify-center py-1 cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isSelected ? asset.selected : asset.unselected}
        alt={asset.alt}
        className="w-full max-w-[215px] h-auto object-contain pointer-events-none select-none drop-shadow-md"
      />
    </button>
  );
}
