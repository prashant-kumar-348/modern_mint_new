import React from 'react';
import { X, Rocket, AlertCircle, Lock } from 'lucide-react';

const MAT_ICONS = {
  'CONTRACT FARMING': '/mat-icons/mat-icon-contract-farming.png',
  'AGRI IOT': '/mat-icons/mat-icon-agri-iot.png',
  'AGRI IoT': '/mat-icons/mat-icon-agri-iot.png',
  'WALLET': '/mat-icons/mat-icon-wallet.png',
  'SNACKS': '/mat-icons/mat-icon-snacks.png',
  'QUICK COMMERCE': '/mat-icons/mat-icon-quick-commerce.png',
  'SMART STORAGE': '/mat-icons/mat-icon-smart-storage.png',
  'RESTRO - CHAIN': '/mat-icons/mat-icon-restro-chain.png',
  'RESTRO CHAIN': '/mat-icons/mat-icon-restro-chain.png',
  'RESTRO-CHAIN': '/mat-icons/mat-icon-restro-chain.png',
  'TRACEABILITY': '/mat-icons/mat-icon-traceability.png',
  'ROBO - PACKAGING': '/mat-icons/mat-icon-robo-packaging.png',
  'ROBO PACKAGING': '/mat-icons/mat-icon-robo-packaging.png',
  'ROBO-PACKAGING': '/mat-icons/mat-icon-robo-packaging.png',
};

const COMPANY_STAGE_DATA = {
  'CONTRACT FARMING': [[10,100,500,0], [100,200,1000,20], [1000,1000,2500,200], [2000,2000,10000,400]],
  'AGRI IOT': [[100,10,1000,0], [500,300,3000,300], [1500,1500,6000,2000], [8000,8000,36000,7000]],
  'WALLET': [[50,10,1000,0], [1200,400,3000,400], [1500,2000,8000,1800], [7000,10000,36000,5000]],
  'SNACKS': [[10,20,1000,0], [300,200,1500,200], [1000,1100,7500,1500], [6000,4000,32000,8000]],
  'QUICK COMMERCE': [[10,30,100,0], [200,400,2500,100], [2000,1200,10000,800], [10000,4000,50000,6000]],
  'SMART STORAGE': [[200,200,2000,200], [3000,1600,5000,2000], [3000,5400,9000,4000], [10000,7500,40000,12000]],
  'RESTRO - CHAIN': [[150, 300, 1000, 200], [300, 400, 2000, 500], [1200, 1400, 4000, 2000], [12000, 8000, 26000, 15000]],
  'TRACEABILITY': [[30,30,300,0], [300,200,2000,200], [1200,2000,7500,1000], [10000,8000,38000,5000]],
  'ROBO - PACKAGING': [[100,150,1500,200], [1200,500,4000,1000], [5000,2500,15000,2000], [4000,9000,45000,8000]]
};

function getCanonicalMatKey(name) {
  const clean = (name || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.includes('CONTRACT') || clean.includes('FARMING')) return 'CONTRACT FARMING';
  if (clean.includes('AGRI') || clean.includes('IOT')) return 'AGRI IOT';
  if (clean.includes('WALLET')) return 'WALLET';
  if (clean.includes('SNACK')) return 'SNACKS';
  if (clean.includes('QUICK') || clean.includes('COMMERCE')) return 'QUICK COMMERCE';
  if (clean.includes('STORAGE')) return 'SMART STORAGE';
  if (clean.includes('RESTRO') || clean.includes('CHAIN')) return 'RESTRO - CHAIN';
  if (clean.includes('TRACE')) return 'TRACEABILITY';
  if (clean.includes('ROBO') || clean.includes('PACKAGING')) return 'ROBO - PACKAGING';
  return (name || '').toUpperCase();
}

