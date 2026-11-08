// Theme definitions for Character-specific Player Mats
// Mat 1 (Maroon)   -> Avatar 1 (Ruthless / Alex)
// Mat 2 (Amber)    -> Avatar 2 (Rohit / Toshi / Alpha)
// Mat 3 (Charcoal) -> Avatar 3 (Meera / Delta)
// Mat 4 (Teal)     -> Avatar 4 (Robotic / Jordan)
// Mat 5 (Purple)   -> Investors (Investor 1 & Investor 2)

export const PLAYER_MAT_THEMES = {
  1: {
    id: 1,
    name: 'Maroon',
    character: 'Founder 1 (Alex)',
    matImg: '/player-mats/player-mat-1.png',
    avatarSrc: '/lobby/join/founder-avatar-1.png',
    bgOuter: '#752a3e',
    deskBorder: '#431320',
    bannerBg: '#541a29',
    cardBg: '#a07379',
    cardBorder: '#4A1720',
    pillBg: '#fcf4d8',
    pillText: '#4A1720',
    notesBg: '#e7e1cb',
    textLight: '#FFE8D6',
    tableHeaderBg: '#e5dcc5',
    tableBorder: 'rgba(74, 23, 32, 0.25)',
    accentGlow: 'rgba(239, 68, 68, 0.4)',
    lockOverlayBg: 'rgba(80, 22, 37, 0.88)',
    lockBadgeBg: '#3D141C',
    secondChanceBorder: '#4A1720'
  },
  2: {
    id: 2,
    name: 'Amber',
    character: 'Founder 2 (Rohit)',
    matImg: '/player-mats/player-mat-2.png',
    avatarSrc: '/lobby/join/founder-avatar-4.png',
    bgOuter: '#c38248',
    deskBorder: '#6e3914',
    bannerBg: '#804318',
    cardBg: '#ca9e75',
    cardBorder: '#6e3914',
    pillBg: '#fcf3d8',
    pillText: '#5a2c0a',
    notesBg: '#e8e0cb',
    textLight: '#fef3c7',
    tableHeaderBg: '#e5dcc5',
    tableBorder: 'rgba(110, 57, 20, 0.25)',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    lockOverlayBg: 'rgba(124, 69, 27, 0.88)',
    lockBadgeBg: '#5a2c0a',
    secondChanceBorder: '#6e3914'
  },
  3: {
    id: 3,
    name: 'Charcoal',
    character: 'Founder 3 (Meera)',
    matImg: '/player-mats/player-mat-3.png',
    avatarSrc: '/lobby/join/founder-avatar-3.png',
    bgOuter: '#383c3e',
    deskBorder: '#1d2022',
    bannerBg: '#26292b',
    cardBg: '#6f6b6b',
    cardBorder: '#202325',
    pillBg: '#fcf3d8',
    pillText: '#1d2022',
    notesBg: '#e8e0cb',
    textLight: '#e2e8f0',
    tableHeaderBg: '#dedbd3',
    tableBorder: 'rgba(29, 32, 34, 0.25)',
    accentGlow: 'rgba(148, 163, 184, 0.4)',
    lockOverlayBg: 'rgba(40, 44, 46, 0.88)',
    lockBadgeBg: '#1d2022',
    secondChanceBorder: '#202325'
  },
  4: {
    id: 4,
    name: 'Teal',
    character: 'Founder 4 (Jordan)',
    matImg: '/player-mats/player-mat-4.png',
    avatarSrc: '/lobby/join/founder-avatar-2.png',
    bgOuter: '#2b5e66',
    deskBorder: '#14353a',
    bannerBg: '#1c444a',
    cardBg: '#6d7e83',
    cardBorder: '#14353a',
    pillBg: '#fcf3d8',
    pillText: '#14353a',
    notesBg: '#e8e0cb',
    textLight: '#d1fae5',
    tableHeaderBg: '#d7e2de',
    tableBorder: 'rgba(20, 53, 58, 0.25)',
    accentGlow: 'rgba(20, 184, 166, 0.4)',
    lockOverlayBg: 'rgba(26, 64, 71, 0.88)',
    lockBadgeBg: '#14353a',
    secondChanceBorder: '#14353a'
  },
  5: {
    id: 5,
    name: 'Investor',
    character: 'Investor',
    isInvestor: true,
    matImg: '/player-mats/player-mat-investor.png',
    avatarSrc: '/lobby/join/Ellipse 197.png',
    bgOuter: '#3b1e4d',
    deskBorder: '#271235',
    bannerBg: '#442457',
    cardBg: '#836a86',
    cardBorder: '#271235',
    pillBg: '#fcf3d8',
    pillText: '#3b1e4d',
    notesBg: '#e8e0cb',
    textLight: '#f3e8ff',
    tableHeaderBg: '#ded7e5',
    tableBorder: 'rgba(59, 30, 77, 0.25)',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    lockOverlayBg: 'rgba(59, 30, 77, 0.88)',
    lockBadgeBg: '#271235',
    secondChanceBorder: '#271235'
  }
};

