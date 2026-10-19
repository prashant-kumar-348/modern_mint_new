import React, { useState, useEffect, useRef } from 'react';
import { X, Dices, RotateCcw, CheckCircle } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import D10 from '../3d/D10';
import MentorInventoryModal from './MentorInventoryModal';

const multiplierTable = {
  1:  [-2, -2, -1,  0],
  2:  [-2, -1,  0,  1],
  3:  [-1, -1,  0,  1],
  4:  [-1,  0,  1,  2],
  5:  [ 0,  0,  1,  2],
  6:  [ 0,  1,  2,  3],
  7:  [ 1,  1,  2,  3],
  8:  [ 1,  2,  3,  4],
  9:  [ 2,  2,  3,  4],
  10: [ 2,  3,  4,  5]
};

const companyDataMap = {
  'CONTRACT FARMING': [[10,100,500,0], [100,200,1000,20], [1000,1000,2500,200], [2000,2000,10000,400]],
  'AGRI IoT': [[100,10,1000,0], [500,300,3000,300], [1500,1500,6000,2000], [8000,8000,36000,7000]],
  'WALLET': [[50,10,1000,0], [1200,400,3000,400], [1500,2000,8000,1800], [7000,10000,36000,5000]],
  'SNACKS': [[10,20,1000,0], [300,200,1500,200], [1000,1100,7500,1500], [6000,4000,32000,8000]],
  'QUICK COMMERCE': [[10,30,100,0], [200,400,2500,100], [2000,1200,10000,800], [10000,4000,50000,6000]],
  'SMART STORAGE': [[200,200,2000,200], [3000,1600,5000,2000], [3000,5400,9000,4000], [10000,7500,40000,12000]],
  'RESTRO - CHAIN': [[150, 300, 1000, 200], [300, 400, 2000, 500], [1200, 1400, 4000, 2000], [12000, 8000, 26000, 15000]],
  'TRACEABILITY': [[30,30,300,0], [300,200,2000,200], [1200,2000,7500,1000], [10000,8000,38000,5000]],
  'ROBO - PACKAGING': [[100,150,1500,200], [1200,500,4000,1000], [5000,2500,15000,2000], [4000,9000,45000,8000]]
};

const getCompanyData = (name) => {
  if (!name) return [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
  const upper = name.toUpperCase().trim();
  const foundKey = Object.keys(companyDataMap).find(k => k.toUpperCase().trim() === upper);
  return foundKey ? companyDataMap[foundKey] : [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
};

// Physics Boundaries
function Borders() {
  usePlane(() => ({ type: "Static", material: { restitution: 0.5 }, rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] })); // Floor
  usePlane(() => ({ type: "Static", material: { restitution: 0.5 }, rotation: [Math.PI / 2, 0, 0], position: [0, 10, 0] })); // Ceiling
  usePlane(() => ({ type: "Static", material: { restitution: 0.5 }, rotation: [0, Math.PI / 2, 0], position: [-4, 0, 0] })); // Left Wall
  usePlane(() => ({ type: "Static", material: { restitution: 0.5 }, rotation: [0, -Math.PI / 2, 0], position: [4, 0, 0] })); // Right Wall
  usePlane(() => ({ type: "Static", material: { restitution: 0.5 }, rotation: [0, 0, 0], position: [0, 0, -4] })); // Back Wall
  usePlane(() => ({ type: "Static", material: { restitution: 0.5 }, rotation: [0, Math.PI, 0], position: [0, 0, 4] })); // Front Wall
  return null;
}

const getCompanyMatIcon = (name) => {
  if (!name) return '/mat-icons/mat-icon-quick-commerce.png';
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.includes("FARM") || clean.includes("CONTRACT")) return '/mat-icons/mat-icon-contract-farming.png';
  if (clean.includes("IOT") || clean.includes("AGRI")) return '/mat-icons/mat-icon-agri-iot.png';
  if (clean.includes("WALLET")) return '/mat-icons/mat-icon-wallet.png';
  if (clean.includes("SNACK")) return '/mat-icons/mat-icon-snacks.png';
  if (clean.includes("COMM") || clean.includes("QUICK")) return '/mat-icons/mat-icon-quick-commerce.png';
  if (clean.includes("STOR")) return '/mat-icons/mat-icon-smart-storage.png';
  if (clean.includes("RESTRO") || clean.includes("CHAIN") || clean.includes("KHANAA") || clean.includes("FOOD")) return '/mat-icons/mat-icon-restro-chain.png';
  if (clean.includes("TRACE")) return '/mat-icons/mat-icon-traceability.png';
  if (clean.includes("ROBO") || clean.includes("PACK")) return '/mat-icons/mat-icon-robo-packaging.png';
  return '/mat-icons/mat-icon-quick-commerce.png';
};

