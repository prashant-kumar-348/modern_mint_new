import React, { useState, useEffect } from 'react';
import { X, Lock, Rocket, TrendingUp, Award, DollarSign, Dices } from 'lucide-react';
import soundEffects from '../../utils/soundEffects';
import { getPlayerMatTheme } from '../../utils/playerMatThemes';

export default function Phase2PlayerMatModal({ onClose, onPaymentComplete, ownedCompanies = [], actionType, currentRound, activeEvent, teamTokenPool, localPlayer }) {
  const theme = getPlayerMatTheme(localPlayer);

  const companies = [
    { id: 'c1', name: 'CONTRACT FARMING', icon: '/mat-icons/mat-icon-contract-farming.png', data: [[10,100,500,0], [100,200,1000,20], [1000,1000,2500,200], [2000,2000,10000,400]] },
    { id: 'c2', name: 'AGRI IoT', icon: '/mat-icons/mat-icon-agri-iot.png', data: [[100,10,1000,0], [500,300,3000,300], [1500,1500,6000,2000], [8000,8000,36000,7000]] },
    { id: 'c3', name: 'WALLET', icon: '/mat-icons/mat-icon-wallet.png', data: [[50,10,1000,0], [1200,400,3000,400], [1500,2000,8000,1800], [7000,10000,36000,5000]] },
    { id: 'c4', name: 'SNACKS', icon: '/mat-icons/mat-icon-snacks.png', data: [[10,20,1000,0], [300,200,1500,200], [1000,1100,7500,1500], [6000,4000,32000,8000]] },
    { id: 'c5', name: 'QUICK COMMERCE', icon: '/mat-icons/mat-icon-quick-commerce.png', data: [[10,30,100,0], [200,400,2500,100], [2000,1200,10000,800], [10000,4000,50000,6000]] },
    { id: 'c6', name: 'SMART STORAGE', icon: '/mat-icons/mat-icon-smart-storage.png', data: [[200,200,2000,200], [3000,1600,5000,2000], [3000,5400,9000,4000], [10000,7500,40000,12000]] },
    { id: 'c7', name: 'RESTRO - CHAIN', icon: '/mat-icons/mat-icon-restro-chain.png', data: [[150, 300, 1000, 200], [300, 400, 2000, 500], [1200, 1400, 4000, 2000], [12000, 8000, 26000, 15000]] },
    { id: 'c8', name: 'TRACEABILITY', icon: '/mat-icons/mat-icon-traceability.png', data: [[30,30,300,0], [300,200,2000,200], [1200,2000,7500,1000], [10000,8000,38000,5000]] },
    { id: 'c9', name: 'ROBO - PACKAGING', icon: '/mat-icons/mat-icon-robo-packaging.png', data: [[100,150,1500,200], [1200,500,4000,1000], [5000,2500,15000,2000], [4000,9000,45000,8000]] },
  ];

  const TEAM_UPGRADE_COSTS = {
    2: 50,
    3: 100,
    4: 200
  };

  const MULTIPLIER_TABLE = [
    { roll: 1,  multipliers: [-2, -2, -1,  0] },
    { roll: 2,  multipliers: [-2, -1,  0,  1] },
    { roll: 3,  multipliers: [-1, -1,  0,  1] },
    { roll: 4,  multipliers: [-1,  0,  1,  2] },
    { roll: 5,  multipliers: [ 0,  0,  1,  2] },
    { roll: 6,  multipliers: [ 0,  1,  2,  3] },
    { roll: 7,  multipliers: [ 1,  1,  2,  3] },
    { roll: 8,  multipliers: [ 1,  2,  3,  4] },
    { roll: 9,  multipliers: [ 2,  2,  3,  4] },
    { roll: 10, multipliers: [ 2,  3,  4,  5] }
  ];

  const stages = ["Launch", "Retain", "Grow", "Scale"];

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [cinematicStep, setCinematicStep] = useState(0);

  // Workforce Dice Roll State
  const [workforceRollState, setWorkforceRollState] = useState('idle'); // 'idle' | 'rolling' | 'rolled'
  const [workforceRollResult, setWorkforceRollResult] = useState(null);
  const [workforceRollingNum, setWorkforceRollingNum] = useState(1);

  const resetSelection = () => {
    setSelectedCompany(null);
    setCinematicStep(0);
    setWorkforceRollState('idle');
    setWorkforceRollResult(null);
    setWorkforceRollingNum(1);
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setWorkforceRollState('idle');
    setWorkforceRollResult(null);
    setWorkforceRollingNum(1);
    if (actionType === 'stage_up') {
      setCinematicStep(1);
    } else {
      setCinematicStep(2);
    }
  };

  const handleRollWorkforceDice = () => {
    if (workforceRollState === 'rolling' || playerCash < requiredCost) return;
    setWorkforceRollState('rolling');
    setWorkforceRollResult(null);
    try {
      soundEffects.play('dice');
    } catch (e) {
      console.warn('Sound effect error', e);
    }

    const interval = setInterval(() => {
      setWorkforceRollingNum(Math.floor(Math.random() * 10) + 1);
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      const finalRoll = Math.floor(Math.random() * 10) + 1;
      setWorkforceRollResult(finalRoll);
      setWorkforceRollState('rolled');
      try {
        soundEffects.play('coins');
      } catch (e) {
        console.warn('Sound effect error', e);
      }
    }, 1200);
  };

  useEffect(() => {
    if (cinematicStep === 1) {
      const timer = setTimeout(() => {
        setCinematicStep(2);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [cinematicStep]);

  const getStageIndex = (stage) => {
    if (stage === 'L' || stage === 0 || stage === '0') return 0;
    if (stage === 'R' || stage === 1 || stage === '1') return 1;
    if (stage === 'G' || stage === 2 || stage === '2') return 2;
    if (stage === 'S' || stage === 3 || stage === '3') return 3;
    return 0;
  };

  const findOwnedCompany = (targetName) => {
    if (!targetName) return null;
    const clean = targetName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return ownedCompanies.find(c => (c.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === clean) || null;
  };

  let requiredCost = 0;
  if (selectedCompany) {
    if (actionType === 'buy_pr') {
       const ownedData = findOwnedCompany(selectedCompany.name);
       const currentStageIdx = ownedData ? getStageIndex(ownedData.stage) : 0;
       requiredCost = Math.round(selectedCompany.data[currentStageIdx][1] * 0.1);
    } else if (actionType === 'launch') {
       requiredCost = selectedCompany.data[0][0];
    } else if (actionType === 'stage_up') {
       const ownedData = findOwnedCompany(selectedCompany.name);
       const targetIdx = ownedData ? Math.min(getStageIndex(ownedData.stage) + 1, 3) : 0;
       requiredCost = selectedCompany.data[targetIdx][0];
       // Mentor Card half cost effect
       if (localPlayer?.hasHalfCostStageUp || Number(ownedData?.halfCostAllStagesRound) === Number(currentRound) || localPlayer?.halfCostAllStagesCompany === selectedCompany.name) {
          requiredCost = Math.round(requiredCost / 2);
       }
    } else if (actionType === 'upgrade_workforce') {
       const ownedData = findOwnedCompany(selectedCompany.name);
       const currentLvl = ownedData ? Math.min(4, Math.max(1, Number(ownedData.teamLevel || ownedData.team) || 1)) : 1;
       const nextLvl = currentLvl + 1;
       requiredCost = TEAM_UPGRADE_COSTS[nextLvl] || 50;
    }
  }

  const playerCash = Number(localPlayer?.cash || 0);

  // Workforce helpers for selected company
  const selectedOwnedData = selectedCompany ? findOwnedCompany(selectedCompany.name) : null;
  const currentLvl = selectedOwnedData ? Math.min(4, Math.max(1, Number(selectedOwnedData.teamLevel || selectedOwnedData.team) || 1)) : 1;
  const nextLvl = currentLvl + 1;
  const achievedMult = (actionType === 'upgrade_workforce' && workforceRollResult)
    ? MULTIPLIER_TABLE.find(m => m.roll === workforceRollResult)?.multipliers[nextLvl - 1]
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 font-sans animate-in fade-in duration-300">
      
      {/* Outer Desk Container - Exact Player Mat Aesthetic */}
      <div 
        className="relative w-full max-w-[1400px] h-[95vh] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 scale-[0.95] xl:scale-100 origin-center select-none"
        style={{
          backgroundColor: theme.bgOuter,
          borderColor: theme.deskBorder
        }}
      >
        
        {/* Header Action Mode Banner */}
        <div 
          className="border-b px-6 py-2.5 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: theme.bannerBg,
            borderColor: theme.deskBorder
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-7 h-7 rounded-full border-2 overflow-hidden shadow-md shrink-0 flex items-center justify-center"
              style={{ borderColor: theme.pillBg, backgroundColor: theme.cardBg }}
            >
              <img src={theme.avatarSrc} alt={theme.character} className="w-full h-full object-cover select-none" />
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: theme.textLight }}>
              Phase 2 Operations
            </span>
            <span className="text-white/40">•</span>
            <span 
              className="px-3.5 py-0.5 rounded-full font-black text-xs uppercase tracking-wider shadow-sm"
              style={{
                backgroundColor: theme.pillBg,
                color: theme.pillText
              }}
            >
              {actionType === 'launch' ? 'SELECT COMPANY TO LAUNCH' :
               actionType === 'stage_up' ? 'SELECT COMPANY TO STAGE UP' :
               actionType === 'upgrade_workforce' ? 'SELECT COMPANY TO UPGRADE WORKFORCE' :
               'SELECT COMPANY FOR PR SERVICES'}
            </span>
            <span 
              className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border shadow-xs"
              style={{
                backgroundColor: theme.pillBg,
                color: theme.pillText,
                borderColor: theme.cardBorder
              }}
            >
              Founder {theme.id} ({theme.name})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs" style={{ color: theme.textLight }}>
              Your Cash: <span className="font-mono font-black text-white text-sm">${playerCash}K</span>
            </div>
            <div className="text-xs" style={{ color: theme.textLight }}>
              Portfolio: <span className="font-mono font-black text-white text-sm">{ownedCompanies.length}/4</span>
            </div>
            {/* Close Button */}
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-black/40 rounded-full p-1.5 cursor-pointer ml-2 hover:bg-black/60">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* 3x3 Grid of Companies with Exact Player Mat Colors and Text */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 place-content-start">
          {companies.map(company => {
            const ownedData = ownedCompanies.find(c => (c.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === company.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
            const isLaunched = !!ownedData;
            const currentStageIdx = ownedData ? getStageIndex(ownedData.stage) : -1;
            const currentLvlComp = ownedData ? Math.min(4, Math.max(1, Number(ownedData.teamLevel || ownedData.team) || 1)) : 1;
            
            let isLockedForAction = false;
            let lockMessage = "";
            if (actionType === 'launch') {
              if (isLaunched) {
                isLockedForAction = true;
                lockMessage = "ALREADY OWNED";
              } else if (ownedCompanies.length >= 4) {
                isLockedForAction = true;
                lockMessage = "PORTFOLIO FULL (4/4)";
              } else if (playerCash < company.data[0][0]) {
                isLockedForAction = true;
                lockMessage = `NEED $${company.data[0][0]}K CASH`;
              }
            } else if (actionType === 'stage_up') {
              if (!isLaunched) {
                isLockedForAction = true;
                lockMessage = "NOT LAUNCHED YET";
              } else if (getStageIndex(ownedData.stage) >= 3) {
                isLockedForAction = true;
                lockMessage = "MAX STAGE REACHED";
              } else if (Number(ownedData.stageUpBlockedRound) === Number(currentRound)) {
                isLockedForAction = true;
                lockMessage = "BLOCKED BY EVENT";
              } else if (Number(ownedData.launchedRound) === Number(currentRound)) {
                isLockedForAction = true;
                lockMessage = "LAUNCHED THIS ROUND";
              } else if (Number(ownedData.upgradedRound) === Number(currentRound)) {
                isLockedForAction = true;
                lockMessage = "ALREADY STAGED UP";
              } else {
                const targetIdx = Math.min(getStageIndex(ownedData.stage) + 1, 3);
                let neededCost = company.data[targetIdx][0];
                if (localPlayer?.hasHalfCostStageUp || Number(ownedData?.halfCostAllStagesRound) === Number(currentRound) || localPlayer?.halfCostAllStagesCompany === company.name) {
                  neededCost = Math.round(neededCost / 2);
                }
                if (playerCash < neededCost) {
                  isLockedForAction = true;
                  lockMessage = `NEED $${neededCost}K CASH`;
                }
              }
            } else if (actionType === 'buy_pr') {
              if (!isLaunched) {
                isLockedForAction = true;
                lockMessage = "NOT LAUNCHED YET";
              } else if (Number(ownedData.prBoughtRound) === Number(currentRound)) {
                isLockedForAction = true;
                lockMessage = "MAX 1 PR/ROUND";
              }
            } else if (actionType === 'upgrade_workforce') {
              const nextLvlComp = currentLvlComp + 1;
              if (!isLaunched) {
                isLockedForAction = true;
                lockMessage = "NOT LAUNCHED YET";
              } else if (currentLvlComp >= 4) {
                isLockedForAction = true;
                lockMessage = "MAX WORKFORCE (LVL 4)";
              } else if (Number(ownedData.workforceUpgradedRound) === Number(currentRound)) {
                isLockedForAction = true;
                lockMessage = "MAX 1 UPGRADE/ROUND";
              } else if (teamTokenPool && (teamTokenPool[nextLvlComp] ?? teamTokenPool[String(nextLvlComp)] ?? 0) <= 0) {
                isLockedForAction = true;
                lockMessage = `NO LVL ${nextLvlComp} TOKENS LEFT`;
              }
            } else {
              isLockedForAction = !isLaunched;
              lockMessage = "NOT LAUNCHED YET";
            }

            return (
              <div 
                key={company.id} 
                onClick={() => !isLockedForAction && handleCompanyClick(company)}
                className={`rounded-xl pt-2.5 px-3.5 pb-3 border flex flex-col justify-between relative shadow-lg min-h-[315px] transition-all duration-200 ${
                  isLockedForAction 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
                }`}
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder
                }}
              >
                {/* Card Header (Cream Pill) - EXACT Player Mat styling */}
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

                {/* Status Badges */}
                {isLaunched && (
                  <div className="absolute top-2.5 right-3 flex items-center gap-1.5 z-10">
                    <span 
                      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm"
                      style={{
                        backgroundColor: theme.pillBg,
                        color: theme.pillText,
                        borderColor: theme.cardBorder
                      }}
                    >
                      Stage {stages[currentStageIdx] || 'L'}
                    </span>
                    <span className="bg-[#55ffb0] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-black/20 shadow-sm">
                      Team Lvl {ownedData ? Math.min(4, Math.max(1, Number(ownedData.teamLevel || ownedData.team) || 1)) : 1}
                    </span>
                  </div>
                )}

                {isLockedForAction && (
                  <div 
                    className="absolute inset-0 top-6 z-20 flex flex-col items-center justify-center backdrop-blur-[1px] rounded-b-xl pointer-events-none p-4 text-center"
                    style={{ backgroundColor: theme.lockOverlayBg }}
                  >
                    <Lock size={28} className="mb-2 drop-shadow-md" style={{ color: theme.textLight }} />
                    <span 
                      className="border px-3 py-1 rounded-full font-black text-[10px] tracking-widest uppercase shadow-md"
                      style={{
                        backgroundColor: theme.lockBadgeBg,
                        color: theme.textLight,
                        borderColor: 'rgba(255,255,255,0.2)'
                      }}
                    >
                      {lockMessage}
                    </span>
                  </div>
                )}
                
                {/* Data Table - EXACT Player Mat Colors & Typography */}
                <div className="w-full flex-1 flex flex-col justify-center">
                  {/* Column Headers */}
                  <div 
                    className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 text-[10px] uppercase font-black mb-2 pb-1 border-b border-white/20 text-center items-end leading-tight"
                    style={{ color: theme.textLight }}
                  >
                    <div className="text-left pr-1">TEAM</div>
                    <div className="text-left">STAGE</div>
                    <div>INVEST<br/>($K)</div>
                    <div>PROJECTED<br/>REV ($K)</div>
                    <div>VALUATION<br/>($K)</div>
                    <div>LOAN<br/>($K)</div>
                  </div>

                  {/* 4 Stage Rows */}
                  <div className="flex flex-col gap-1.5 py-0.5">
                    {stages.map((stage, idx) => {
                      const rowData = company.data[idx];
                      const isActiveStage = idx === currentStageIdx;
                      const isPastStage = isLaunched && idx < currentStageIdx;
                      const isNextStage = isLaunched && idx === currentStageIdx + 1;
                      const isTargetForStageUp = actionType === 'stage_up' && isNextStage;

                      return (
                        <div 
                          key={idx} 
                          className={`grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-[12px] text-center font-bold px-1 py-1 rounded transition-colors ${
                            isTargetForStageUp 
                              ? 'bg-amber-400/20 border border-amber-300 ring-2 ring-amber-400/50' 
                              : isActiveStage 
                              ? 'bg-emerald-500/20 border border-emerald-400/40' 
                              : isPastStage 
                              ? 'opacity-40' 
                              : ''
                          }`}
                        >
                          <div className="flex justify-center items-center">
                            <div className={`w-5 h-5 rounded-sm border flex items-center justify-center font-mono text-[10px] font-bold ${
                              isActiveStage 
                                ? 'bg-[#55ffb0] border-[#55ffb0] text-black shadow-[0_0_8px_rgba(85,255,176,0.5)]' 
                                : isPastStage 
                                ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-400' 
                                : 'border-white/20 text-transparent'
                            }`}>
                              {isActiveStage ? currentLvlComp : (isPastStage ? '✓' : '')}
                            </div>
                          </div>
                          
                          <div className="text-left font-bold text-[12px] tracking-wide" style={{ color: theme.textLight }}>
                            {stage}
                          </div>

                          <div className={`font-mono font-bold text-[12px] ${isTargetForStageUp ? 'text-amber-300 font-black' : 'text-white'}`}>
                            {rowData[0]}
                          </div>

                          <div className="font-mono font-bold text-[12px] text-white">
                            {rowData[1]}
                          </div>

                          <div className="font-mono font-bold text-[12px] text-white">
                            {rowData[2]}
                          </div>

                          <div className="font-mono font-bold text-[12px] text-white">
                            {rowData[3]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Action Button inside the card when applicable */}
                {!isLockedForAction && (
                  <div className="mt-3 flex justify-center">
                    {actionType === 'launch' && !isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="px-4 py-1.5 rounded-full border-2 font-black uppercase tracking-widest text-[11px] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: theme.pillBg,
                          color: theme.pillText,
                          borderColor: theme.pillText
                        }}
                      >
                        <Rocket size={13} />
                        <span>LAUNCH THIS COMPANY</span>
                      </button>
                    )}
                    {actionType === 'stage_up' && isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="px-4 py-1.5 rounded-full border-2 font-black uppercase tracking-widest text-[11px] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: theme.pillBg,
                          color: theme.pillText,
                          borderColor: theme.pillText
                        }}
                      >
                        <TrendingUp size={13} />
                        <span>UPGRADE TO STAGE {stages[currentStageIdx + 1] || 'NEXT'}</span>
                      </button>
                    )}
                    {actionType === 'upgrade_workforce' && isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="px-4 py-1.5 rounded-full border-2 font-black uppercase tracking-widest text-[11px] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: theme.pillBg,
                          color: theme.pillText,
                          borderColor: theme.pillText
                        }}
                      >
                        <Dices size={14} />
                        <span>UPGRADE WORKFORCE (ROLL DICE)</span>
                      </button>
                    )}
                    {actionType === 'buy_pr' && isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="px-4 py-1.5 rounded-full border-2 font-black uppercase tracking-widest text-[11px] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: theme.pillBg,
                          color: theme.pillText,
                          borderColor: theme.pillText
                        }}
                      >
                        <DollarSign size={13} />
                        <span>BUY PR SERVICES</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Equity Slider Ruler */}
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

              </div>
            );
          })}
        </div>

        {/* PAYMENT & CONFIRMATION OVERLAY IN EXACT PLAYER MAT PALETTE */}
        {selectedCompany && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6" onClick={resetSelection}>
            <div 
              className="border-4 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden relative animate-in zoom-in-95 duration-200" 
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: theme.bgOuter,
                borderColor: theme.deskBorder
              }}
            >
              
              {/* Close Button */}
              {workforceRollState !== 'rolling' && (
                <button 
                  onClick={resetSelection} 
                  className="absolute top-4 right-4 hover:text-white transition-colors z-50 bg-black/40 rounded-full p-2 cursor-pointer"
                  style={{ color: theme.textLight }}
                >
                   <X size={22} />
                </button>
              )}

              {/* SCREEN 2: Cinematic Step for Stage Up */}
              {cinematicStep === 1 && (
                <div className="flex-1 p-8 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                   {(() => {
                     const owned = findOwnedCompany(selectedCompany.name);
                     const currentStage = owned?.stage;
                     const currentStageIdx = currentStage !== undefined ? getStageIndex(currentStage) : 0;
                     return (
                       <>
                         <h2 className="font-black text-2xl md:text-3xl uppercase tracking-widest mb-6" style={{ color: theme.textLight }}>
                           Current Stage
                         </h2>
                         <div className="text-5xl md:text-6xl font-black uppercase mb-6 drop-shadow-md" style={{ color: theme.pillBg }}>
                            {stages[currentStageIdx]}
                         </div>
                         <div 
                           className="p-6 rounded-xl border border-white/20 text-center shadow-lg"
                           style={{ backgroundColor: theme.bannerBg }}
                         >
                           <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80" style={{ color: theme.textLight }}>
                             Projected Revenue
                           </p>
                           <p className="text-3xl text-white font-mono font-black">${selectedCompany.data[currentStageIdx][1]}K</p>
                         </div>
                       </>
                     );
                   })()}
                </div>
              )}

              {/* SCREEN 3: Confirmation / Payment UI in Player Mat Theme */}
              {cinematicStep === 2 && (
                <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center relative animate-in fade-in duration-300 text-center overflow-y-auto">
                  
                  {/* Company Pill Header */}
                  <div 
                    className="rounded-full py-2 px-5 flex items-center gap-3 shadow-md border-2 mb-3"
                    style={{
                      backgroundColor: theme.pillBg,
                      borderColor: theme.cardBorder
                    }}
                  >
                    <img src={selectedCompany.icon} alt={selectedCompany.name} className="w-8 h-8 rounded-full object-contain shrink-0" />
                    <h3 className="font-black text-sm md:text-base uppercase tracking-wide" style={{ color: theme.pillText }}>
                      {selectedCompany.name}
                    </h3>
                  </div>

                  <p className="font-black tracking-widest text-xs md:text-sm uppercase mb-2" style={{ color: theme.textLight }}>
                    {actionType === 'launch' ? 'CONFIRM COMPANY LAUNCH' : 
                     actionType === 'stage_up' ? 'CONFIRM STAGE UPGRADE' : 
                     actionType === 'upgrade_workforce' ? 'UPGRADE WORKFORCE • ROLL THE DICE' : 
                     'CONFIRM PR SERVICES'}
                  </p>

                  {/* Level Transition Pill for Workforce */}
                  {actionType === 'upgrade_workforce' && (
                    <div className="bg-[#55ffb0]/20 border border-[#55ffb0]/40 text-[#55ffb0] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 shadow-sm flex items-center gap-2">
                      <span>Team Level {currentLvl}</span>
                      <span>➔</span>
                      <span className="text-white underline">Team Level {nextLvl}</span>
                    </div>
                  )}

                  {/* Cost Display in Player Mat Style */}
                  <div 
                    className="border rounded-xl p-3.5 w-full max-w-xs mb-4 flex flex-col items-center shadow-inner"
                    style={{
                      backgroundColor: theme.bannerBg,
                      borderColor: theme.deskBorder
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80" style={{ color: theme.textLight }}>
                      Total Required Cost
                    </span>
                    <span className="text-2xl font-mono font-black text-white">${requiredCost}K</span>
                    <div className="w-full flex justify-between text-[11px] mt-2.5 pt-2 border-t border-white/10" style={{ color: theme.textLight }}>
                      <span>Your Cash: ${playerCash}K</span>
                      <span className={playerCash >= requiredCost ? 'text-[#55ffb0]' : 'text-red-400'}>
                        {playerCash >= requiredCost ? `Remaining: $${playerCash - requiredCost}K` : `Shortfall: -$${requiredCost - playerCash}K`}
                      </span>
                    </div>
                  </div>
                  
                  {/* WORKFORCE SPECIFIC DICE ROLL FLOW */}
                  {actionType === 'upgrade_workforce' ? (
                    playerCash < requiredCost ? (
                      <button 
                        disabled
                        className="w-full max-w-xs text-white/30 font-black text-xs py-3.5 px-6 rounded-full border border-white/10 tracking-wider uppercase cursor-not-allowed"
                        style={{ backgroundColor: theme.deskBorder }}
                      >
                        INSUFFICIENT CASH (${requiredCost}K REQUIRED)
                      </button>
                    ) : workforceRollState === 'idle' ? (
                      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                        <button 
                          onClick={handleRollWorkforceDice}
                          className="w-full bg-gradient-to-br from-[#4ade80] to-[#166534] text-white font-black text-sm md:text-base py-3.5 px-6 rounded-2xl shadow-[0_4px_16px_rgba(74,222,128,0.4)] hover:from-[#52ea90] hover:to-[#1b753d] hover:scale-105 active:scale-95 transition-all tracking-wider uppercase border border-[#166534] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Dices size={20} className="text-white" />
                          <span>Roll the Dice (${requiredCost}K)</span>
                        </button>
                        <p className="text-[11px] font-bold uppercase tracking-wider opacity-85" style={{ color: theme.textLight }}>
                          🎲 Roll the D10 die to upgrade workforce
                        </p>
                      </div>
                    ) : workforceRollState === 'rolling' ? (
                      <div className="flex flex-col items-center justify-center w-full max-w-xs my-1">
                        <div className="animate-[spin_0.35s_linear_infinite] drop-shadow-[0_0_25px_rgba(85,255,176,0.7)] my-1">
                          <svg width="105" height="105" viewBox="0 0 200 200">
                            <polygon points="100,20 25,95 60,130" fill="#0f766e" />
                            <polygon points="100,20 175,95 140,130" fill="#0f766e" />
                            <polygon points="25,95 100,180 60,130" fill="#115e59" />
                            <polygon points="175,95 100,180 140,130" fill="#115e59" />
                            <polygon points="60,130 140,130 100,180" fill="#115e59" />
                            <polygon points="100,20 60,130 140,130" fill="#0d9488" />
                            <text x="100" y="106" textAnchor="middle" fill="#ffffff" fontSize="48" fontWeight="900" fontFamily="sans-serif">
                              {workforceRollingNum}
                            </text>
                          </svg>
                        </div>
                        <button 
                          disabled
                          className="w-full mt-2 bg-gradient-to-br from-[#4ade80] to-[#166534] text-white font-black text-sm md:text-base py-3 px-6 rounded-2xl shadow-[0_4px_16px_rgba(74,222,128,0.4)] animate-pulse tracking-wider uppercase border border-[#166534] flex items-center justify-center gap-2 cursor-wait"
                        >
                          <Dices size={20} className="animate-spin text-white" />
                          <span>Rolling the Dice...</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full max-w-xs animate-in zoom-in-75 duration-300">
                        <div className="relative my-1 flex flex-col items-center justify-center">
                          <svg width="105" height="105" viewBox="0 0 200 200" className="drop-shadow-[0_12px_30px_rgba(85,255,176,0.6)]">
                            <polygon points="100,20 25,95 60,130" fill="#0f766e" />
                            <polygon points="100,20 175,95 140,130" fill="#0f766e" />
                            <polygon points="25,95 100,180 60,130" fill="#115e59" />
                            <polygon points="175,95 100,180 140,130" fill="#115e59" />
                            <polygon points="60,130 140,130 100,180" fill="#115e59" />
                            <polygon points="100,20 60,130 140,130" fill="#0d9488" />
                            <text x="100" y="106" textAnchor="middle" fill="#ffffff" fontSize="48" fontWeight="900" fontFamily="sans-serif">
                              {workforceRollResult}
                            </text>
                          </svg>
                          <div className="mt-2 bg-[#55ffb0]/25 border border-[#55ffb0] text-[#55ffb0] px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(85,255,176,0.4)]">
                            Rolled {workforceRollResult} • Team {nextLvl} Multiplier: {achievedMult !== null && achievedMult !== undefined && achievedMult > 0 ? `+${achievedMult}` : achievedMult}x
                          </div>
                        </div>

                        <button 
                          onClick={() => onPaymentComplete(selectedCompany.name, requiredCost, workforceRollResult)}
                          className="w-full mt-3 font-black text-sm md:text-base py-3.5 px-6 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all tracking-wider uppercase border-2 cursor-pointer flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: theme.pillBg,
                            color: theme.pillText,
                            borderColor: theme.pillText
                          }}
                        >
                          <Award size={18} />
                          <span>CONFIRM UPGRADE (TEAM {nextLvl})</span>
                        </button>
                      </div>
                    )
                  ) : (
                    /* Standard Confirmation Button for Launch, Stage Up, PR */
                    playerCash >= requiredCost ? (
                      <button 
                        onClick={() => onPaymentComplete(selectedCompany.name, requiredCost)}
                        className="w-full max-w-xs font-black text-sm md:text-base py-3.5 px-6 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all tracking-wider uppercase border-2 cursor-pointer flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: theme.pillBg,
                          color: theme.pillText,
                          borderColor: theme.pillText
                        }}
                      >
                        <Rocket size={16} />
                        <span>CONFIRM PAYMENT (${requiredCost}K)</span>
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full max-w-xs text-white/30 font-black text-xs py-3.5 px-6 rounded-full border border-white/10 tracking-wider uppercase cursor-not-allowed"
                        style={{ backgroundColor: theme.deskBorder }}
                      >
                        INSUFFICIENT CASH (${requiredCost}K REQUIRED)
                      </button>
                    )
                  )}

                  {workforceRollState !== 'rolling' && (
                    <button 
                      onClick={resetSelection}
                      className="uppercase font-bold text-xs mt-3 transition-colors cursor-pointer hover:underline"
                      style={{ color: theme.textLight }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {/* Right Side: Multiplier Table (for stage_up and upgrade_workforce on Screen 3) */}
              {(actionType === 'stage_up' || actionType === 'upgrade_workforce') && cinematicStep === 2 && (
                <div 
                  className="flex-1 border-t md:border-t-0 md:border-l p-5 flex flex-col"
                  style={{
                    backgroundColor: theme.bannerBg,
                    borderColor: theme.deskBorder
                  }}
                >
                  <div className="mb-3">
                    <h4 className="font-black text-xl uppercase tracking-wider mb-0.5" style={{ color: theme.pillBg }}>
                      Multiplier Table
                    </h4>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-80" style={{ color: theme.textLight }}>
                      Actual Revenue = Projected Revenue x Multiplier
                    </p>
                  </div>
                  
                  <div 
                    className="flex-1 w-full rounded-xl border-2 overflow-hidden flex flex-col shadow-lg"
                    style={{ 
                      backgroundColor: theme.pillBg, 
                      borderColor: theme.cardBorder 
                    }}
                  >
                    {/* Table Header */}
                    <div 
                      className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] border-b text-[10px] uppercase font-black py-2.5 px-2 text-center items-center shrink-0"
                      style={{
                        backgroundColor: theme.tableHeaderBg,
                        borderColor: theme.tableBorder,
                        color: theme.pillText
                      }}
                    >
                      <div className="text-left pl-3 font-black">DICE ROLL</div>
                      {[1, 2, 3, 4].map(lvl => {
                        const isTarget = actionType === 'upgrade_workforce' && nextLvl === lvl;
                        return (
                          <div key={lvl} className="flex justify-center">
                            {isTarget ? (
                              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm tracking-wider">
                                TEAM {lvl}
                              </span>
                            ) : (
                              <span className="font-bold opacity-80">
                                TEAM {lvl}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Table Body (10 rows for D10 rolls 1-10) */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col font-mono">
                      {MULTIPLIER_TABLE.map((item) => {
                        const isRolledRow = actionType === 'upgrade_workforce' && workforceRollResult === item.roll;
                        const isRollingRow = actionType === 'upgrade_workforce' && workforceRollState === 'rolling' && workforceRollingNum === item.roll;
                        return (
                          <div 
                            key={item.roll} 
                            className={`grid grid-cols-[1fr_1fr_1fr_1fr_1fr] border-b text-xs font-bold py-1.5 px-2 text-center items-center transition-all duration-150 ${
                              isRolledRow 
                                ? 'bg-emerald-500/30 font-black shadow-[0_0_15px_rgba(5,150,105,0.4)] scale-[1.01] rounded border-2 border-emerald-600' 
                                : isRollingRow
                                ? 'bg-black/10'
                                : 'hover:bg-black/5'
                            }`}
                            style={{ borderColor: theme.tableBorder }}
                          >
                            <div className="font-black text-left pl-3 flex items-center gap-1.5" style={{ color: theme.pillText }}>
                              <span>{item.roll}</span>
                              {isRolledRow && <span className="text-[10px]">🎲</span>}
                            </div>
                            {item.multipliers.map((m, mIdx) => {
                              const isTargetCol = actionType === 'upgrade_workforce' && mIdx === (nextLvl - 1);
                              const textColor = m < 0 ? '#DC2626' : m === 0 ? '#4B5563' : '#047857';
                              return (
                                <div 
                                  key={mIdx} 
                                  className={`text-xs ${
                                    isTargetCol 
                                      ? 'font-black bg-emerald-500/20 rounded py-0.5 shadow-xs' 
                                      : 'font-bold'
                                  }`}
                                  style={{
                                    color: isTargetCol && isRolledRow ? '#047857' : textColor
                                  }}
                                >
                                  {m > 0 ? `+${m}` : m}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
