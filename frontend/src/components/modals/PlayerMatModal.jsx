import React, { useState } from 'react';
import { X, Lock, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { getPlayerMatTheme } from '../../utils/playerMatThemes';

export default function PlayerMatModal({ 
  onClose, 
  ownedCompanies = [], 
  player = null, 
  allPlayers = [],
  deals = [],
  isHoverOpened = false, 
  onPin, 
  onLaunchCompany, 
  onUndoLaunch 
}) {
  const theme = getPlayerMatTheme(player);

  // Lifeline / Second Chance tracker (2 lifelines per game for Founders only)
  const currentLifelines = player?.lifelines !== undefined ? Number(player.lifelines) : 2;
  const isFirstChanceStricken = currentLifelines < 2;
  const isSecondChanceStricken = currentLifelines < 1;
  const avatarSrc = theme.avatarSrc;

  const [showFullArt, setShowFullArt] = useState(false);

  // Exact company metrics matching physical board mats
  const companies = [
    { id: 'c1', name: 'CONTRACT FARMING', icon: '/company-contract-farming.png', data: [[10,100,500,0], [100,200,1000,20], [1000,1000,2500,200], [2000,2000,10000,400]] },
    { id: 'c2', name: 'AGRI IoT', icon: '/company-agri-iot.png', data: [[100,10,1000,0], [500,300,3000,300], [1500,1500,6000,2000], [8000,8000,36000,7000]] },
    { id: 'c3', name: 'WALLET', icon: '/company-wallet.png', data: [[50,10,1000,0], [1200,400,3000,400], [1500,2000,8000,1800], [7000,10000,36000,5000]] },
    { id: 'c4', name: 'SNACKS', icon: '/company-snacks.png', data: [[10,20,1000,0], [300,200,1500,200], [1000,1100,7500,1500], [6000,4000,32000,8000]] },
    { id: 'c5', name: 'QUICK COMMERCE', icon: '/company-quick-commerce.png', data: [[10,30,100,0], [200,400,2500,100], [2000,1200,10000,800], [10000,4000,50000,6000]] },
    { id: 'c6', name: 'SMART STORAGE', icon: '/company-smart-storage.png', data: [[200,200,2000,200], [3000,1600,5000,2000], [3000,5400,9000,4000], [10000,7500,40000,12000]] },
    { id: 'c7', name: 'RESTRO - CHAIN', icon: '/company-restro-chain.png', data: [[150, 300, 1000, 200], [300, 400, 2000, 500], [1200, 1400, 4000, 2000], [12000, 8000, 26000, 15000]] },
    { id: 'c8', name: 'TRACEABILITY', icon: '/company-traceability.png', data: [[30,30,300,0], [300,200,2000,200], [1200,2000,7500,1000], [10000,8000,38000,5000]] },
    { id: 'c9', name: 'ROBO - PACKAGING', icon: '/company-robo-packaging.png', data: [[100,150,1500,200], [1200,500,4000,1000], [5000,2500,15000,2000], [4000,9000,45000,8000]] },
  ];

  const stages = ["Launch", "Retain", "Grow", "Scale"];
  const stageOrder = { 'l': 0, 'launch': 0, 'r': 1, 'retain': 1, 'g': 2, 'grow': 2, 's': 3, 'scale': 3 };

  // 4 Founders in the exact order shown on physical Investor Mat (Red, Teal, Charcoal, Orange)
  const FOUNDERS = [
    { id: 1, name: 'Alex', color: '#8b263e', label: 'Founder 1 (Alex)', dotColor: '#7e3144', activeGlow: 'rgba(239, 68, 68, 0.9)' },
    { id: 4, name: 'Jordan', color: '#2b828a', label: 'Founder 4 (Jordan)', dotColor: '#366369', activeGlow: 'rgba(20, 184, 166, 0.9)' },
    { id: 3, name: 'Meera', color: '#3c4042', label: 'Founder 3 (Meera)', dotColor: '#3c4042', activeGlow: 'rgba(148, 163, 184, 0.9)' },
    { id: 2, name: 'Rohit', color: '#cc8a4d', label: 'Founder 2 (Rohit)', dotColor: '#cc8a4d', activeGlow: 'rgba(245, 158, 11, 0.9)' }
  ];

  const [teamAllocations, setTeamAllocations] = useState({});
  const [manualDots, setManualDots] = useState({});
  const [investorTeamNotes, setInvestorTeamNotes] = useState({});
  const [investorEquityNotes, setInvestorEquityNotes] = useState({});
  const [notes, setNotes] = useState("");

  const normalizeComp = (name) => (name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const getFounderPlayer = (founderId) => {
    return (allPlayers || []).find(p => {
      const t = getPlayerMatTheme(p);
      return t.id === founderId && !t.isInvestor;
    });
  };

  const isFounderAtStage = (companyName, founderId, stageIdx) => {
    const customKey = `${normalizeComp(companyName)}-${stageIdx}-${founderId}`;
    if (manualDots[customKey] !== undefined) {
      return manualDots[customKey];
    }
    const fPlayer = getFounderPlayer(founderId);
    if (!fPlayer) return false;
    const owned = (fPlayer.ownedCompanies || []).find(c => normalizeComp(c.name) === normalizeComp(companyName));
    if (!owned) return false;
    const st = String(owned.stage || 'L').toLowerCase();
    const currentStageIdx = stageOrder[st] ?? 0;
    return currentStageIdx >= stageIdx;
  };

  const toggleStageDot = (companyName, stageIdx, founderId) => {
    const customKey = `${normalizeComp(companyName)}-${stageIdx}-${founderId}`;
    const currentlyActive = isFounderAtStage(companyName, founderId, stageIdx);
    setManualDots(prev => ({
      ...prev,
      [customKey]: !currentlyActive
    }));
  };

  const getFounderTeamLevel = (companyName, founderId) => {
    const customKey = `${normalizeComp(companyName)}-${founderId}`;
    if (investorTeamNotes[customKey] !== undefined) {
      return investorTeamNotes[customKey];
    }
    const fPlayer = getFounderPlayer(founderId);
    if (!fPlayer) return '';
    const owned = (fPlayer.ownedCompanies || []).find(c => normalizeComp(c.name) === normalizeComp(companyName));
    if (!owned) return '';
    const lvl = owned.teamLevel || owned.team || 1;
    return String(lvl);
  };

  const handleTeamNoteChange = (companyName, founderId, val) => {
    const customKey = `${normalizeComp(companyName)}-${founderId}`;
    setInvestorTeamNotes(prev => ({ ...prev, [customKey]: val }));
  };

  const getFounderEquityTaken = (companyName, founderId) => {
    const customKey = `${normalizeComp(companyName)}-${founderId}`;
    if (investorEquityNotes[customKey] !== undefined) {
      return investorEquityNotes[customKey];
    }
    const fPlayer = getFounderPlayer(founderId);
    if (!fPlayer) return '';
    const normTargetComp = normalizeComp(companyName);
    
    let totalEquity = 0;
    (deals || []).forEach(d => {
      const isStatusOk = d.status === 'accepted' || d.partnerSigned;
      if (!isStatusOk) return;

      const isInv = (d.investorId && d.investorId === player?.id) || 
                    (d.investorName && d.investorName?.toLowerCase() === player?.name?.toLowerCase()) ||
                    (d.partner?.toLowerCase() === player?.name?.toLowerCase() && player?.role?.toLowerCase() === 'investor') ||
                    (d.proposer?.toLowerCase() === player?.name?.toLowerCase() && player?.role?.toLowerCase() === 'investor');

      const isFounder = (d.founderId && d.founderId === fPlayer?.id) || 
                        (d.founderName && d.founderName?.toLowerCase() === fPlayer?.name?.toLowerCase()) ||
                        (d.proposer?.toLowerCase() === fPlayer?.name?.toLowerCase() && fPlayer?.role?.toLowerCase() === 'founder') ||
                        (d.partner?.toLowerCase() === fPlayer?.name?.toLowerCase() && fPlayer?.role?.toLowerCase() === 'founder');

      const isComp = normalizeComp(d.companyName) === normTargetComp;
      if (isInv && isFounder && isComp) {
        totalEquity += Number(d.equity) || 0;
      }
    });

    if (totalEquity > 0) {
      return `${totalEquity}%`;
    }
    return '';
  };

  const handleEquityNoteChange = (companyName, founderId, val) => {
    const customKey = `${normalizeComp(companyName)}-${founderId}`;
    setInvestorEquityNotes(prev => ({ ...prev, [customKey]: val }));
  };

  const handleTeamChange = (companyId, stageIndex, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setTeamAllocations(prev => ({ ...prev, [`${companyId}-${stageIndex}`]: numericValue }));
  };

  const toggleLaunch = (companyId) => {
    // Disabled in Phase 2 reactive mode: companies can only be launched via the Phase 2 Dashboard actions!
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center font-sans transition-colors duration-300 ${
        isHoverOpened ? 'bg-black/40 backdrop-blur-sm p-1 sm:p-4' : 'bg-black/60 backdrop-blur-md p-2 sm:p-6'
      }`}
      onClick={onClose}
      onMouseLeave={() => {
        if (isHoverOpened && onClose) {
          onClose();
        }
      }}
    >
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onPin) onPin();
        }}
        onMouseLeave={() => {
          if (isHoverOpened && onClose) {
            onClose();
          }
        }}
        className={`relative w-full max-w-[1400px] h-[95vh] rounded-xl border-4 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isHoverOpened 
            ? 'scale-[0.8] origin-bottom shadow-[0_0_40px_rgba(0,0,0,0.9)]' 
            : 'scale-100 origin-center shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-[20%]'
        }`}
        style={{
          backgroundColor: theme.bgOuter,
          borderColor: theme.deskBorder,
          boxShadow: `0 0 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(0,0,0,0.25)`
        }}
      >
        {/* Top Themed Character Header & View Switcher */}
        <div 
          className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 z-20"
          style={{ backgroundColor: theme.bannerBg, borderColor: theme.deskBorder }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full border-2 overflow-hidden shadow-md shrink-0 flex items-center justify-center"
              style={{ borderColor: theme.pillBg, backgroundColor: theme.cardBg }}
            >
              <img 
                src={avatarSrc} 
                alt={theme.character} 
                className="w-full h-full object-cover select-none" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: theme.textLight }}>
                {player?.name ? `${player.name.toUpperCase()}’S PLAYER MAT` : `${theme.character.toUpperCase()} MAT`}
              </span>
              <span className="text-[10px] opacity-75 font-mono" style={{ color: theme.textLight }}>
                Theme: {theme.name} Edition
              </span>
            </div>
            <span 
              className="ml-2 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border shadow-sm"
              style={{ 
                backgroundColor: theme.pillBg, 
                color: theme.pillText, 
                borderColor: theme.cardBorder 
              }}
            >
              {theme.isInvestor ? (theme.character || "Investor") : `Founder ${theme.id}`}
            </span>
          </div>

          <div className="flex items-center gap-3 mr-10">
            {/* View Mode Toggle: Interactive Mat vs Full Art */}
            <button
              onClick={() => setShowFullArt(!showFullArt)}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              style={{
                backgroundColor: showFullArt ? theme.pillBg : 'rgba(0,0,0,0.35)',
                color: showFullArt ? theme.pillText : theme.textLight,
                borderColor: 'rgba(255,255,255,0.25)'
              }}
            >
              {showFullArt ? (
                <>
                  <LayoutGrid size={13} />
                  <span>Interactive View</span>
                </>
              ) : (
                <>
                  <ImageIcon size={13} />
                  <span>Full Art Mat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hover preview indicator badge */}
        {isHoverOpened && (
          <div 
            className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/20 shadow-md pointer-events-none z-50 flex items-center gap-1.5 animate-pulse"
            style={{ color: theme.textLight }}
          >
            <span>Hover Preview</span>
            <span className="text-white/40">•</span>
            <span className="text-[#55ffb0]">Click to Expand</span>
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-4 text-white/50 hover:text-white z-50 transition-colors bg-black/40 rounded-full p-1.5 cursor-pointer hover:bg-black/60"
        >
          <X size={24} />
        </button>

        {/* Full Art Preview Mode */}
        {showFullArt ? (
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-black/20">
            <img 
              src={theme.matImg} 
              alt={`${theme.name} Player Mat`} 
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border-2"
              style={{ borderColor: theme.deskBorder }}
            />
          </div>
        ) : (
          /* Interactive Mat Grid */
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 flex flex-col xl:flex-row gap-6">
            
            {/* ================================================= */}
            {/* LEFT: 3x3 Grid of Companies                       */}
            {/* ================================================= */}
            <div className="flex-[3] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(company => {
                const isLaunched = ownedCompanies.some(c => normalizeComp(c.name) === normalizeComp(company.name));

                return (
                  <div 
                    key={company.id} 
                    className="rounded-xl pt-2.5 px-3.5 pb-3 border flex flex-col justify-between relative shadow-lg min-h-[315px] transition-all"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder
                    }}
                  >
                    {/* Card Header (Cream Pill) */}
                    <div 
                      className="w-[95%] mx-auto rounded-full py-1.5 px-2.5 flex items-center gap-2.5 shadow-md border-2 -mt-5 mb-2.5 relative z-10 shrink-0"
                      style={{
                        backgroundColor: theme.pillBg,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <img 
                        src={company.icon} 
                        alt={company.name} 
                        className="w-8 h-8 rounded-full object-contain select-none shrink-0" 
                      />
                      <h3 
                        className="font-black text-xs md:text-sm uppercase tracking-wide leading-none flex-1 text-center pr-3 select-none"
                        style={{ color: theme.pillText }}
                      >
                        {company.name}
                      </h3>
                    </div>

                    {/* LAUNCH OVERLAY (Founders Only - Investors never launch companies) */}
                    {!isLaunched && !theme.isInvestor && (
                       <div className="absolute inset-0 top-5 z-20 flex flex-col items-center justify-center bg-black/10 rounded-b-xl border-t border-white/5 pointer-events-none">
                          <Lock size={26} className="text-white/60 mb-2 drop-shadow-md" />
                          <button 
                            onClick={() => {
                              if (onLaunchCompany) {
                                onLaunchCompany(company);
                              } else {
                                toggleLaunch(company.id);
                              }
                            }}
                            className="pointer-events-auto px-5 py-2 rounded-full border-2 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl text-xs cursor-pointer"
                            style={{
                              backgroundColor: theme.pillBg,
                              color: theme.pillText,
                              borderColor: theme.pillText
                            }}
                          >
                            Launch Company
                          </button>
                       </div>
                    )}

                    {/* Undo Launch Button (Founders Only) */}
                    {isLaunched && !theme.isInvestor && (
                       <button 
                         onClick={() => {
                           if (onUndoLaunch) {
                             onUndoLaunch(company);
                           } else {
                             toggleLaunch(company.id);
                           }
                         }} 
                         className="absolute top-3 right-3 text-[10px] text-white/60 hover:text-white uppercase font-bold z-10 transition-colors cursor-pointer hover:underline"
                       >
                         Undo Launch
                       </button>
                    )}

                    {/* Data Table */}
                    <div className="w-full flex-1 flex flex-col justify-center">
                      {theme.isInvestor ? (
                        /* ================= INVESTOR TABLE LAYOUT ================= */
                        <>
                          {/* Headers */}
                          <div 
                            className="grid grid-cols-[64px_1fr_1fr_1fr_1fr] gap-1 text-[10px] uppercase font-black mb-1.5 pb-1 border-b border-white/20 text-center items-end leading-tight"
                            style={{ color: theme.textLight }}
                          >
                            <div className="text-left">STAGE</div>
                            <div>Invest<br/>($K)</div>
                            <div>Projected<br/>Rev ($K)</div>
                            <div>Valuation<br/>($K)</div>
                            <div>Loan<br/>($K)</div>
                          </div>

                          {/* Rows with 4 Founder Tracking Dots */}
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {stages.map((stage, i) => (
                              <div key={i} className="grid grid-cols-[64px_1fr_1fr_1fr_1fr] gap-1 items-center text-[12px] text-white text-center font-bold">
                                {/* Stage Name & 4 Founder Dots */}
                                <div className="flex flex-col items-start justify-center pr-1 select-none">
                                  <span className="font-bold text-[11px] tracking-wide leading-tight" style={{ color: theme.textLight }}>
                                    {stage}
                                  </span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {FOUNDERS.map(f => {
                                      const isReached = isFounderAtStage(company.name, f.id, i);
                                      return (
                                        <button
                                          key={f.id}
                                          type="button"
                                          onClick={() => toggleStageDot(company.name, i, f.id)}
                                          title={`${f.label}: ${stage} (${isReached ? 'Active' : 'Inactive'}) - Click to mark`}
                                          className={`w-[11px] h-[11px] rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                                            isReached ? 'scale-110 shadow-xs' : 'opacity-40 hover:opacity-80'
                                          }`}
                                          style={{
                                            backgroundColor: isReached ? f.dotColor : 'transparent',
                                            borderColor: f.dotColor,
                                            boxShadow: isReached ? `0 0 5px ${f.activeGlow}` : 'none'
                                          }}
                                        >
                                          {isReached && (
                                            <span className="w-[3px] h-[3px] rounded-full bg-white drop-shadow-xs" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][0]}</div>
                                <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][1]}</div>
                                <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][2]}</div>
                                <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][3]}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        /* ================= FOUNDER TABLE LAYOUT ================= */
                        <>
                          {/* Headers */}
                          <div 
                            className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 text-[10px] uppercase font-black mb-2 pb-1 border-b border-white/20 text-center items-end leading-tight"
                            style={{ color: theme.textLight }}
                          >
                            <div className="text-left pr-1">TEAM</div>
                            <div className="text-left">STAGE</div>
                            <div>Invest<br/>($K)</div>
                            <div>Projected<br/>Rev ($K)</div>
                            <div>Valuation<br/>($K)</div>
                            <div>Loan<br/>($K)</div>
                          </div>

                          {/* Rows */}
                          <div className="flex flex-col gap-2 py-0.5">
                            {stages.map((stage, i) => {
                              const ownedComp = ownedCompanies.find(c => normalizeComp(c.name) === normalizeComp(company.name));
                              const currentStageIdx = ownedComp ? ((ownedComp.stage === 'L' || ownedComp.stage === 0) ? 0 : (ownedComp.stage === 'R' || ownedComp.stage === 1) ? 1 : (ownedComp.stage === 'G' || ownedComp.stage === 2) ? 2 : 3) : -1;
                              const compTeamLevel = ownedComp ? Math.min(4, Math.max(1, Number(ownedComp.teamLevel || ownedComp.team) || 1)) : 1;
                              const isCurrentStage = isLaunched && i === currentStageIdx;
                              const isPast = isLaunched && i < currentStageIdx;
                              const defaultVal = isCurrentStage ? String(compTeamLevel) : (isPast ? '✓' : '');
                              const displayVal = teamAllocations[`${company.id}-${i}`] !== undefined ? teamAllocations[`${company.id}-${i}`] : defaultVal;

                              return (
                                <div key={i} className={`grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-[12px] text-white text-center font-bold ${isCurrentStage ? 'bg-amber-400/10 rounded py-0.5' : ''}`}>
                                  <input
                                    type="text" 
                                    maxLength="2" 
                                    value={displayVal}
                                    onChange={(e) => handleTeamChange(company.id, i, e.target.value)}
                                    className={`w-6 h-6 border-2 rounded-sm text-center text-xs font-bold outline-none transition-all ${
                                      isCurrentStage 
                                        ? 'bg-[#55ffb0]/20 border-[#55ffb0] text-[#55ffb0] font-black shadow-[0_0_6px_rgba(85,255,176,0.4)]' 
                                        : isPast 
                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 font-bold' 
                                        : 'bg-transparent border-white/30 text-white/40'
                                    }`}
                                  />
                                  <div className={`text-left font-bold text-[12px] tracking-wide ${isCurrentStage ? 'text-amber-300 font-black' : ''}`} style={{ color: isCurrentStage ? undefined : theme.textLight }}>
                                    {stage}
                                  </div>
                                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][0]}</div>
                                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][1]}</div>
                                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][2]}</div>
                                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][3]}</div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom Tracking Section */}
                    {theme.isInvestor ? (
                      /* ================= INVESTOR: TEAM & EQUITY TAKEN 2x2 GRIDS ================= */
                      <div className="mt-2 pt-2 border-t border-white/20 flex gap-3 px-1 shrink-0">
                        {/* Left: TEAM 2x2 Grid */}
                        <div className="flex-1 flex flex-col">
                          <div className="text-[9px] uppercase font-black tracking-wider mb-1 text-center" style={{ color: theme.textLight }}>
                            TEAM
                          </div>
                          <div className="grid grid-cols-2 gap-1 flex-1">
                            {FOUNDERS.map(f => {
                              const val = getFounderTeamLevel(company.name, f.id);
                              return (
                                <div 
                                  key={f.id}
                                  className="rounded-xs border border-white/20 flex items-center justify-center px-1 py-0.5 relative transition-all group"
                                  style={{ backgroundColor: f.dotColor }}
                                  title={`${f.label}: Team Level`}
                                >
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="2"
                                    value={val}
                                    onChange={(e) => handleTeamNoteChange(company.name, f.id, e.target.value)}
                                    placeholder="-"
                                    className="w-full bg-transparent border-none text-center text-white text-[11px] font-black font-mono outline-none placeholder-white/30"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right: EQUITY TAKEN 2x2 Grid */}
                        <div className="flex-1 flex flex-col">
                          <div className="text-[9px] uppercase font-black tracking-wider mb-1 text-center" style={{ color: theme.textLight }}>
                            EQUITY TAKEN
                          </div>
                          <div className="grid grid-cols-2 gap-1 flex-1">
                            {FOUNDERS.map(f => {
                              const val = getFounderEquityTaken(company.name, f.id);
                              return (
                                <div 
                                  key={f.id}
                                  className="rounded-xs border border-white/20 flex items-center justify-center px-1 py-0.5 relative transition-all group"
                                  style={{ backgroundColor: f.dotColor }}
                                  title={`${f.label}: Equity Taken (%)`}
                                >
                                  <input
                                    type="text"
                                    maxLength="4"
                                    value={val}
                                    onChange={(e) => handleEquityNoteChange(company.name, f.id, e.target.value)}
                                    placeholder="-%"
                                    className="w-full bg-transparent border-none text-center text-white text-[11px] font-black font-mono outline-none placeholder-white/30"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ================= FOUNDER: EQUITY SLIDER RULER ================= */
                      <div className="mt-2.5 pt-2 border-t border-white/15 flex items-end gap-2 px-1 shrink-0">
                        <div className="text-[8px] uppercase font-bold leading-tight w-8 text-right shrink-0" style={{ color: theme.textLight }}>
                          EQUITY<br/>GIVEN
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-end h-2.5 border-b border-white/40 mb-1 px-0.5">
                            {[0,10,20,30,40,50,60,70,80,90,100].map(num => (
                              <div key={num} className={`w-[1px] bg-white/70 ${num % 20 === 0 ? 'h-2' : 'h-1'}`}></div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] text-white font-mono font-bold px-0.5 leading-none">
                            {[0,10,20,30,40,50,60,70,80,90,100].map(num => (
                               <span key={num} className="w-3 text-center leading-none">{num}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* ================================================= */}
            {/* RIGHT: Sidebars (Second Chance, Multiplier, Notes)*/}
            {/* ================================================= */}
            <div className="flex-1 flex flex-col gap-4 min-w-[320px] max-w-sm mx-auto xl:mx-0">
              
              {/* Second Chance Tokens (Founders Only - Investors do not have Second Chance) */}
              {!theme.isInvestor && (
                <div 
                  className="rounded-xl border-2 p-3 text-center shadow-lg"
                  style={{
                    backgroundColor: theme.pillBg,
                    borderColor: theme.cardBorder
                  }}
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="font-black uppercase tracking-widest text-xs md:text-sm" style={{ color: theme.pillText }}>
                      Second Chance
                    </h3>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs ${
                      currentLifelines === 2 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : currentLifelines === 1 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {currentLifelines} / 2 Left
                    </span>
                  </div>
                  <div 
                    className="border rounded-full px-4 py-2 flex justify-center items-center gap-3 relative overflow-hidden"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.cardBorder
                    }}
                  >
                    {/* 1st Chance (Circle 1) */}
                    <div 
                      title={isFirstChanceStricken ? "1st Chance: Used (Stricken)" : "1st Chance: Available"}
                      className={`w-12 h-12 rounded-full p-[2px] border flex items-center justify-center relative shrink-0 shadow-md transition-all duration-300 ${
                        !isFirstChanceStricken 
                          ? 'ring-2 ring-[#55ffb0]/80 shadow-[0_0_10px_rgba(85,255,176,0.5)] cursor-pointer hover:scale-105' 
                          : 'opacity-70'
                      }`}
                      style={{
                        backgroundColor: theme.pillBg,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                        <img 
                          src={avatarSrc} 
                          alt="Second Chance 1" 
                          className={`w-full h-full object-cover select-none rounded-full ${isFirstChanceStricken ? 'filter grayscale opacity-75' : ''}`} 
                        />
                        {isFirstChanceStricken && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="absolute w-[130%] h-[4.5px] bg-black/80 -rotate-45 rounded-full" />
                            <div className="absolute w-[130%] h-[3px] bg-[#EF4444] -rotate-45 rounded-full shadow-[0_0_6px_rgba(239,68,68,1)]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2nd Chance (Circle 2) */}
                    <div 
                      title={isSecondChanceStricken ? "2nd Chance: Used (Stricken)" : "2nd Chance: Available"}
                      className={`w-12 h-12 rounded-full p-[2px] border flex items-center justify-center relative shrink-0 shadow-md transition-all duration-300 ${
                        !isSecondChanceStricken 
                          ? 'ring-2 ring-[#55ffb0]/80 shadow-[0_0_10px_rgba(85,255,176,0.5)] cursor-pointer hover:scale-105' 
                          : 'opacity-70'
                      }`}
                      style={{
                        backgroundColor: theme.pillBg,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                        <img 
                          src={avatarSrc} 
                          alt="Second Chance 2" 
                          className={`w-full h-full object-cover select-none rounded-full ${isSecondChanceStricken ? 'filter grayscale opacity-75' : ''}`} 
                        />
                        {isSecondChanceStricken && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="absolute w-[130%] h-[4.5px] bg-black/80 -rotate-45 rounded-full" />
                            <div className="absolute w-[130%] h-[3px] bg-[#EF4444] -rotate-45 rounded-full shadow-[0_0_6px_rgba(239,68,68,1)]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Speed lines separator */}
                    <div className="w-[18px] h-9 flex items-center justify-center opacity-40 select-none">
                      <div className="w-[2px] h-full bg-white rotate-12 mx-0.5"></div>
                      <div className="w-[2px] h-full bg-white rotate-12 mx-0.5"></div>
                    </div>

                    {/* Inactive Token / Used Slot */}
                    <div 
                      title="Used Token Track"
                      className="w-12 h-12 rounded-full p-[2px] border flex items-center justify-center relative shrink-0 shadow-md opacity-60"
                      style={{
                        backgroundColor: theme.pillBg,
                        borderColor: theme.cardBorder
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                        <img 
                          src={avatarSrc} 
                          alt="Second Chance Inactive" 
                          className="w-full h-full object-cover select-none rounded-full filter grayscale opacity-75" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Multiplier Table */}
              <div 
                className="rounded-xl border-2 overflow-hidden shadow-lg"
                style={{
                  backgroundColor: theme.pillBg,
                  borderColor: theme.cardBorder
                }}
              >
                <div 
                  className="p-2 text-[9px] text-center font-black uppercase tracking-wider border-b"
                  style={{
                    color: theme.pillText,
                    borderColor: theme.tableBorder
                  }}
                >
                   *Actual Revenue = Projected Revenue x Multiplier
                </div>
                <table className="w-full text-center text-[10px] font-bold border-collapse" style={{ color: theme.pillText }}>
                  <thead>
                    <tr style={{ backgroundColor: theme.tableHeaderBg }}>
                      <th className="border-r border-b p-1 w-12 text-[8px]" rowSpan="2" style={{ borderColor: theme.tableBorder }}>DICE<br/>ROLL</th>
                      <th className="border-b p-1 tracking-widest text-[10px]" colSpan="4" style={{ borderColor: theme.tableBorder }}>MULTIPLIER</th>
                    </tr>
                    <tr style={{ backgroundColor: theme.tableHeaderBg }} className="text-[8px]">
                      <th className="border-r border-b p-1" style={{ borderColor: theme.tableBorder }}>TEAM 1<br/>$0K</th>
                      <th className="border-r border-b p-1" style={{ borderColor: theme.tableBorder }}>TEAM 2<br/>$300K</th>
                      <th className="border-r border-b p-1" style={{ borderColor: theme.tableBorder }}>TEAM 3<br/>$2000K</th>
                      <th className="border-b p-1" style={{ borderColor: theme.tableBorder }}>TEAM 4<br/>$8000K</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono font-medium" style={{ backgroundColor: theme.pillBg }}>
                    {[
                      [1, -2, -2, -1, 0], [2, -2, -1, 0, 1], [3, -1, -1, 0, 1],
                      [4, -1, 0, 1, 2], [5, 0, 0, 1, 2], [6, 0, 1, 2, 3],
                      [7, 1, 1, 2, 3], [8, 1, 2, 3, 4], [9, 2, 2, 3, 4], [10, 2, 3, 4, 5]
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-black/5 transition-colors">
                        <td className="border-r border-b p-1 font-bold" style={{ borderColor: theme.tableBorder, backgroundColor: theme.tableHeaderBg + '50' }}>{row[0]}</td>
                        <td className="border-r border-b p-1" style={{ borderColor: theme.tableBorder }}>{row[1]}</td>
                        <td className="border-r border-b p-1" style={{ borderColor: theme.tableBorder }}>{row[2]}</td>
                        <td className="border-r border-b p-1" style={{ borderColor: theme.tableBorder }}>{row[3]}</td>
                        <td className="border-b p-1" style={{ borderColor: theme.tableBorder }}>{row[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes Section */}
              <div 
                className={`rounded-xl border-2 p-4 shadow-lg flex-1 flex flex-col relative ${theme.isInvestor ? 'min-h-[300px]' : 'min-h-[220px]'}`}
                style={{
                  backgroundColor: theme.pillBg,
                  borderColor: theme.cardBorder
                }}
              >
                <h3 
                  className="font-black uppercase text-sm mb-2 text-center tracking-widest border-b pb-2"
                  style={{
                    color: theme.pillText,
                    borderColor: theme.tableBorder
                  }}
                >
                  Notes / Calculations
                </h3>
                <textarea 
                  className="flex-1 w-full bg-transparent border-none outline-none resize-none font-sans text-sm p-2 font-medium"
                  placeholder={theme.isInvestor ? "Track founder pitches, equity stakes, valuations, and notes here..." : "Type your notes and calculations here..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ color: theme.pillText }}
                />
                {/* Watermark Logo */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none opacity-85">
                   <img src="/mat-icons/modern-mint-mat-logo.png" alt="Modern Mint" className="h-[20px] object-contain drop-shadow-sm select-none" />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
