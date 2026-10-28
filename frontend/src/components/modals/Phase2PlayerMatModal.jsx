import React, { useState, useEffect } from 'react';
import { X, Lock, Rocket, TrendingUp, Award, DollarSign } from 'lucide-react';

export default function Phase2PlayerMatModal({ onClose, onPaymentComplete, ownedCompanies = [], actionType, currentRound, activeEvent, teamTokenPool, localPlayer }) {
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

  const stages = ["Launch", "Retain", "Grow", "Scale"];

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [cinematicStep, setCinematicStep] = useState(0);

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    if (actionType === 'stage_up') {
      setCinematicStep(1);
    } else {
      setCinematicStep(2);
    }
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
       const prCosts = [100, 300, 500, 700];
       let baseCost = prCosts[ownedData ? (ownedData.team || 1) - 1 : 0] || 100;
       if (Number(ownedData?.freePRRound) === Number(currentRound) || Number(localPlayer?.freePRRound) === Number(currentRound)) {
         baseCost = 0;
       } else {
         if (Number(localPlayer?.taxDiscountRound) === Number(currentRound)) {
           baseCost = Math.round(baseCost / 2);
         }
         if (activeEvent?.effect === 'pr_discount_100') {
           baseCost = Math.max(0, baseCost - 100);
         }
       }
       requiredCost = baseCost;
    } else if (actionType === 'upgrade_workforce') {
       const ownedData = findOwnedCompany(selectedCompany.name);
       if (ownedData) {
         const currentLvl = Math.min(4, Math.max(1, Number(ownedData.teamLevel || ownedData.team) || 1));
         const nextLvl = currentLvl + 1;
         let baseCost = TEAM_UPGRADE_COSTS[nextLvl] || 50;
         if (Number(ownedData?.freeWorkforceRound) === Number(currentRound) || Number(localPlayer?.freeWorkforceRound) === Number(currentRound)) {
           baseCost = 0;
         } else if (activeEvent?.effect === 'workforce_discount_half') {
           baseCost = Math.round(baseCost / 2);
         }
         requiredCost = baseCost;
       }
    } else {
      const ownedData = findOwnedCompany(selectedCompany.name);
      let targetStageIdx = 0;
      if (actionType === 'stage_up' && ownedData) {
         targetStageIdx = Math.min(getStageIndex(ownedData.stage) + 1, 3);
      }
      let baseCost = selectedCompany.data[targetStageIdx][0];
      if (actionType === 'stage_up' && (localPlayer?.hasHalfCostStageUp || Number(ownedData?.halfCostAllStagesRound) === Number(currentRound) || localPlayer?.halfCostAllStagesCompany === selectedCompany.name)) {
         baseCost = Math.round(baseCost / 2);
      }
      requiredCost = baseCost;
    }
  }

  const playerCash = Number(localPlayer?.cash || 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 font-sans animate-in fade-in duration-300">
      
      {/* Outer Desk Container - Exact Player Mat Aesthetic */}
      <div className="relative w-full max-w-[1400px] h-[95vh] bg-[#501625] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 border-[#2A0D12] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 scale-[0.95] xl:scale-100 origin-center select-none">
        
        {/* Header Action Mode Banner */}
        <div className="bg-[#3D141C] border-b border-[#2A0D12] px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#FFE8D6] font-bold tracking-widest uppercase">Phase 2 Operations</span>
            <span className="text-white/40">•</span>
            <span className="bg-[#FFF2D8] text-[#4A1720] px-3.5 py-0.5 rounded-full font-black text-xs uppercase tracking-wider">
              {actionType === 'launch' ? 'SELECT COMPANY TO LAUNCH' :
               actionType === 'stage_up' ? 'SELECT COMPANY TO STAGE UP' :
               actionType === 'upgrade_workforce' ? 'SELECT COMPANY TO UPGRADE WORKFORCE' :
               'SELECT COMPANY FOR PR SERVICES'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-[#FFE8D6]">
              Your Cash: <span className="font-mono font-black text-white text-sm">${playerCash}K</span>
            </div>
            <div className="text-xs text-[#FFE8D6]">
              Portfolio: <span className="font-mono font-black text-white text-sm">{ownedCompanies.length}/4</span>
            </div>
            {/* Close Button */}
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors bg-black/40 rounded-full p-1.5 cursor-pointer ml-2">
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
              const currentLvl = ownedData ? Math.min(4, Math.max(1, Number(ownedData.teamLevel || ownedData.team) || 1)) : 1;
              const nextLvl = currentLvl + 1;
              if (!isLaunched) {
                isLockedForAction = true;
                lockMessage = "NOT LAUNCHED YET";
              } else if (currentLvl >= 4) {
                isLockedForAction = true;
                lockMessage = "MAX WORKFORCE (LVL 4)";
              } else if (Number(ownedData.workforceUpgradedRound) === Number(currentRound)) {
                isLockedForAction = true;
                lockMessage = "MAX 1 UPGRADE/ROUND";
              } else if (teamTokenPool && (teamTokenPool[nextLvl] ?? teamTokenPool[String(nextLvl)] ?? 0) <= 0) {
                isLockedForAction = true;
                lockMessage = `NO LVL ${nextLvl} TOKENS LEFT`;
              }
            } else {
              isLockedForAction = !isLaunched;
              lockMessage = "NOT LAUNCHED YET";
            }

            return (
              <div 
                key={company.id} 
                onClick={() => !isLockedForAction && handleCompanyClick(company)}
                className={`bg-[#7D3C4A] rounded-xl pt-2.5 px-3.5 pb-3 border border-[#3A141A] flex flex-col justify-between relative shadow-lg min-h-[315px] transition-all duration-200 ${
                  isLockedForAction 
                    ? 'cursor-not-allowed opacity-75' 
                    : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#FFF2D8]/60'
                }`}
              >
                {/* Card Header (Cream Pill) - EXACT Player Mat styling */}
                <div className="bg-[#FFF2D8] w-[95%] mx-auto rounded-full py-1.5 px-2.5 flex items-center gap-2.5 shadow-md border-2 border-[#3A141A] -mt-5 mb-2.5 relative z-10 shrink-0">
                  <img 
                    src={company.icon} 
                    alt={company.name} 
                    className="w-8 h-8 rounded-full object-contain select-none shrink-0" 
                  />
                  <h3 className="font-black text-xs md:text-sm text-[#4A1720] uppercase tracking-wide leading-none flex-1 text-center pr-3 select-none">
                    {company.name}
                  </h3>
                </div>

                {/* Status Badges */}
                {isLaunched && (
                  <div className="absolute top-2.5 right-3 flex items-center gap-1.5 z-10">
                    <span className="bg-[#FFF2D8] text-[#4A1720] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#4A1720]/40 shadow-sm">
                      Stage {stages[currentStageIdx] || 'L'}
                    </span>
                    <span className="bg-[#55ffb0] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-black/20 shadow-sm">
                      Team Lvl {ownedData ? Math.min(4, Math.max(1, Number(ownedData.teamLevel || ownedData.team) || 1)) : 1}
                    </span>
                  </div>
                )}

                {isLockedForAction && (
                  <div className="absolute inset-0 top-6 z-20 flex flex-col items-center justify-center bg-[#501625]/85 backdrop-blur-[1px] rounded-b-xl pointer-events-none p-4 text-center">
                    <Lock size={28} className="text-[#FFE8D6]/80 mb-2 drop-shadow-md" />
                    <span className="bg-[#3D141C] text-[#FFE8D6] border border-white/20 px-3 py-1 rounded-full font-black text-[10px] tracking-widest uppercase shadow-md">
                      {lockMessage}
                    </span>
                  </div>
                )}
                
                {/* Data Table - EXACT Player Mat Colors & Typography (100% full opacity, crisp white & cream) */}
                <div className="w-full flex-1 flex flex-col justify-center">
                  {/* Column Headers */}
                  <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 text-[10px] text-[#FFE8D6] uppercase font-black mb-2 pb-1 border-b border-white/20 text-center items-end leading-tight">
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
                      const teamLevel = isLaunched ? Math.min(4, Math.max(1, Number(ownedData?.teamLevel || ownedData?.team) || 1)) : 0;

                      return (
                        <div 
                          key={idx} 
                          className={`grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-[12px] text-center font-bold px-1 py-1 ${
                            isActiveStage 
                              ? 'bg-[#FFF2D8]/15 rounded'
                              : 'text-white'
                          }`}
                        >
                          {/* Team Checkbox Slot - Displays current team level on active stage row only */}
                          <div className="flex justify-center">
                            {isActiveStage && isLaunched ? (
                              <div className="w-5 h-5 rounded-sm bg-[#55ffb0] border-2 border-[#55ffb0] text-black font-black text-[10px] flex items-center justify-center shadow-[0_0_8px_rgba(85,255,176,0.6)]">
                                {teamLevel}
                              </div>
                            ) : isPastStage ? (
                              <div className="w-5 h-5 rounded-sm bg-white/20 border border-white/40 text-[#FFE8D6] font-bold text-[10px] flex items-center justify-center">
                                ✓
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-transparent border-2 border-white/40 rounded-sm"></div>
                            )}
                          </div>

                          {/* Stage Name */}
                          <div className="text-left font-bold text-[12px] text-[#FFE8D6] tracking-wide">
                            {stage}
                          </div>

                          {/* Financial Values (Crisp, High-Contrast White Font) */}
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{rowData[0]}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{rowData[1]}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{rowData[2]}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{rowData[3]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Trigger Button on the card if actionable */}
                {!isLockedForAction && (
                  <div className="mt-2.5 flex justify-center">
                    {actionType === 'launch' && !isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="bg-[#FFF2D8] text-[#4A1720] px-5 py-2 rounded-full border-2 border-[#4A1720] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-[#EAE4D3] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Rocket size={14} />
                        <span>LAUNCH (${company.data[0][0]}K)</span>
                      </button>
                    )}
                    {actionType === 'stage_up' && isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="bg-[#FFF2D8] text-[#4A1720] px-4 py-1.5 rounded-full border-2 border-[#4A1720] font-black uppercase tracking-widest text-[11px] shadow-md hover:bg-[#EAE4D3] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <TrendingUp size={13} />
                        <span>STAGE UP (${company.data[Math.min(currentStageIdx + 1, 3)][0]}K)</span>
                      </button>
                    )}
                    {actionType === 'upgrade_workforce' && isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="bg-[#FFF2D8] text-[#4A1720] px-4 py-1.5 rounded-full border-2 border-[#4A1720] font-black uppercase tracking-widest text-[11px] shadow-md hover:bg-[#EAE4D3] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Award size={13} />
                        <span>UPGRADE WORKFORCE</span>
                      </button>
                    )}
                    {actionType === 'buy_pr' && isLaunched && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompanyClick(company);
                        }}
                        className="bg-[#FFF2D8] text-[#4A1720] px-4 py-1.5 rounded-full border-2 border-[#4A1720] font-black uppercase tracking-widest text-[11px] shadow-md hover:bg-[#EAE4D3] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <DollarSign size={13} />
                        <span>BUY PR SERVICES</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Equity Slider Ruler - EXACT Player Mat styling */}
                <div className="mt-2.5 pt-2 border-t border-white/15 flex items-end gap-2 px-1 shrink-0">
                  <div className="text-[8px] text-[#FFE8D6] uppercase font-bold leading-tight w-8 text-right shrink-0">
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6" onClick={() => { setSelectedCompany(null); setCinematicStep(0); }}>
            <div className="bg-[#501625] border-4 border-[#2A0D12] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Close Button */}
              <button onClick={() => { setSelectedCompany(null); setCinematicStep(0); }} className="absolute top-4 right-4 text-[#FFE8D6]/60 hover:text-white transition-colors z-50 bg-black/40 rounded-full p-2 cursor-pointer">
                 <X size={22} />
              </button>

              {/* SCREEN 2: Cinematic Step for Stage Up */}
              {cinematicStep === 1 && (
                <div className="flex-1 p-8 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                   {(() => {
                     const owned = findOwnedCompany(selectedCompany.name);
                     const currentStage = owned?.stage;
                     const currentStageIdx = currentStage !== undefined ? getStageIndex(currentStage) : 0;
                     return (
                       <>
                         <h2 className="text-[#FFE8D6] font-black text-2xl md:text-3xl uppercase tracking-widest mb-6">Current Stage</h2>
                         <div className="text-[#FFF2D8] text-5xl md:text-6xl font-black uppercase mb-6 drop-shadow-md">
                            {stages[currentStageIdx]}
                         </div>
                         <div className="bg-[#3D141C] p-6 rounded-xl border border-white/20 text-center">
                           <p className="text-[#FFE8D6]/70 text-xs font-bold uppercase tracking-widest mb-1">Projected Revenue</p>
                           <p className="text-3xl text-white font-mono font-black">${selectedCompany.data[currentStageIdx][1]}K</p>
                         </div>
                       </>
                     );
                   })()}
                </div>
              )}

              {/* SCREEN 3: Confirmation / Payment UI in Player Mat Theme */}
              {cinematicStep === 2 && (
                <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center relative animate-in fade-in duration-300 text-center">
                  
                  {/* Company Pill Header */}
                  <div className="bg-[#FFF2D8] rounded-full py-2 px-5 flex items-center gap-3 shadow-md border-2 border-[#3A141A] mb-4">
                    <img src={selectedCompany.icon} alt={selectedCompany.name} className="w-8 h-8 rounded-full object-contain shrink-0" />
                    <h3 className="font-black text-sm md:text-base text-[#4A1720] uppercase tracking-wide">
                      {selectedCompany.name}
                    </h3>
                  </div>

                  <p className="text-[#FFE8D6] font-black tracking-widest text-xs md:text-sm uppercase mb-6">
                    {actionType === 'launch' ? 'CONFIRM COMPANY LAUNCH' : 
                     actionType === 'stage_up' ? 'CONFIRM STAGE UPGRADE' : 
                     actionType === 'upgrade_workforce' ? 'CONFIRM WORKFORCE UPGRADE' : 
                     'CONFIRM PR SERVICES'}
                  </p>

                  {/* Cost Display in Player Mat Style */}
                  <div className="bg-[#3D141C] border border-[#2A0D12] rounded-xl p-4 w-full max-w-xs mb-6 flex flex-col items-center shadow-inner">
                    <span className="text-[#FFE8D6]/70 text-[10px] font-bold uppercase tracking-wider mb-1">Total Required Cost</span>
                    <span className="text-3xl font-mono font-black text-white">${requiredCost}K</span>
                    <div className="w-full flex justify-between text-[11px] text-[#FFE8D6] mt-3 pt-2 border-t border-white/10">
                      <span>Your Cash: ${playerCash}K</span>
                      <span className={playerCash >= requiredCost ? 'text-[#55ffb0]' : 'text-red-400'}>
                        {playerCash >= requiredCost ? `Remaining: $${playerCash - requiredCost}K` : `Shortfall: -$${requiredCost - playerCash}K`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Button: Cream Pill Button with Maroon Text */}
                  {playerCash >= requiredCost ? (
                    <button 
                      onClick={() => onPaymentComplete(selectedCompany.name, requiredCost)}
                      className="w-full max-w-xs bg-[#FFF2D8] text-[#4A1720] font-black text-sm md:text-base py-3.5 px-6 rounded-full shadow-xl hover:bg-[#EAE4D3] hover:scale-105 active:scale-95 transition-all tracking-wider uppercase border-2 border-[#4A1720] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Rocket size={16} />
                      <span>CONFIRM PAYMENT (${requiredCost}K)</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full max-w-xs bg-[#2A0D12] text-white/30 font-black text-xs py-3.5 px-6 rounded-full border border-white/10 tracking-wider uppercase cursor-not-allowed"
                    >
                      INSUFFICIENT CASH (${requiredCost}K REQUIRED)
                    </button>
                  )}

                  <button 
                    onClick={() => { setSelectedCompany(null); setCinematicStep(0); }}
                    className="text-[#FFE8D6]/60 hover:text-white uppercase font-bold text-xs mt-3 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Right Side: Multiplier Table (for stage_up and upgrade_workforce on Screen 3) */}
              {(actionType === 'stage_up' || actionType === 'upgrade_workforce') && cinematicStep === 2 && (
                <div className="flex-1 bg-[#3D141C] border-t md:border-t-0 md:border-l border-[#2A0D12] p-6 flex flex-col">
                  <div className="mb-4">
                    <h4 className="text-[#FFF2D8] font-black text-xl uppercase tracking-wider mb-1">
                      Multiplier Table
                    </h4>
                    <p className="text-[#FFE8D6]/70 text-[10px] uppercase tracking-widest font-bold">
                      Actual Revenue = Projected Revenue x Multiplier
                    </p>
                  </div>
                  
                  <div className="flex-1 w-full bg-[#501625] rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-inner">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] bg-[#3D141C] border-b border-white/20 text-[#FFE8D6] text-[10px] uppercase font-black py-2.5 px-2 text-center items-center">
                      <div className="text-left pl-2">Dice Roll</div>
                      <div>Team 1</div>
                      <div>Team 2</div>
                      <div>Team 3</div>
                      <div>Team 4</div>
                    </div>
                    {/* Table Body (10 rows for D10 rolls 1-10) */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
                      {[
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
                      ].map((item) => (
                        <div key={item.roll} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] border-b border-white/5 text-white text-xs font-mono py-1.5 px-2 text-center hover:bg-white/5 transition-colors">
                          <div className="font-black text-[#FFE8D6] text-left pl-3">{item.roll}</div>
                          {item.multipliers.map((m, mIdx) => (
                            <div key={mIdx} className={m < 0 ? 'text-red-400 font-bold' : m === 0 ? 'text-gray-400' : 'text-[#55ffb0] font-bold'}>
                              {m > 0 ? `+${m}` : m}
                            </div>
                          ))}
                        </div>
                      ))}
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