export function getPlayerMatTheme(player) {
  if (!player) return PLAYER_MAT_THEMES[1];

  // Investor Check (Both Investor 1 & Investor 2 use the dedicated purple Investor Player Mat)
  const role = String(player?.role || '').toLowerCase();
  const avId = Number(player?.avatarId);
  const n = String(player?.name || '').toLowerCase();
  const avatar = String(player?.avatar || '').toLowerCase();

  if (
    player?.isInvestor ||
    role === 'investor' ||
    role.includes('investor') ||
    avId === 5 || avId === 6 ||
    player === 5 || player === 6 || player === '5' || player === '6' ||
    avatar.includes('197') || avatar.includes('198') ||
    n.includes('investor')
  ) {
    const isInv2 = avId === 6 || avatar.includes('198') || n.includes('investor 2') || n.includes('investor-2');
    return {
      ...PLAYER_MAT_THEMES[5],
      avatarSrc: isInv2 ? '/lobby/join/Ellipse 198.png' : '/lobby/join/Ellipse 197.png',
      character: isInv2 ? 'Investor 2' : 'Investor 1'
    };
  }

  // 0. Direct primitive number or numeric string passed (Founders 1-4)
  if (typeof player === 'number' && player >= 1 && player <= 4) {
    return PLAYER_MAT_THEMES[player];
  }
  if (typeof player === 'string') {
    const parsed = Number(player);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) {
      return PLAYER_MAT_THEMES[parsed];
    }
  }

  // 1. Direct avatarId check (Founders 1-4)
  if (avId >= 1 && avId <= 4) {
    return PLAYER_MAT_THEMES[avId];
  }

  // 2. avatar property check (if numeric 1-4)
  const numericAvatar = Number(player.avatar);
  if (numericAvatar >= 1 && numericAvatar <= 4) {
    return PLAYER_MAT_THEMES[numericAvatar];
  }

  // 3. String avatar filename check
  if (typeof player.avatar === 'string') {
    const s = player.avatar.toLowerCase();
    if (s.includes('founder-avatar-1') || s.includes('avatar-1') || s.includes('ruthless') || s.includes('katana')) return PLAYER_MAT_THEMES[1];
    if (s.includes('founder-avatar-4') || s.includes('avatar-4') || s.includes('glasses')) return PLAYER_MAT_THEMES[2];
    if (s.includes('founder-avatar-3') || s.includes('avatar-3') || s.includes('smiling')) return PLAYER_MAT_THEMES[3];
    if (s.includes('founder-avatar-2') || s.includes('avatar-2') || s.includes('robotic') || s.includes('goggles')) return PLAYER_MAT_THEMES[4];
  }

  // 4. Color check
  const c = String(player.color || '').toLowerCase();
  if (c.includes('9b2c3d') || c.includes('ef4444') || c.includes('752a3e') || c.includes('843040') || c.includes('red') || c.includes('maroon') || c.includes('rn')) {
    return PLAYER_MAT_THEMES[1];
  }
  if (c.includes('e08b26') || c.includes('c38248') || c.includes('d4af37') || c.includes('ffc240') || c.includes('gold') || c.includes('amber') || c.includes('yellow') || c.includes('orange') || c.includes('gd')) {
    return PLAYER_MAT_THEMES[2];
  }
  if (c.includes('4a4d50') || c.includes('383c3e') || c.includes('grey') || c.includes('gray') || c.includes('charcoal')) {
    return PLAYER_MAT_THEMES[3];
  }
  if (c.includes('2b828a') || c.includes('2b5e66') || c.includes('55ffb0') || c.includes('teal') || c.includes('green') || c.includes('cyan') || c.includes('gt')) {
    return PLAYER_MAT_THEMES[4];
  }

  // 5. Name heuristics
  if (n.includes('ruthless') || n.includes('alex') || n.includes('katana')) return PLAYER_MAT_THEMES[1];
  if (n.includes('rohit') || n.includes('toshi') || n.includes('alpha') || n.includes('glasses')) return PLAYER_MAT_THEMES[2];
  if (n.includes('meera') || n.includes('delta') || n.includes('smiling')) return PLAYER_MAT_THEMES[3];
  if (n.includes('robotic') || n.includes('jordan') || n.includes('omega') || n.includes('goggles')) return PLAYER_MAT_THEMES[4];

  // Default fallback to theme 1 (Maroon)
  return PLAYER_MAT_THEMES[1];
}

