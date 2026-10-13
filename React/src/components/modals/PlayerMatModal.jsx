import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function PlayerMatModal({ onClose, ownedCompanies = [], isHoverOpened = false, onPin }) {
  // Exact data extracted from your uploaded Player Mat screenshot
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

  const stages = ["Launch", "Retain", "Grow", "Scale"];
  
  const [teamAllocations, setTeamAllocations] = useState({});
  // Removed local launchedCompanies state; now derived from server ownedCompanies
  const [notes, setNotes] = useState("");

  const handleTeamChange = (companyId, stageIndex, value) => {
    const numericValue = value.replace(/[^0-9]/g, ''); // Ensure only numbers
    setTeamAllocations(prev => ({ ...prev, [`${companyId}-${stageIndex}`]: numericValue }));
  };

  const toggleLaunch = (companyId) => {
    // Disabled in Phase 2 reactive mode: companies can only be launched via the Phase 2 Dashboard actions!
  };

  return (
    // MODIFIED HERE: Added onClick={onClose} to allow clicking the background to close
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
      
      {/* MODIFIED HERE: Added stopPropagation() so clicking the mat doesn't close it, and added animation classes */}
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
        className={`relative w-full max-w-[1400px] h-[95vh] bg-[#501625] rounded-xl border-4 border-[#2A0D12] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isHoverOpened 
            ? 'scale-[0.8] origin-bottom shadow-[0_0_40px_rgba(0,0,0,0.9)]' 
            : 'scale-100 origin-center shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-[20%]'
        }`}
      >
        
        {/* Hover preview indicator badge */}
        {isHoverOpened && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] text-[#FFE8D6] font-bold tracking-widest uppercase border border-white/20 shadow-md pointer-events-none z-50 flex items-center gap-1.5 animate-pulse">
            <span>Hover Preview</span>
            <span className="text-white/40">•</span>
            <span className="text-[#55ffb0]">Click to Expand</span>
          </div>
        )}

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-50 transition-colors bg-black/40 rounded-full p-1.5">
          <X size={28} />
        </button>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 flex flex-col xl:flex-row gap-6">
          
          {/* ================================================= */}
          {/* LEFT: 3x3 Grid of Companies                       */}
          {/* ================================================= */}
          <div className="flex-[3] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(company => {
              const isLaunched = ownedCompanies.some(c => c.name === company.name);

              return (
                <div key={company.id} className="bg-[#7D3C4A] rounded-xl pt-2.5 px-3.5 pb-3 border border-[#3A141A] flex flex-col justify-between relative shadow-lg min-h-[315px]">
                  
                  {/* Card Header (Cream Pill) */}
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

                  {/* LAUNCH OVERLAY */}
                  {!isLaunched && (
                     <div className="absolute inset-0 top-5 z-20 flex flex-col items-center justify-center bg-black/10 rounded-b-xl border-t border-white/5 pointer-events-none">
                        <Lock size={26} className="text-white/60 mb-2 drop-shadow-md" />
                        <button 
                          onClick={() => toggleLaunch(company.id)}
                          className="pointer-events-auto bg-[#FFF2D8] text-[#4A1720] px-5 py-2 rounded-full border-2 border-[#4A1720] font-black uppercase tracking-widest hover:bg-[#EAE4D3] hover:scale-105 transition-all shadow-xl text-xs cursor-pointer"
                        >
                          Launch Company
                        </button>
                     </div>
                  )}

                  {/* Undo Launch Button */}
                  {isLaunched && (
                     <button onClick={() => toggleLaunch(company.id)} className="absolute top-3 right-3 text-[10px] text-white/50 hover:text-white uppercase font-bold z-10 transition-colors">
                       Undo Launch
                     </button>
                  )}

                  {/* Data Table */}
                  <div className="w-full flex-1 flex flex-col justify-center">
                    {/* Headers */}
                    <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 text-[10px] text-[#FFE8D6] uppercase font-black mb-2 pb-1 border-b border-white/20 text-center items-end leading-tight">
                      <div className="text-left pr-1">TEAM</div>
                      <div className="text-left">STAGE</div>
                      <div>Invest<br/>($K)</div>
                      <div>Projected<br/>Rev ($K)</div>
                      <div>Valuation<br/>($K)</div>
                      <div>Loan<br/>($K)</div>
                    </div>

                    {/* Rows */}
                    <div className="flex flex-col gap-2 py-0.5">
                      {stages.map((stage, i) => (
                        <div key={i} className="grid grid-cols-[30px_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-[12px] text-white text-center font-bold">
                          <input
                            type="text" 
                            inputMode="numeric" 
                            maxLength="2" 
                            value={teamAllocations[`${company.id}-${i}`] || ""}
                            onChange={(e) => handleTeamChange(company.id, i, e.target.value)}
                            className="w-6 h-6 bg-transparent border-2 border-white/40 rounded-sm text-center text-white text-xs font-bold outline-none focus:border-white focus:bg-white/10 transition-all placeholder-white/20"
                          />
                          <div className="text-left font-bold text-[12px] text-[#FFE8D6] tracking-wide">{stage}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][0]}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][1]}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][2]}</div>
                          <div className="font-mono font-bold text-[12px] text-white drop-shadow-sm">{company.data[i][3]}</div>
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
              );
            })}
          </div>

          {/* ================================================= */}
          {/* RIGHT: Sidebars (Second Chance, Multiplier, Notes)*/}
          {/* ================================================= */}
          <div className="flex-1 flex flex-col gap-4 min-w-[320px] max-w-sm mx-auto xl:mx-0">
            
            {/* Second Chance Tokens */}
            <div className="bg-[#FFF2D8] rounded-xl border-2 border-[#3A141A] p-3 text-center shadow-lg">
              <h3 className="font-black text-[#4A1720] uppercase tracking-widest mb-2.5 text-xs md:text-sm">Second Chance</h3>
              <div className="bg-[#7D3C4A] border border-[#3A141A] rounded-full px-4 py-2 flex justify-center items-center gap-3 relative overflow-hidden">
                {/* Active Token 1 */}
                <div className="w-12 h-12 rounded-full overflow-hidden relative group cursor-pointer hover:scale-105 transition-transform shrink-0 drop-shadow-md">
                  <img src="/mat-icons/second-chance-active.png" alt="Second Chance Active" className="w-full h-full object-contain select-none" />
                </div>
                {/* Active Token 2 */}
                <div className="w-12 h-12 rounded-full overflow-hidden relative group cursor-pointer hover:scale-105 transition-transform shrink-0 drop-shadow-md">
                  <img src="/mat-icons/second-chance-active.png" alt="Second Chance Active" className="w-full h-full object-contain select-none" />
                </div>
                {/* Speed lines separator */}
                <div className="w-[18px] h-9 flex items-center justify-center opacity-40 select-none">
                  <div className="w-[2px] h-full bg-white rotate-12 mx-0.5"></div>
                  <div className="w-[2px] h-full bg-white rotate-12 mx-0.5"></div>
                </div>
                {/* Inactive Token */}
                <div className="w-12 h-12 rounded-full overflow-hidden relative shrink-0 opacity-80 drop-shadow-md">
                  <img src="/mat-icons/second-chance-inactive.png" alt="Second Chance Inactive" className="w-full h-full object-contain select-none" />
                </div>
              </div>
            </div>

            {/* Multiplier Table */}
            <div className="bg-[#FFF2D8] rounded-xl border-2 border-[#3A141A] overflow-hidden shadow-lg">
              <div className="p-2 text-[9px] text-center font-black text-[#4A1720] uppercase tracking-wider border-b border-[#3A141A]/20">
                 Actual Revenue = Projected Revenue x Multiplier
              </div>
              <table className="w-full text-center text-[10px] font-bold border-collapse text-black">
                <thead>
                  <tr className="bg-[#E5DCC5]">
                    <th className="border-r border-b border-[#3A141A]/20 p-1 w-12 text-[8px]" rowSpan="2">DICE<br/>ROLL</th>
                    <th className="border-b border-[#3A141A]/20 p-1 tracking-widest text-[10px]" colSpan="4">MULTIPLIER</th>
                  </tr>
                  <tr className="bg-[#E5DCC5] text-[8px]">
                    <th className="border-r border-b border-[#3A141A]/20 p-1">TURN 1<br/>$0K</th>
                    <th className="border-r border-b border-[#3A141A]/20 p-1">TURN 2<br/>$50K</th>
                    <th className="border-r border-b border-[#3A141A]/20 p-1">TURN 3<br/>$100K</th>
                    <th className="border-b border-[#3A141A]/20 p-1">TURN 4<br/>$200K</th>
                  </tr>
                </thead>
                <tbody className="bg-[#FFF2D8] font-mono font-medium">
                  {[
                    [1, -2, -2, -1, 0], [2, -2, -1, 0, 1], [3, -1, -1, 0, 1],
                    [4, -1, 0, 1, 2], [5, 0, 0, 1, 2], [6, 0, 1, 2, 3],
                    [7, 1, 1, 2, 3], [8, 1, 2, 3, 4], [9, 2, 2, 3, 4], [10, 2, 3, 4, 5]
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/50 transition-colors">
                      <td className="border-r border-b border-[#3A141A]/20 p-1 font-bold bg-[#E5DCC5]/30">{row[0]}</td>
                      <td className="border-r border-b border-[#3A141A]/20 p-1">{row[1]}</td>
                      <td className="border-r border-b border-[#3A141A]/20 p-1">{row[2]}</td>
                      <td className="border-r border-b border-[#3A141A]/20 p-1">{row[3]}</td>
                      <td className="border-b border-[#3A141A]/20 p-1">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes Section */}
            <div className="bg-[#FFF2D8] rounded-xl border-2 border-[#3A141A] p-4 shadow-lg flex-1 flex flex-col min-h-[220px] relative">
              <h3 className="font-black text-[#4A1720] uppercase text-sm mb-2 text-center tracking-widest border-b border-[#3A141A]/10 pb-2">Notes / Calculations</h3>
              <textarea 
                className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[#4A1720] font-sans text-sm p-2 font-medium"
                placeholder="Type your notes and calculations here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {/* Watermark Logo */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none opacity-85">
                 <img src="/mat-icons/modern-mint-mat-logo.png" alt="Modern Mint" className="h-[20px] object-contain drop-shadow-sm select-none" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}