export default function Phase3DiceModal({ onClose, player, sendAction, gameState, roomId }) {
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(player?.currentPhase3Roll || null);
  const [bestRoll, setBestRoll] = useState(player?.currentPhase3Roll || null);
  const [serverRoll, setServerRoll] = useState(player?.currentPhase3Roll || null);
  const [showTable, setShowTable] = useState(!!player?.currentPhase3Roll);
  const [hasRolled, setHasRolled] = useState(!!player?.currentPhase3Roll);
  const [localLifelines, setLocalLifelines] = useState(player?.lifelines || 2);
  const [showInventory, setShowInventory] = useState(false);
  const pendingSecondChanceRef = useRef(null);
  
  const diceRef = useRef();
  const rollTimeoutRef = useRef(null);

  const prevRollRef = useRef(player?.currentPhase3Roll);

  useEffect(() => {
    // If server explicitly wiped the roll (e.g. moving to next round / phase reset)
    if (prevRollRef.current && !player?.currentPhase3Roll) {
      setBestRoll(null);
      setRollResult(null);
      setServerRoll(null);
      setHasRolled(false);
      setShowTable(false);
      setIsRolling(false);
      pendingSecondChanceRef.current = null;
    }
    prevRollRef.current = player?.currentPhase3Roll;
  }, [player?.currentPhase3Roll]);

  useEffect(() => {
    if (player?.lifelines !== undefined) {
      setLocalLifelines(player.lifelines);
    }
  }, [player?.lifelines]);

  const preRollCards = (player?.mentorCards || []).filter(c => 
    c.effectType === 'risk_multiplier' || c.effectType === 'auto_roll_6'
  );

  const postRollCards = (player?.mentorCards || []).filter(c => 
    ['force_dice_6', 'add_multiplier', 'add_multiplier_2', 'double_revenue', 'tech_revenue_boost', 'cash_from_total_loans'].includes(c.effectType)
  );

  const getCalculationBreakdown = () => {
    if (bestRoll === null) return { companies: [], grandTotal: 0 };
    const roll = bestRoll;
    let grandTotal = 0;
    
    const companies = (player?.ownedCompanies || []).map(c => {
      const companyDataRows = getCompanyData(c.name);
      const stageIndex = (c.stage === 'L' || c.stage === 0) ? 0 : (c.stage === 'R' || c.stage === 1) ? 1 : (c.stage === 'G' || c.stage === 2) ? 2 : 3;
      const baseRev = (companyDataRows[stageIndex] || [0, 0, 0, 0])[1];
      
      // Sharing Players Check
      let sharingPlayers = 0;
      (gameState?.players || []).forEach(otherP => {
         const theirComp = otherP.ownedCompanies?.find(tc => tc.name?.toUpperCase().trim() === c.name?.toUpperCase().trim());
         if (theirComp) {
           const otherStageIdx = (theirComp.stage === 'L' || theirComp.stage === 0) ? 0 : (theirComp.stage === 'R' || theirComp.stage === 1) ? 1 : (theirComp.stage === 'G' || theirComp.stage === 2) ? 2 : 3;
           if (otherStageIdx === stageIndex) {
              sharingPlayers += 1;
           }
         }
      });
      
      // PR Services Double Effect
      const hasPR = c.prBoughtRound === gameState?.round;
      const activeProjectedRev = hasPR ? baseRev * 2 : baseRev;
      
      // Divided Rev
      const isQuickMode = gameState?.mode === 'short' || gameState?.mode === 'quick';
      const dividedRev = (!isQuickMode && sharingPlayers > 1) ? Math.floor(activeProjectedRev / sharingPlayers) : activeProjectedRev;
      
      // Multiplier Lookup by company's actual Team Level (1..4)
      const teamLevel = Math.min(4, Math.max(1, Number(c.teamLevel || c.team) || 1));
      const teamIndex = teamLevel - 1;
      let multi = multiplierTable[roll]?.[teamIndex] ?? 1;
      if (player?.mentorMultiplier) {
        multi += player.mentorMultiplier;
      }
      
      // Actual Revenue
      let actualRevenue = dividedRev * multi;
      const hasDoubleRev = c.doubleRevenueRound === gameState?.round;
      const hasTechBoost = c.techBoostRound === gameState?.round;
      let riskMultiEffect = null;

      if (hasDoubleRev) {
        actualRevenue *= 2;
      }
      if (hasTechBoost) {
        actualRevenue += 50;
      }
      if (player?.riskMultiplierActive === gameState?.round) {
        if (roll >= 5) {
          actualRevenue *= 2;
          riskMultiEffect = 'x2';
        } else if (roll <= 2) {
          actualRevenue = Math.floor(actualRevenue / 2);
          riskMultiEffect = '÷2';
        }
      }
      let finalRevenue = actualRevenue;
      
      // Royalty Cuts
      let royaltyPercentage = 0;
      let royaltyCut = 0;
      if (actualRevenue > 0 && gameState?.royaltyAgreements) {
         gameState.royaltyAgreements.forEach(agreement => {
            const isThisFounder = (agreement.founderId === player?.id) ||
              (agreement.proposer === player?.name) ||
              (agreement.partner === player?.name);
            if (!isThisFounder) return;

            const pct = Number(agreement.percentage || agreement.royalty || 0);
            if (pct <= 0) return;

            if (agreement.companyName && agreement.companyName?.toUpperCase().trim() !== c.name?.toUpperCase().trim()) {
              return;
            }

            royaltyPercentage += pct;
            royaltyCut += Math.floor((actualRevenue * pct) / 100);
         });
         finalRevenue = actualRevenue - royaltyCut;
      }
      
      grandTotal += finalRevenue;
      
      return {
        name: c.customName || c.name,
        icon: getCompanyMatIcon(c.name),
        stageName: ["Launch", "Retain", "Grow", "Scale"][stageIndex],
        baseRev,
        hasPR,
        hasDoubleRev,
        hasTechBoost,
        riskMultiEffect,
        sharingPlayers,
        dividedRev,
        multi,
        actualRevenue,
        royaltyPercentage,
        royaltyCut,
        finalRevenue
      };
    });
    
    return { companies, grandTotal };
  };

  const { companies: breakdownCompanies, grandTotal } = getCalculationBreakdown();

  useEffect(() => {
    const handleInitialResult = (e) => {
      const { roll, playerId } = e.detail || {};
      if (playerId && player?.id && playerId !== player.id) return;
      setServerRoll(roll);
      pendingSecondChanceRef.current = null;
      setIsRolling(true);
      setShowTable(false);
      setRollResult(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dice_roll_start'));
      }
    };
    const handleSecondChanceResult = (e) => {
      const { roll, remainingLifelines, playerId, wasKept, newRollTested, previousRoll } = e.detail || {};
      if (playerId && player?.id && playerId !== player.id) return;
      setLocalLifelines(remainingLifelines);
      const rerollNumber = newRollTested || roll;
      setServerRoll(rerollNumber);
      pendingSecondChanceRef.current = {
        newRoll: rerollNumber,
        keptRoll: roll,
        wasKept: !!wasKept,
        previousRoll: previousRoll || roll
      };
      setIsRolling(true);
      setShowTable(false);
      setRollResult(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dice_roll_start'));
      }
    };
    window.addEventListener('initial_roll_result', handleInitialResult);
    window.addEventListener('second_chance_result', handleSecondChanceResult);
    return () => {
      window.removeEventListener('initial_roll_result', handleInitialResult);
      window.removeEventListener('second_chance_result', handleSecondChanceResult);
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dice_roll_end'));
      }
    };
  }, [player?.id]);

  useEffect(() => {
    if (isRolling && serverRoll !== null) {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = setTimeout(() => {
        handleDiceRest(serverRoll);
      }, 3500);
    }
    return () => {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, [isRolling, serverRoll]);

  // Block Investors entirely
  if (player?.role === 'Investor') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-[#0a1914] border-2 border-[#1c4d3d] rounded-2xl p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#1c4d3d]/50 rounded-full flex items-center justify-center animate-pulse mb-6">
             <Dices size={40} className="text-[#55ffb0]" />
          </div>
          <h2 className="text-white text-3xl font-black uppercase tracking-widest mb-2 text-center">Waiting For Founders</h2>
          <p className="text-white/60 text-center max-w-md">Investors do not participate in the Phase 3 Revenue Roll. Wait for the Founders to lock in their multipliers.</p>
        </div>
      </div>
    );
  }

  // If already claimed, don't allow rolling again
  if (player?.hasClaimedRevenue) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-[#0a1914] border-2 border-[#1c4d3d] rounded-2xl p-12 flex flex-col items-center">
          <CheckCircle size={64} className="text-[#55ffb0] mb-6 drop-shadow-[0_0_20px_rgba(85,255,176,0.6)]" />
          <h2 className="text-white text-3xl font-black uppercase tracking-widest mb-2">Revenue Claimed</h2>
          <p className="text-white/60">You have already completed the Revenue Roll for this round.</p>
          <button onClick={onClose} className="mt-8 px-8 py-3 bg-[#1c4d3d] text-white rounded-xl hover:bg-[#256651] transition-colors font-bold uppercase tracking-wider">Close</button>
        </div>
      </div>
    );
  }

  const handleInitialRoll = () => {
    if (hasRolled || isRolling) return;
    setHasRolled(true);
    setIsRolling(true);
    setShowTable(false);
    setRollResult(null);
    setBestRoll(null);
    setServerRoll(null);
    pendingSecondChanceRef.current = null;
    sendAction('initial_roll');
  };

  const handleDiceRest = (restedNumber) => {
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    const finalVal = serverRoll || restedNumber || player?.currentPhase3Roll;
    if (finalVal) {
      // Delay strictly 1000ms so the dice is completely rolled and resting before showing the result
      setTimeout(() => {
         setRollResult(finalVal);
         if (pendingSecondChanceRef.current) {
           const sc = pendingSecondChanceRef.current;
           setBestRoll(sc.keptRoll);
           pendingSecondChanceRef.current = null;
         } else {
           setBestRoll(finalVal);
         }
         setIsRolling(false);
         setShowTable(true);
         if (typeof window !== 'undefined') {
           window.dispatchEvent(new CustomEvent('dice_roll_end'));
         }
      }, 1000);
    }
  };

  const handleSecondChance = () => {
    if (localLifelines <= 0 || isRolling || (player?.lifelines !== undefined && player.lifelines <= 0)) return;
    setIsRolling(true);
    setShowTable(false);
    setRollResult(null);
    setServerRoll(null);
    sendAction('second_chance_roll');
  };

  const handleClaim = () => {
    if (bestRoll === null) return;
    sendAction('claim_revenue');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 font-sans overflow-hidden animate-in fade-in duration-300">
      
      {/* 3D Canvas Background */}
      <div className={`absolute inset-y-0 left-0 z-0 pointer-events-none transition-all duration-700 ease-in-out ${showTable ? 'w-full lg:w-[28%] lg:max-w-[420px]' : 'w-full'} ${!isRolling && rollResult !== null ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
         <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 10, 0]} rotation={[-Math.PI / 2, 0, 0]} fov={50} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[0, 10, 0]} intensity={1.5} castShadow />
            <Environment preset="city" />
            <Physics 
               gravity={[0, -40, 0]} 
               defaultContactMaterial={{ friction: 0.2, restitution: 0.7, contactEquationStiffness: 1e7, contactEquationRelaxation: 4 }}
            >
               <Borders />
               {(hasRolled || isRolling) && <D10 ref={diceRef} onRest={handleDiceRest} isRolling={isRolling} serverRoll={serverRoll} />}
            </Physics>
         </Canvas>
      </div>
      
      {/* Dynamic Background FX based on state */}
      {isRolling && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FFC240]/5 to-transparent animate-[spin_2s_linear_infinite] opacity-50 z-0"></div>}
      
      {/* Header */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50">
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-1 text-center">
          The Revenue Roll
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-[#FFC240] font-bold tracking-widest uppercase text-xs drop-shadow-md">Phase 3</p>
          {(player?.mentorCards || []).length > 0 && (
            <button
              onClick={() => setShowInventory(true)}
              className="pointer-events-auto bg-[#2A0D12] border border-[#FFC240]/60 hover:border-[#FFC240] text-[#FFC240] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              🃏 Mentor Cards ({(player?.mentorCards || []).length})
            </button>
          )}
        </div>
      </div>

      {/* Close button */}
      <button 
        onClick={onClose} 
        className="pointer-events-auto absolute top-6 right-6 p-2.5 rounded-full bg-black/60 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 z-50 cursor-pointer drop-shadow-md"
        title="Close"
      >
        <X size={24} />
      </button>

      {/* Center Cinematic Container */}
      <div className="relative w-full max-w-[1350px] h-full flex flex-col items-center justify-center mt-12 z-10 pointer-events-none">
        
        {!hasRolled && !isRolling ? (
          <div className="flex flex-col items-center gap-6 z-10 pointer-events-auto">
            {/* Bold moves active indicator */}
            {player?.riskMultiplierActive === gameState?.round && (
              <div className="bg-[#FFC240]/20 border border-[#FFC240] text-[#FFC240] px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(255,194,64,0.4)] animate-pulse flex items-center gap-2">
                <span>⚡ BOLD MOVES ACTIVE: x2 on roll 5+, ÷2 on roll 1–2</span>
              </div>
            )}
            
            <button 
              onClick={handleInitialRoll}
              className="group relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#FFC240] to-[#F59E0B] shadow-[0_0_80px_rgba(255,194,64,0.4)] flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <div className="absolute inset-2 rounded-full border-4 border-dashed border-[#2A0D12]/30 group-hover:rotate-180 transition-transform duration-1000 ease-in-out"></div>
              <Dices size={80} className="text-[#2A0D12] mb-4 drop-shadow-md" />
              <span className="text-[#2A0D12] font-black uppercase tracking-widest text-xl">Roll Dice</span>
            </button>

            {/* Playable Pre-Roll Mentor Cards */}
            {preRollCards.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2 max-w-lg">
                {preRollCards.map(card => {
                  if (card.effectType === 'risk_multiplier' && player?.riskMultiplierActive === gameState?.round) return null;
                  return (
                    <button
                      key={card.id}
                      onClick={() => {
                        if (card.effectType === 'auto_roll_6') {
                          setIsRolling(true);
                          setHasRolled(true);
                          setShowTable(false);
                          setRollResult(null);
                        }
                        sendAction('play_mentor_card', { cardId: card.id });
                      }}
                      className="bg-[#2A0D12] hover:bg-[#3d141b] text-[#FFC240] border border-[#FFC240]/60 hover:border-[#FFC240] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span>{card.effectType === 'auto_roll_6' ? '🎯 Play Sure Shot (Lock Roll to 6)' : '⚡ Play Bold Moves (Double or Halve)'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row items-stretch justify-center gap-8 w-full px-4">
            {/* Left side info panel / best roll indicator */}
            {!isRolling && rollResult !== null && (
                <div className="text-center animate-in slide-in-from-bottom-4 fade-in z-20 flex flex-col items-center justify-center">
                  <p className="text-white/60 text-sm uppercase tracking-widest mb-4">Current Best Roll</p>
                  <div className="flex items-center justify-center hover:scale-105 transition-transform duration-300">
                    <svg width="300" height="300" viewBox="0 0 200 200" className="drop-shadow-[0_15px_35px_rgba(13,148,136,0.5)]">
                      {/* Left Flank */}
                      <polygon points="100,20 25,95 60,130" fill="#0f766e" />
                      {/* Right Flank */}
                      <polygon points="100,20 175,95 140,130" fill="#0f766e" />
                      {/* Left Bottom Facet */}
                      <polygon points="25,95 100,180 60,130" fill="#115e59" />
                      {/* Right Bottom Facet */}
                      <polygon points="175,95 100,180 140,130" fill="#115e59" />
                      {/* Bottom Center Facet */}
                      <polygon points="60,130 140,130 100,180" fill="#115e59" />
                      {/* Central Triangle (Face showing the number) */}
                      <polygon points="100,20 60,130 140,130" fill="#0d9488" />
                      
                      {/* Number in the center */}
                      <text 
                        x="100" 
                        y="106" 
                        textAnchor="middle" 
                        fill="#ffffff" 
                        fontSize="46" 
                        fontWeight="900" 
                        fontFamily="sans-serif"
                      >
                        {bestRoll}
                      </text>
                    </svg>
                  </div>
                </div>
            )}

            {/* The Multiplier Table & Actions */}
            {showTable && (
              <>
                <div className="pointer-events-auto flex-grow w-full max-w-2xl bg-[#0a1914]/90 backdrop-blur-md rounded-3xl border-2 border-[#1c4d3d] p-6 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.9)] animate-in slide-in-from-right-12 fade-in duration-700 relative z-20 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[#55ffb0] font-black uppercase tracking-widest text-xl mb-4 text-center drop-shadow-md">
                      Multiplier Matrix
                    </h3>
                    
                    {player?.mentorMultiplier > 0 && (
                      <div className="bg-[#55ffb0]/20 border border-[#55ffb0] text-[#55ffb0] px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider mb-3 text-center shadow-[0_0_15px_rgba(85,255,176,0.3)]">
                        ⭐ MENTOR MULTIPLIER ACTIVE: +{player.mentorMultiplier} TO ALL MULTIPLIERS!
                      </div>
                    )}
                    {player?.riskMultiplierActive === gameState?.round && (
                      <div className="bg-[#FFC240]/20 border border-[#FFC240] text-[#FFC240] px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider mb-3 text-center shadow-[0_0_15px_rgba(255,194,64,0.3)]">
                        ⚡ BOLD MOVES ACTIVE: Doubled on 5+, Halved on 1–2
                      </div>
                    )}
                    
                    {/* Table Header */}
                    <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] bg-[#1c4d3d]/50 rounded-t-xl text-[#a4d8c2] text-xs font-bold uppercase tracking-widest py-3 px-2 text-center mb-1 border-b border-[#55ffb0]/20">
                      <div>Roll</div>
                      <div>Team 1</div>
                      <div>Team 2</div>
                      <div>Team 3</div>
                      <div>Team 4</div>
                    </div>
                    
                    {/* Table Body */}
                    <div className="flex flex-col gap-1 mb-6">
                      {[1,2,3,4,5,6,7,8,9,10].map((num) => {
                        const rowData = multiplierTable[num];
                        const isMatched = bestRoll === num;
                        return (
                          <div key={num} className={`grid grid-cols-[60px_1fr_1fr_1fr_1fr] text-sm font-mono py-2 px-2 text-center rounded-lg transition-all duration-300 ${isMatched ? 'bg-gradient-to-r from-[#55ffb0]/20 via-[#55ffb0]/40 to-[#55ffb0]/20 border border-[#55ffb0] shadow-[0_0_20px_rgba(85,255,176,0.3)] scale-105 z-10' : 'text-white/70 hover:bg-white/5 border border-transparent'}`}>
                            <div className={`font-black ${isMatched ? 'text-white text-base' : 'text-[#a4d8c2]'}`}>{num}</div>
                            {rowData.map((val, idx) => {
                              const effectiveVal = isMatched && player?.mentorMultiplier ? val + player.mentorMultiplier : val;
                              return (
                                <div key={idx} className={`font-bold ${isMatched ? (effectiveVal < 0 ? 'text-[#ff5555]' : 'text-[#55ffb0]') : (val < 0 ? 'text-[#ff5555]/70' : 'text-white/80')}`}>
                                  {effectiveVal > 0 ? `+${effectiveVal}` : effectiveVal}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Playable Post-Roll Mentor Cards */}
                  {postRollCards.length > 0 && (
                    <div className="flex flex-col gap-2 w-full mb-4 bg-black/40 border border-[#1c4d3d] rounded-2xl p-3">
                      <div className="text-[10px] text-[#a4d8c2] font-black uppercase tracking-widest text-center">
                        Playable Mentor Cards
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {postRollCards.map(card => {
                          if (card.effectType === 'force_dice_6') {
                            if (bestRoll >= 6) return null;
                            return (
                              <button
                                key={card.id}
                                onClick={() => sendAction('play_mentor_card', { cardId: card.id })}
                                className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white border border-[#55ffb0]/50 hover:border-[#55ffb0] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                              >
                                🎲 Strategic Mentor (Roll {bestRoll} ➜ 6)
                              </button>
                            );
                          }
                          if (card.effectType === 'add_multiplier' || card.effectType === 'add_multiplier_2') {
                            const boost = card.effectType === 'add_multiplier_2' ? 2 : 1;
                            return (
                              <button
                                key={card.id}
                                onClick={() => sendAction('play_mentor_card', { cardId: card.id })}
                                className="bg-gradient-to-r from-[#b45309] to-[#d97706] text-white border border-[#FFC240]/50 hover:border-[#FFC240] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                              >
                                ⭐ {card.name} (+{boost} Multi)
                              </button>
                            );
                          }
                          if (card.effectType === 'double_revenue') {
                            const firstCompName = player?.ownedCompanies?.[0]?.name;
                            return (
                              <button
                                key={card.id}
                                onClick={() => sendAction('play_mentor_card', { cardId: card.id, companyName: firstCompName })}
                                className="bg-gradient-to-r from-[#ca8a04] to-[#eab308] text-black border border-white/50 hover:border-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                              >
                                🪙 Golden Touch (Double {firstCompName || 'Rev'})
                              </button>
                            );
                          }
                          if (card.effectType === 'tech_revenue_boost') {
                            const techComp = player?.ownedCompanies?.find((c) => ['WALLET','AGRI IoT','TRACEABILITY','ROBO - PACKAGING','SMART STORAGE','QUICK COMMERCE'].includes(c.name.toUpperCase())) || player?.ownedCompanies?.[0];
                            return (
                              <button
                                key={card.id}
                                onClick={() => sendAction('play_mentor_card', { cardId: card.id, companyName: techComp?.name })}
                                className="bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white border border-white/50 hover:border-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                              >
                                🚀 Tech Mentor (+$50K on {techComp?.name || 'Tech'})
                              </button>
                            );
                          }
                          if (card.effectType === 'cash_from_total_loans') {
                            return (
                              <button
                                key={card.id}
                                onClick={() => sendAction('play_mentor_card', { cardId: card.id })}
                                className="bg-gradient-to-r from-[#15803d] to-[#16a34a] text-white border border-white/50 hover:border-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
                              >
                                🏦 Bank Backed Boost (20% Loans)
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full mt-2">
                    
                    <button 
                      onClick={handleSecondChance}
                      disabled={localLifelines <= 0 || isRolling}
                      className={`flex-1 flex flex-col items-center justify-center py-4 px-6 rounded-xl border-2 transition-all group ${localLifelines <= 0 || isRolling ? 'bg-[#2A0D12]/50 border-[#ff5555]/20 text-[#ff5555]/40 cursor-not-allowed grayscale' : 'bg-[#2A0D12] border-[#ff5555] text-[#ff5555] hover:bg-[#ff5555] hover:text-white shadow-[0_0_20px_rgba(255,85,85,0.2)] hover:shadow-[0_0_40px_rgba(255,85,85,0.6)]'}`}
                    >
                      <div className="flex items-center gap-2 font-black uppercase tracking-widest text-lg mb-1">
                        <RotateCcw size={20} className={localLifelines > 0 && !isRolling ? "group-hover:-rotate-180 transition-transform duration-500" : ""} />
                        Second Chance
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                        {localLifelines} Remaining
                      </span>
                    </button>

                    <button 
                      onClick={handleClaim}
                      disabled={isRolling}
                      className="flex-1 flex flex-col items-center justify-center py-4 px-6 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#166534] border-2 border-[#55ffb0] text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(85,255,176,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2 font-black uppercase tracking-widest text-lg mb-1">
                        <CheckCircle size={20} />
                        Click to Claim
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80 text-white/80">
                        Lock in Multiplier
                      </span>
                    </button>

                  </div>

                </div>

                {/* Right Side: Launched Companies & Team Sizes */}
                <div className="pointer-events-auto w-full xl:w-[460px] bg-[#0a1914]/90 backdrop-blur-md rounded-3xl border-2 border-[#1c4d3d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.9)] animate-in slide-in-from-right-12 fade-in duration-700 relative z-20 flex flex-col">
                  <h3 className="text-[#55ffb0] font-black uppercase tracking-widest text-lg mb-6 text-center drop-shadow-md border-b border-[#1c4d3d] pb-3">
                    Launched Companies
                  </h3>
                  <div className="flex flex-col gap-6 overflow-y-auto max-h-[480px] pr-1 scrollbar-thin scrollbar-thumb-[#1c4d3d]">
                    {(!player?.ownedCompanies || player.ownedCompanies.length === 0) ? (
                      <div className="text-white/40 text-center py-8 italic text-xs">
                        No companies launched yet
                      </div>
                    ) : (
                      player.ownedCompanies.map((c, idx) => {
                        const stages = ["Launch", "Retain", "Grow", "Scale"];
                        
                        const companyDataRows = getCompanyData(c.name);

                        return (
                          <div key={idx} className="bg-[#7D3C4A] rounded-xl p-3 border border-[#3A141A] flex flex-col relative shadow-lg mt-5">
                            
                            {/* Card Header (Cream Pill) */}
                            <div className="bg-[#FFF2D8] w-[95%] mx-auto rounded-full py-2 px-3 flex items-center gap-3 shadow-md border border-[#3A141A]/20 -mt-7 mb-3 relative z-10">
                              <div className="w-8 h-8 rounded-full border border-dashed border-gray-400 bg-white flex items-center justify-center shadow-inner shrink-0 overflow-hidden p-1">
                                <img 
                                  src={getCompanyMatIcon(c.name)} 
                                  alt={c.name} 
                                  className="w-full h-full object-contain" 
                                />
                              </div>
                              <h3 className="font-black text-xs md:text-sm text-[#4A1720] uppercase tracking-tight leading-none flex-1 text-center pr-4">
                                {c.customName || c.name}
                              </h3>
                            </div>

                            {/* Data Table */}
                            <div className="flex-grow w-full pt-2 flex flex-col">
                              {/* Headers */}
                              <div className="grid grid-cols-[28px_1.1fr_1fr_1fr_1fr_1fr] gap-1 text-[8px] text-[#FFD1DA] uppercase font-black mb-2 pb-1 border-b border-white/20 text-center items-end leading-tight">
                                <div className="text-left">TEAM</div>
                                <div className="text-left">STAGE</div>
                                <div>Invest<br/>($K)</div>
                                <div>Projected<br/>Rev ($K)</div>
                                <div>Valuation<br/>($K)</div>
                                <div>Loan<br/>($K)</div>
                              </div>

                              {/* Rows */}
                              <div className="flex-grow flex flex-col justify-around gap-1.5 pb-2">
                                {stages.map((stage, i) => {
                                  const currentStageIdx = (c.stage === 'L' || c.stage === 0) ? 0 : (c.stage === 'R' || c.stage === 1) ? 1 : (c.stage === 'G' || c.stage === 2) ? 2 : 3;
                                  const isActiveStage = i === currentStageIdx;
                                  const teamLevel = c.team || 1;
                                  const isTeamUnlocked = i < teamLevel;
                                  const rowData = companyDataRows[i] || [0,0,0,0];

                                  return (
                                    <div key={i} className={`grid grid-cols-[28px_1.1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-[10px] text-white text-center ${isActiveStage ? 'bg-[#FFC240]/20 rounded border border-[#FFC240]/50 shadow-sm py-1' : 'text-white/90 py-0.5'}`}>
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center text-[9px] font-black transition-all ${
                                          isTeamUnlocked 
                                            ? 'bg-[#55ffb0] border-[#55ffb0] text-black shadow-[0_0_8px_rgba(85,255,176,0.5)]' 
                                            : 'bg-gray-500/50 border-white/10 text-transparent'
                                        }`}>
                                          {i + 1}
                                        </div>
                                      </div>
                                      <div className={`text-left font-bold text-[10px] pl-0.5 ${isActiveStage ? 'text-[#FFC240]' : ''}`}>{stage}</div>
                                      <div className="font-mono font-medium">{rowData[0]}</div>
                                      <div className="font-mono font-medium">{rowData[1]}</div>
                                      <div className="font-mono font-medium">{rowData[2]}</div>
                                      <div className="font-mono font-medium">{rowData[3]}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Calculation and Earnings Summary Box */}
                  {bestRoll !== null && (
                    <div className="mt-4 border-t border-[#1c4d3d] pt-4 flex flex-col gap-2 pointer-events-auto">
                      <h4 className="text-[#FFC240] font-black uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                        <span>ESTIMATED ROUND REVENUE</span>
                        <span className="text-[10px] text-white/50 lowercase font-normal">(based on Roll {bestRoll})</span>
                      </h4>
                      
                      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {breakdownCompanies.map((item, i) => (
                          <div key={i} className="flex flex-col bg-[#112a20]/60 border border-[#1c4d3d] rounded-lg p-2 text-[10px] text-white/80 leading-relaxed font-sans">
                            <div className="flex justify-between items-center mb-1 font-bold text-white">
                              <span className="flex items-center gap-1.5">
                                <img 
                                  src={getCompanyMatIcon(item.name)} 
                                  alt={item.name} 
                                  className="w-4 h-4 object-contain rounded-full bg-white/20 p-0.5 shrink-0" 
                                />
                                <span>{item.name} ({item.stageName})</span>
                              </span>
                              <span className={item.finalRevenue < 0 ? "text-[#ff5555]" : "text-[#55ffb0]"}>
                                {item.finalRevenue >= 0 ? `+$${item.finalRevenue}K` : `-$${Math.abs(item.finalRevenue)}K`}
                              </span>
                            </div>
                            
                            <div className="text-[9px] text-[#a4d8c2] flex flex-wrap gap-x-2 gap-y-0.5 border-t border-[#1c4d3d]/50 pt-1 mt-0.5">
                              <span>Base: ${item.baseRev}K</span>
                              {item.hasPR && <span className="text-[#FFC240]">PR: x2</span>}
                              {item.hasDoubleRev && <span className="text-[#FFC240]">Golden Touch: x2</span>}
                              {item.hasTechBoost && <span className="text-[#00e1ff]">Tech Boost: +$50K</span>}
                              {item.riskMultiEffect && <span className={item.riskMultiEffect === 'x2' ? "text-[#55ffb0]" : "text-[#ff5555]"}>Bold Moves: {item.riskMultiEffect}</span>}
                              {item.sharingPlayers > 1 && <span className="text-[#ff5555]">Shared: /{item.sharingPlayers} (${item.dividedRev}K)</span>}
                              <span>Multi: <span className={item.multi < 0 ? "text-[#ff5555]" : "text-[#55ffb0]"}>{item.multi > 0 ? `+${item.multi}` : item.multi}</span>{player?.mentorMultiplier ? <span className="text-[#55ffb0] text-[8px] font-bold"> (+{player.mentorMultiplier} mentor)</span> : null}</span>
                              {item.royaltyPercentage > 0 && <span className="text-[#d4af37]">Royalty: -${item.royaltyCut}K ({item.royaltyPercentage}%)</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Grand Total Bar */}
                      <div className="mt-2 bg-[#1c4d3d]/40 rounded-xl p-3 border border-[#55ffb0]/25 flex items-center justify-between">
                        <span className="text-white text-xs font-black uppercase tracking-widest">Total Earnings:</span>
                        <span className={`text-xl font-black ${grandTotal < 0 ? "text-[#ff5555] drop-shadow-[0_0_10px_rgba(255,85,85,0.4)]" : "text-[#55ffb0] drop-shadow-[0_0_10px_rgba(85,255,176,0.4)]"}`}>
                          {grandTotal >= 0 ? `+$${grandTotal}K` : `-$${Math.abs(grandTotal)}K`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        
      </div>

      {/* Mentor Inventory Modal Overlay */}
      {showInventory && (
        <MentorInventoryModal
          onClose={() => setShowInventory(false)}
          player={player}
          players={gameState?.players || []}
          onPlayCard={(cardId, targetPlayerId, companyName) => {
            sendAction('play_mentor_card', { cardId, targetPlayerId, companyName });
            setShowInventory(false);
          }}
        />
      )}
    </div>
  );
}