function resolvePlayerObj(playerOrColor, maybeName = '', maybeAvatarId = null) {
  if (playerOrColor && typeof playerOrColor === 'object') {
    return playerOrColor;
  }
  return {
    color: playerOrColor,
    name: maybeName,
    avatarId: maybeAvatarId
  };
}

// Collapsed Player Pill Style (The Character Color Bar in the top-right roster)
export function getPlayerPillStyle(playerOrColor, maybeName = '', maybeAvatarId = null) {
  const player = resolvePlayerObj(playerOrColor, maybeName, maybeAvatarId);
  const theme = getPlayerMatTheme(player);

  // Both Investors match the Investor Player Mat (deep purple / plum theme)
  if (theme.isInvestor) {
    return {
      background: 'linear-gradient(to right, #442457, #240f33)',
      border: '1px solid rgba(168, 85, 247, 0.55)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(216, 180, 254, 0.2)'
    };
  }

  // Founder Theme Pill
  if (theme.id === 1) {
    return {
      backgroundImage: "url('/Rectangle-24.png')",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      border: '1px solid rgba(239, 68, 68, 0.45)'
    };
  }
  if (theme.id === 2) {
    return {
      background: 'linear-gradient(to right, #4a3412, #291c07)',
      border: '1px solid rgba(224, 139, 38, 0.5)'
    };
  }
  if (theme.id === 3) {
    return {
      background: 'linear-gradient(to right, #2c2f32, #18191a)',
      border: '1px solid rgba(130, 135, 140, 0.45)'
    };
  }
  if (theme.id === 4) {
    return {
      backgroundImage: "url('/Rectangle-508.png')",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      border: '1px solid rgba(43, 130, 138, 0.45)'
    };
  }
  return {
    backgroundImage: "url('/Rectangle-508.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat'
  };
}

// Expanded Dropdown Card Style (Matches the Character Color Bar when opened)
export function getPlayerDropdownStyle(playerOrColor, maybeName = '', maybeAvatarId = null) {
  const player = resolvePlayerObj(playerOrColor, maybeName, maybeAvatarId);
  const theme = getPlayerMatTheme(player);

  // Both Investors match the Investor Player Mat (deep purple / plum theme)
  if (theme.isInvestor) {
    return {
      background: 'linear-gradient(135deg, #442457 0%, #331644 50%, #1f0b2a 100%)',
      border: '1px solid rgba(168, 85, 247, 0.55)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(216, 180, 254, 0.2)'
    };
  }

  // Founder Theme Dropdown Card
  if (theme.id === 1) {
    return {
      background: 'linear-gradient(135deg, #591819 0%, #401015 50%, #2a0b12 100%)',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(239, 68, 68, 0.25)'
    };
  }
  if (theme.id === 2) {
    return {
      background: 'linear-gradient(135deg, #523010 0%, #3a200a 50%, #221204 100%)',
      border: '1px solid rgba(224, 139, 38, 0.5)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(245, 158, 11, 0.25)'
    };
  }
  if (theme.id === 3) {
    return {
      background: 'linear-gradient(135deg, #363a3d 0%, #242729 50%, #151718 100%)',
      border: '1px solid rgba(148, 163, 184, 0.45)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
    };
  }
  if (theme.id === 4) {
    return {
      backgroundImage: "url('/Rectangle-608.png')",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      border: '1px solid rgba(43, 130, 138, 0.5)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(43, 130, 138, 0.25)'
    };
  }
  return {
    backgroundImage: "url('/Rectangle-608.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    border: '1px solid rgba(43, 130, 138, 0.5)'
  };
}

// Stage Badge Style inside the Dropdown
export function getPlayerStageBadgeStyle(playerOrColor, maybeName = '', maybeAvatarId = null) {
  return {
    backgroundImage: "url('/stage-badge-bg.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat'
  };
}