export default function LaunchCompanyModal({
  company,
  localPlayer,
  gamePhase,
  isTurnLocked,
  onClose,
  onConfirmLaunch
}) {
  if (!company) return null;

  const canonicalKey = getCanonicalMatKey(company.name);
  const companyIcon = MAT_ICONS[canonicalKey] || company.icon || company.image || '/mat-icons/mat-icon-quick-commerce.png';
  const stageData = company.data || COMPANY_STAGE_DATA[canonicalKey] || [[10, 100, 500, 0], [100, 200, 1000, 20], [1000, 1000, 2500, 200], [2000, 2000, 10000, 400]];
  const stages = ["Launch", "Retain", "Grow", "Scale"];

  const isInvestor = localPlayer?.role?.toLowerCase() === 'investor';
  const ownedCount = (localPlayer?.ownedCompanies || []).length;
  const isMaxCompanies = ownedCount >= 4;
  const playerCash = Number(localPlayer?.cash || 0);
  const investCost = Number(stageData[0]?.[0] || company.invest || 10);
  const hasEnoughCash = playerCash >= investCost;
  const isPhase2 = gamePhase === 2;

  // Can the player launch right now?
  let canLaunch = !isInvestor && !isMaxCompanies && hasEnoughCash && isPhase2 && !isTurnLocked;

  // Determination of error/warning message if cannot launch
  let lockReason = "";
  if (isInvestor) {
    lockReason = "Investors cannot launch companies. You invest in founders during Phase 1!";
  } else if (isMaxCompanies) {
    lockReason = "Maximum of 4 company launches allowed per founder.";
  } else if (!isPhase2) {
    lockReason = `Company launching happens during Phase 2 (Operations). Current: Phase ${gamePhase}.`;
  } else if (isTurnLocked) {
    lockReason = "It is not your turn to take actions.";
  } else if (!hasEnoughCash) {
    lockReason = `Insufficient cash ($${investCost}K required, you have $${playerCash}K).`;
  }

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      {/* Outer Mat Desk Container styled like Player Mat */}
      <div 
        className="relative w-full max-w-[460px] bg-[#501625] rounded-2xl border-4 border-[#2A0D12] shadow-[0_0_50px_rgba(0,0,0,0.85)] p-4 sm:p-5 flex flex-col items-center animate-in zoom-in-95 duration-200 select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-[#FFE8D6]/60 hover:text-white bg-black/40 rounded-full p-1.5 transition-colors cursor-pointer z-50"
        >
          <X size={20} />
        </button>

        {/* Company Card matching Player Mat (Exact Burgundy + Cream Pill Design) */}
        <div className="w-full bg-[#7D3C4A] rounded-xl pt-3 px-3.5 pb-3 border border-[#3A141A] flex flex-col justify-between relative shadow-lg mt-3">
          
          {/* Card Header (Cream Pill) */}
          <div className="bg-[#FFF2D8] w-[95%] mx-auto rounded-full py-1.5 px-3 flex items-center gap-2.5 shadow-md border-2 border-[#3A141A] -mt-6 mb-2.5 relative z-10 shrink-0">
            <img 
              src={companyIcon} 
              alt={canonicalKey} 
              className="w-8 h-8 rounded-full object-contain select-none shrink-0" 
            />
            <h3 className="font-black text-xs sm:text-sm text-[#4A1720] uppercase tracking-wide leading-none flex-1 text-center pr-3 select-none">
              {canonicalKey}
            </h3>
          </div>

          {/* Data Table */}
          <div className="w-full flex flex-col justify-center">
            {/* Headers */}
            <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 text-[10px] text-[#FFE8D6] uppercase font-black mb-2 pb-1 border-b border-white/20 text-center items-end leading-tight">
              <div className="text-left pr-1">TEAM</div>
              <div className="text-left">STAGE</div>
              <div>INVEST<br/>($K)</div>
              <div>PROJECTED<br/>REV ($K)</div>
              <div>VALUATION<br/>($K)</div>
              <div>LOAN<br/>($K)</div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-1.5 py-0.5">
              {stages.map((stage, i) => (
                <div 
                  key={i} 
                  className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-[12px] text-center font-bold px-1 py-1 text-white"
                >
                  {/* Team slot */}
                  <div className="flex justify-center">
                    <div className="w-5 h-5 bg-transparent border-2 border-white/40 rounded-sm"></div>
                  </div>

                  {/* Stage Name */}
                  <div className="text-left font-bold text-[12px] text-[#FFE8D6] tracking-wide">
                    {stage}
                  </div>

                  {/* Financial Figures */}
                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">
                    {stageData[i]?.[0] ?? 0}
                  </div>
                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">
                    {stageData[i]?.[1] ?? 0}
                  </div>
                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">
                    {stageData[i]?.[2] ?? 0}
                  </div>
                  <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">
                    {stageData[i]?.[3] ?? 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equity Slider Ruler */}
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

        {/* Cash Balance Strip in Player Mat Theme */}
        <div className="w-full bg-[#3D141C] border border-[#2A0D12] rounded-xl p-3 mt-4 flex items-center justify-between text-xs">
          <div className="flex flex-col text-left">
            <span className="text-[#FFE8D6]/70 font-bold uppercase text-[9px] tracking-wider">Your Cash</span>
            <span className="text-white font-mono font-black text-sm">${playerCash}K</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-[#FFE8D6]/70 font-bold uppercase text-[9px] tracking-wider">Launch Cost</span>
            <span className="text-[#FFF2D8] font-mono font-black text-sm">${investCost}K</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[#FFE8D6]/70 font-bold uppercase text-[9px] tracking-wider">
              {hasEnoughCash ? 'After Launch' : 'Shortfall'}
            </span>
            <span className={`font-mono font-black text-sm ${hasEnoughCash ? 'text-[#55ffb0]' : 'text-red-400'}`}>
              {hasEnoughCash ? `$${playerCash - investCost}K` : `-$${investCost - playerCash}K`}
            </span>
          </div>
        </div>

        {/* Warning Banner if Cannot Launch */}
        {!canLaunch && lockReason && (
          <div className="w-full bg-[#3D141C] border border-amber-400/40 rounded-xl p-2.5 mt-3 flex items-center justify-center gap-2 text-[#FFE8D6] text-xs font-semibold text-center">
            <AlertCircle size={15} className="text-amber-400 shrink-0" />
            <span>{lockReason}</span>
          </div>
        )}

        {/* Action Button: Cream Pill Button with Maroon Text matching Player Mat */}
        {canLaunch ? (
          <button 
            onClick={() => onConfirmLaunch(canonicalKey, investCost)}
            className="w-full bg-[#FFF2D8] text-[#4A1720] border-2 border-[#4A1720] py-3 px-6 rounded-full font-black uppercase tracking-widest text-xs sm:text-sm hover:bg-[#EAE4D3] hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Rocket size={16} />
            <span>LAUNCH COMPANY (${investCost}K)</span>
          </button>
        ) : (
          <button 
            disabled
            className="w-full bg-[#2A0D12] text-white/30 border border-white/10 py-3 px-6 rounded-full font-black uppercase tracking-widest text-xs sm:text-sm mt-4 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock size={15} />
            <span>
              {isInvestor ? 'FOUNDERS ONLY' :
               isMaxCompanies ? 'MAX 4 LAUNCHES REACHED' :
               !isPhase2 ? `PHASE 2 REQUIRED (P${gamePhase})` :
               isTurnLocked ? 'NOT YOUR TURN' :
               !hasEnoughCash ? 'INSUFFICIENT CASH' : 'UNAVAILABLE'}
            </span>
          </button>
        )}

        {/* Cancel Button */}
        <button 
          onClick={onClose}
          className="text-[#FFE8D6]/60 hover:text-white uppercase font-bold text-xs mt-3 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
