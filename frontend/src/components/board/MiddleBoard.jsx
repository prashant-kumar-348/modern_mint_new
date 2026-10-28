import React, { useState } from 'react';

const AVATAR_IMAGE_BY_ID = {
  1: '/lobby/join/founder-avatar-1.png',
  2: '/lobby/join/founder-avatar-4.png',
  3: '/lobby/join/founder-avatar-3.png',
  4: '/lobby/join/founder-avatar-2.png',
  5: '/lobby/join/Ellipse 197.png',
  6: '/lobby/join/Ellipse 198.png',
};

/**
 * @param {{
 *   players?: any[],
 *   onDeckClick?: () => void,
 *   currentRound?: number,
 *   onBankLoanClick?: () => void,
 *   onPRServicesClick?: () => void
 * }} props
 */
export default function MiddleBoard({ 
  players = [], 
  onDeckClick = () => {}, 
  currentRound = 1, 
  onBankLoanClick = undefined, 
  onPRServicesClick = undefined,
  onEventCardClick = undefined,
  activeEvent = null,
  revealedEvents = {},
  onCompanyClick = undefined,
  localPlayer = null
}) {
  const totalRounds = 9;

  const getStageInitial = (stageIdx) => ['L', 'R', 'G', 'S'][stageIdx] || 'L';

  const getStageTokenImage = (stage, playerIdx = 0, playerColor = null) => {
    const stageMap = {
      'L': 'L', '0': 'L', 0: 'L',
      'R': 'R', '1': 'R', 1: 'R',
      'G': 'G', '2': 'G', 2: 'G',
      'S': 'S', '3': 'S', 3: 'S',
      'Launch': 'L', 'LAUNCH': 'L',
      'Retain': 'R', 'RETAIN': 'R',
      'Grow': 'G', 'GROW': 'G',
      'Scale': 'S', 'SCALE': 'S'
    };
    const letter = stageMap[stage] || 'L';
    let type = (playerIdx % 4) + 1;
    if (playerColor) {
      const c = String(playerColor).toLowerCase();
      if (c.includes('ef4444') || c.includes('843040') || c.includes('red') || c.includes('rn')) type = 1;
      else if (c.includes('55ffb0') || c.includes('36646c') || c.includes('teal') || c.includes('green') || c.includes('gt')) type = 2;
      else if (c.includes('535252') || c.includes('00e1ff') || c.includes('charcoal') || c.includes('blue') || c.includes('bl')) type = 3;
      else if (c.includes('ffc240') || c.includes('d4af37') || c.includes('gold') || c.includes('gd') || c.includes('yellow')) type = 4;
    }
    return `/stage-tokens/stage-${type}-${letter}.png`;
  };

  // 9 Companies in Orbit
  const baseCompanies = [
    { name: 'Wallet', icon: '/mat-icons/mat-icon-wallet.png', image: '/company-wallet.png', angle: 0 },
    { name: 'Quick Commerce', icon: '/mat-icons/mat-icon-quick-commerce.png', image: '/company-quick-commerce.png', angle: 50 },
    { name: 'Snacks', icon: '/mat-icons/mat-icon-snacks.png', image: '/company-snacks.png', angle: 90 },
    { name: 'Restro - Chain', icon: '/mat-icons/mat-icon-restro-chain.png', image: '/company-restro-chain.png', angle: 135 },
    { name: 'Contract Farming', icon: '/mat-icons/mat-icon-contract-farming.png', image: '/company-contract-farming.png', angle: 170 }, 
    { name: 'Agri IoT', icon: '/mat-icons/mat-icon-agri-iot.png', image: '/company-agri-iot.png', angle: 205 }, 
    { name: 'Smart Storage', icon: '/mat-icons/mat-icon-smart-storage.png', image: '/company-smart-storage.png', angle: 240 }, 
    { name: 'Robo - Packaging', icon: '/mat-icons/mat-icon-robo-packaging.png', image: '/company-robo-packaging.png', angle: 275 }, 
    { name: 'Traceability', icon: '/mat-icons/mat-icon-traceability.png', image: '/company-traceability.png', angle: 320 },
  ];

  const companies = baseCompanies.map(comp => {
     const tags = [];
     players.forEach((p, pIdx) => {
        if (p.ownedCompanies) {
           const owned = p.ownedCompanies.find(c => c.name.replace(/\s+/g, '').toLowerCase() === comp.name.replace(/\s+/g, '').toLowerCase());
           if (owned) {
              const letter = getStageInitial(owned.stage);
              tags.push({ 
                color: p.color || '#55ffb0', 
                text: letter,
                tokenImg: getStageTokenImage(owned.stage, pIdx, p.color)
              });
           }
        }
     });
     return { ...comp, tags };
  });

  return (
    <div className="relative w-full h-full flex flex-col pointer-events-none font-sans text-white overflow-hidden bg-[#061c17]">
      
      {/* Full Middle Board Background Image */}
      <img 
        src="/middle-board-bg.jpg" 
        alt="Middle Board Background" 
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" 
      />

      <div className="flex-1 w-full h-full relative z-10 pt-[80px] pb-[60px] px-14 flex justify-between">
        
        {/* =========================================
            LEFT COLUMN: Rounds & Cards
        ========================================= */}
        <div className="flex gap-8 pointer-events-auto z-30 w-[300px]">
          
          {/* Round Tracker */}
          <div className="flex flex-col items-center w-20 -mt-4">
            <div className="text-xs md:text-[13px] text-[#55ffb0] uppercase font-black tracking-widest mb-4">ROUND/YEAR</div>
            <div className="relative flex flex-col gap-5 items-center w-full">
              {/* Vertical connecting line */}
              <div className="absolute top-0 bottom-0 w-[1px] bg-[#144b3c] -z-10"></div>
              
              {[...Array(totalRounds)].map((_, i) => {
                const r = i + 1;
                const isActive = r === currentRound;
                
                return (
                  <div 
                    key={i} 
                    className={`relative w-12 h-12 rounded-full border flex items-center justify-center text-xl font-bold bg-[#061c17] transition-all
                      ${isActive ? 'border-none shadow-[0_0_20px_rgba(229,193,88,0.6)] scale-125' : 'border-[#144b3c] text-[#30a887]'}`}
                  >
                    {isActive ? (
                       <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_30%_30%,#e5c158,#c05c5c,#2a5a6b)] flex items-center justify-center border-2 border-[#fff2d8]/50 overflow-hidden shadow-inner">
                          <img src="/action-token.png" alt="Active Round Token" className="w-[120%] h-[120%] object-cover" />
                       </div>
                    ) : (
                       r
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards Stack */}
          <div className="flex flex-col justify-between h-full pt-6 pb-2 w-[125px]">
            
            {/* Bankruptcy Card (Custom Image) */}
            <div className="w-full aspect-[2.5/3.5] bg-[#111] rounded-md shadow-[0_0_20px_rgba(220,38,38,0.2)] flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer border-2 border-[#1c4d3d]">
               <img src="/bankruptcy-card.jpg" alt="Bankruptcy Card" className="absolute inset-0 w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors mix-blend-overlay"></div>
            </div>
            
            {/* Event Card 4-6 (Custom Image) */}
            <div 
              onClick={() => onEventCardClick && onEventCardClick(4)}
              className="w-full aspect-[2.5/3.5] bg-[#111] rounded-md shadow-[0_0_20px_rgba(0,225,255,0.2)] flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer border-2 border-[#1c4d3d]"
              title={currentRound >= 4 ? "Click to view Round 4 Event Card" : "Round 4 Event Card (Locked)"}
            >
               <img 
                 src="/event-card.jpg" 
                 alt="Event Card 4-6" 
                 className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${currentRound < 4 ? 'brightness-[0.75]' : ''}`} 
               />
               {currentRound >= 4 ? (
                 <div className="absolute inset-0 bg-[#00e1ff]/10 mix-blend-overlay opacity-50 group-hover:opacity-100 transition-opacity"></div>
               ) : (
                 <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition-colors flex items-center justify-center flex-col p-2 text-center select-none backdrop-blur-[0.5px]">
                    <span className="text-[#55ffb0] text-[13px] leading-tight font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Round 4<br/>Event</span>
                    <img src="/lock-icon.png" alt="Locked" className="w-10 h-10 object-contain mt-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />
                 </div>
               )}
            </div>

            {/* Event Card 7-9 (Custom Image) */}
            <div 
              onClick={() => onEventCardClick && onEventCardClick(7)}
              className="w-full aspect-[2.5/3.5] bg-[#111] rounded-md shadow-[0_0_20px_rgba(0,225,255,0.2)] flex items-center justify-center relative overflow-hidden group hover:scale-105 transition-transform cursor-pointer border-2 border-[#1c4d3d]"
              title={currentRound >= 7 ? "Click to view Round 7 Event Card" : "Round 7 Event Card (Locked)"}
            >
               <img 
                 src="/event-card.jpg" 
                 alt="Event Card 7-9" 
                 className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${currentRound < 7 ? 'brightness-[0.75]' : ''}`} 
               />
               {currentRound >= 7 ? (
                 <div className="absolute inset-0 bg-[#00e1ff]/10 mix-blend-overlay opacity-50 group-hover:opacity-100 transition-opacity"></div>
               ) : (
                 <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition-colors flex items-center justify-center flex-col p-2 text-center select-none backdrop-blur-[0.5px]">
                    <span className="text-[#55ffb0] text-[13px] leading-tight font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Round 7<br/>Event</span>
                    <img src="/lock-icon.png" alt="Locked" className="w-10 h-10 object-contain mt-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* =========================================
            CENTER: Simulation Space & Radial Orbit
        ========================================= */}
        <div className="flex-1 flex items-center justify-center pointer-events-none relative mt-2">
          
          <div className="relative w-[550px] h-[550px] flex items-center justify-center">
            
            {/* Center Board Circle (Golden wheel & segments) */}
            <img 
               src="/center-board.png" 
               alt="Center Board Circle" 
               className="absolute w-full h-full object-contain pointer-events-none drop-shadow-[0_0_30px_rgba(229,193,88,0.3)]"
            />

            {/* Center Diamond with Skyline (Custom Image) */}
            <div 
              onClick={onDeckClick} 
              className="absolute z-20 flex items-center justify-center drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 cursor-pointer pointer-events-auto"
            >
               <img 
                 src="/center-mentor-card.png" 
                 alt="Mentor Card 20K" 
                 className="w-[188px] h-[188px] object-contain translate-y-[5px]" 
                 style={{ transform: 'translateY(5px)' }}
               />
            </div>

            {/* Orbiting Companies */}
            {companies.map((comp, idx) => {
              const radius = 275; 
              const rad = (comp.angle - 90) * (Math.PI / 180);
              let yOffset = Math.sin(rad) * radius;
              let xOffset = Math.cos(rad) * radius;
              
              if (comp.name === 'Contract Farming') {
                 yOffset -= 40; // Nudge it upwards to clear the bottom tracker
              }

              const top = `calc(50% + ${yOffset}px)`;
              const left = `calc(50% + ${xOffset}px)`;

              const isOwnedByMe = localPlayer?.ownedCompanies?.some(
                c => c.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === comp.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
              );

              return (
                <div 
                  key={idx}
                  onClick={() => onCompanyClick && onCompanyClick(comp)}
                  className="absolute z-30 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:scale-110 active:scale-95 transition-all select-none"
                  style={{ top, left }}
                  title={isOwnedByMe ? `${comp.name} (Launched)` : `Click to Launch ${comp.name}`}
                >
                  <div className="relative flex flex-col items-center gap-1">
                     
                     {/* Launch Chip on Hover if Unlaunched */}
                     {!isOwnedByMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 bg-[#FFC240] text-[#2A0D12] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,194,64,0.6)] z-50 pointer-events-none whitespace-nowrap border border-[#2A0D12]/40">
                          🚀 Launch
                        </div>
                     )}

                     {/* Floating Stage Tokens (L / R / G / S) */}
                     {comp.tags && comp.tags.length > 0 && (
                        <div className="absolute -top-10 -right-7 flex flex-col gap-1 z-40 drop-shadow-lg">
                          {comp.tags.map((tag, tIdx) => (
                            <div key={tIdx} className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden select-none hover:scale-110 transition-transform">
                               <img src={tag.tokenImg} alt={tag.text} className="w-full h-full object-contain" />
                            </div>
                          ))}
                        </div>
                     )}

                     {/* Company 3D Illustration / Emoji */}
                     <div className="w-16 h-16 rounded-xl border-transparent flex items-center justify-center text-5xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] mb-1 relative overflow-visible transition-transform group-hover:scale-105">
                       {comp.image ? (
                         <img src={comp.image} alt={comp.name} className="w-[200%] h-[200%] max-w-none object-contain relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.95)] -translate-y-2 group-hover:drop-shadow-[0_0_20px_rgba(255,194,64,0.7)] transition-all" />
                       ) : (
                         <span className="relative z-10 bg-[#0c2e26]/50 p-2 rounded-lg backdrop-blur border border-[#30a887]/30">{comp.icon}</span>
                       )}
                     </div>
                     
                     {/* Golden Plaque Name Tag */}
                     <div className="absolute -bottom-7 w-40 flex justify-center z-30">
                        <div className="bg-gradient-to-b from-[#e5c158] to-[#b38836] px-4 py-2 border-2 border-[#5c4015] rounded text-[10px] font-black uppercase tracking-widest text-[#2a1a08] shadow-[0_4px_10px_rgba(0,0,0,0.8)] relative whitespace-nowrap group-hover:brightness-110 group-hover:shadow-[0_0_15px_rgba(229,193,88,0.5)] transition-all">
                           {comp.name}
                           {/* Side rivets/decorations */}
                           <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-1.5 h-3.5 border-r border-y border-[#5c4015] rounded-l bg-[#c29641]"></div>
                           <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-1.5 h-3.5 border-l border-y border-[#5c4015] rounded-r bg-[#c29641]"></div>
                        </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: Info Boxes & Players
        ========================================= */}
        <div className="flex flex-col justify-between items-end w-[280px] pointer-events-auto z-30 pt-1 pb-1 h-full">
          
          {/* Bank Loan Info */}
          <div 
            onClick={onBankLoanClick}
            className={`w-full shrink-0 bg-[#0c2e26]/85 backdrop-blur-md border border-[#1d6b56] p-3 pb-3.5 shadow-xl relative overflow-hidden group ${onBankLoanClick ? 'cursor-pointer hover:border-[#55ffb0] hover:shadow-[0_0_25px_rgba(85,255,176,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all' : ''}`}
          >
            <div className="absolute inset-1 border border-[#30a887]/40 rounded-sm group-hover:border-[#55ffb0]/60 transition-colors pointer-events-none"></div>
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#55ffb0]"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#55ffb0]"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#55ffb0]"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#55ffb0]"></div>

            <h3 className="text-[#55ffb0] font-black text-[13px] uppercase tracking-[0.2em] mb-2 text-center relative z-10 group-hover:text-white transition-colors">Bank Loan</h3>
            <ul className="text-[11.5px] text-[#a4d8c2] space-y-1.5 leading-snug list-disc pl-5 font-sans pr-2 relative z-10 font-medium">
              <li>Pay 10% interest each round</li>
              <li>Borrow up to your eligible limit<br/><span className="text-[9.5px] text-[#a4d8c2]/70 font-normal">(see Player Mat)</span></li>
            </ul>
          </div>

          {/* Founder Turn Order Stack */}
          <div className="flex-1 flex flex-col justify-center items-center w-full z-20 py-2 relative my-auto">
            <div className="text-[11px] text-[#55ffb0] uppercase font-black tracking-[0.2em] text-center mb-2.5 drop-shadow select-none">
              TURN ORDER
            </div>
            
            {(() => {
              const founderPlayers = players.filter(p => (p.role || '').toLowerCase() === 'founder');
              const turnOrderPlayers = founderPlayers.length > 0 ? founderPlayers : players;
              const investorPlayers = players.filter(p => (p.role || '').toLowerCase() === 'investor');

              // Sort by actionCount ascending (least actions = goes first)
              const sortedFounders = [...turnOrderPlayers].sort((a, b) => {
                const acA = a.actionCount || 0;
                const acB = b.actionCount || 0;
                if (acA !== acB) return acA - acB;
                return players.indexOf(a) - players.indexOf(b);
              });

              const totalCount = sortedFounders.length;
              const avatarSize = totalCount <= 3 ? 'w-[54px] h-[54px]' : totalCount === 4 ? 'w-[50px] h-[50px]' : 'w-[42px] h-[42px]';
              const gapClass = totalCount <= 3 ? 'gap-4' : totalCount === 4 ? 'gap-3.5' : 'gap-2';

              const AVATAR_COLORS = {
                1: '#9b2c3d',
                2: '#e08b26',
                3: '#4a4d50',
                4: '#2b828a',
                5: '#00e1ff',
                6: '#d4af37'
              };

              return (
                <>
                  <div className={`flex flex-col items-center ${gapClass} w-full`}>
                    {sortedFounders.map((p, rankIdx) => {
                      const originalIdx = players.findIndex(pl => pl.id === p.id);
                      const avatarColor = (p.avatarId && AVATAR_COLORS[p.avatarId]) || p.color || '#55ffb0';
                      const avatarSrc = p.avatarId && AVATAR_IMAGE_BY_ID[p.avatarId]
                        ? AVATAR_IMAGE_BY_ID[p.avatarId]
                        : `/player-avatar-${(originalIdx !== -1 ? originalIdx : rankIdx) % 4 + 1}.png`;

                      return (
                        <div key={p.id} className="flex items-center gap-3.5 group cursor-pointer">
                          <span className="text-xs font-black text-[#55ffb0]/80 w-4 text-right select-none drop-shadow">
                            {rankIdx + 1}
                          </span>
                          <div 
                            className={`${avatarSize} rounded-full flex items-center justify-center hover:scale-110 transition-transform relative select-none`}
                            style={{ 
                              filter: `drop-shadow(0 0 10px ${avatarColor}95) drop-shadow(0 4px 10px rgba(0,0,0,0.85))`
                            }}
                            title={`${p.name} (Actions: ${p.actionCount || 0})`}
                          >
                            <img 
                              src={avatarSrc} 
                              alt={p.name} 
                              className="w-full h-full object-contain pointer-events-none drop-shadow" 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dedicated Investors Row */}
                  {investorPlayers.length > 0 && (
                    <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-[#1d6b56]/60 w-[85%]">
                      <span className="text-[9.5px] uppercase tracking-widest font-black text-[#FFC240] select-none drop-shadow">INVESTORS:</span>
                      <div className="flex items-center gap-3">
                        {investorPlayers.map(inv => {
                          const avatarSrc = inv.avatarId && AVATAR_IMAGE_BY_ID[inv.avatarId]
                            ? AVATAR_IMAGE_BY_ID[inv.avatarId]
                            : `/lobby/join/Ellipse 197.png`;
                          return (
                            <div 
                              key={inv.id}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform relative cursor-pointer"
                              title={`${inv.name} (Investor)`}
                              style={{ filter: 'drop-shadow(0 0 8px rgba(255,194,64,0.7))' }}
                            >
                              <img src={avatarSrc} alt={inv.name} className="w-full h-full object-contain pointer-events-none" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* PR Services Info */}
          <div 
            onClick={onPRServicesClick}
            className={`w-full shrink-0 bg-[#0c2e26]/85 backdrop-blur-md border border-[#1d6b56] p-3 py-2.5 shadow-xl relative overflow-hidden group ${onPRServicesClick ? 'cursor-pointer hover:border-[#55ffb0] hover:shadow-[0_0_25px_rgba(85,255,176,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all' : ''}`}
          >
            <div className="absolute inset-1 border border-[#30a887]/40 rounded-sm group-hover:border-[#55ffb0]/60 transition-colors pointer-events-none"></div>
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#55ffb0]"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#55ffb0]"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#55ffb0]"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#55ffb0]"></div>

            <h3 className="text-[#55ffb0] font-black text-[13px] uppercase tracking-[0.2em] mb-2 text-center group-hover:text-white transition-colors">PR Services</h3>
            <div className="flex flex-col items-center gap-1 text-[11px] font-semibold text-[#a4d8c2] font-sans">
              <div>Team 3: Pay $500K</div>
              <div>Team 2: Pay $300K</div>
              <div>Team 1: Pay $100K</div>
            </div>
            <div className="text-[9.5px] text-[#55ffb0] mt-1.5 text-center uppercase tracking-wider font-bold">Projected Revenue will be DOUBLED</div>
            <div className="text-[8px] text-[#a4d8c2]/70 text-center uppercase tracking-wide mt-0.5 font-medium">*One applies per company per round</div>
          </div>

        </div>

      </div>

      {/* =========================================
          BOTTOM ACTION BAR (1-30)
      ========================================= */}
      <div className="absolute bottom-0 left-0 w-full h-[45px] bg-transparent flex pointer-events-auto z-40">
        {[...Array(30)].map((_, i) => {
          const squareNum = i + 1;
          const playersOnSquare = players.filter(p => (p.actionCount || 0) === squareNum);

          return (
            <div 
              key={i}
              className="flex-1 border-r border-[#1d6b56]/20 relative flex flex-col items-center justify-center overflow-hidden hover:bg-white/10 transition-colors"
            >
              
              {/* Checkers-style Tokens */}
              {playersOnSquare.length > 0 && (
                 <div className="absolute inset-0 flex items-center justify-center gap-0.5 p-1 z-10">
                    {playersOnSquare.map(p => (
                      <div 
                        key={p.id} 
                        className="w-5 h-5 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.8)] border-2 border-white/30 transition-all duration-300 hover:scale-110"
                        style={{ backgroundColor: p.color }}
                        title={`${p.name}: ${p.actionCount} Actions`}
                      ></div>
                    ))}
                 </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

