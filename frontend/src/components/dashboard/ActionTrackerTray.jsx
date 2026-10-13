import React from 'react';

const getCompanyMatIcon = (name) => {
  if (!name) return '/mat-icons/mat-icon-quick-commerce.png';
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.includes("FARM") || clean.includes("CONTRACT") || clean.includes("KHETI")) return '/mat-icons/mat-icon-contract-farming.png';
  if (clean.includes("IOT") || clean.includes("AGRI")) return '/mat-icons/mat-icon-agri-iot.png';
  if (clean.includes("WALLET")) return '/mat-icons/mat-icon-wallet.png';
  if (clean.includes("SNACK")) return '/mat-icons/mat-icon-snacks.png';
  if (clean.includes("COMM") || clean.includes("QUICK")) return '/mat-icons/mat-icon-quick-commerce.png';
  if (clean.includes("STOR")) return '/mat-icons/mat-icon-smart-storage.png';
  if (clean.includes("RESTRO") || clean.includes("CHAIN") || clean.includes("KHANAA") || clean.includes("FOOD") || clean.includes("FARMA")) return '/mat-icons/mat-icon-restro-chain.png';
  if (clean.includes("TRACE")) return '/mat-icons/mat-icon-traceability.png';
  if (clean.includes("ROBO") || clean.includes("PACK")) return '/mat-icons/mat-icon-robo-packaging.png';
  return '/mat-icons/mat-icon-quick-commerce.png';
};

export default function ActionTrackerTray({
  actions = [],
  onUndo
}) {
  if (!actions || actions.length === 0) return null;

  const totalMoneyUsed = actions.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);

  // Map original 1-based index and reverse so newest / highest ACTION is at the top
  const reversedActions = actions.map((action, idx) => ({
    ...action,
    actionNumber: idx + 1
  })).reverse();

  return (
    <div className="w-[214px] flex flex-col gap-1.5 mb-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Header: Money used in this round */}
      <div className="w-full flex items-center justify-end text-white text-[9.5px] font-medium gap-1.5 pr-0.5 mb-0.5 select-none">
        <span className="text-white/80">Money used in this round</span>
        <span className="font-extrabold text-white text-[10px] tracking-wide">
          ${totalMoneyUsed}k
        </span>
      </div>

      {/* Action List Items */}
      <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-[#a88235]/40">
        {reversedActions.map((action) => (
          <div key={action.id} className="flex items-center gap-1 w-full animate-in fade-in slide-in-from-bottom-1 duration-200" title={action.text}>
            {/* Left Pill: ACTION N : Description */}
            <div className="flex-1 min-w-0 bg-gradient-to-r from-[#816024] via-[#6d501b] to-[#45330e] border border-[#b88c3a]/50 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-[0_2px_8px_rgba(0,0,0,0.5)] overflow-hidden">
              <span className="text-[#ffe8a3] font-black text-[9px] shrink-0 select-none">
                ACTION {action.actionNumber} :
              </span>
              
              {action.type === 'mentor' ? (
                <div className="w-4 h-4 shrink-0 flex items-center justify-center -my-0.5">
                  <img 
                    src="/mentor-card-template.png" 
                    alt="Mentor" 
                    className="w-full h-full object-contain drop-shadow" 
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                  <span className="text-white font-bold text-[8.5px] truncate">
                    {action.text}
                  </span>
                  {action.companyName && (
                    <img 
                      src={getCompanyMatIcon(action.companyName)} 
                      alt="" 
                      className="w-3 h-3 object-contain shrink-0 filter drop-shadow" 
                    />
                  )}
                </div>
              )}
            </div>

            {/* Middle Pill: Cost */}
            <div className="bg-gradient-to-b from-[#8f753c] to-[#5c471c] border border-[#d4af37]/50 rounded-full px-1.5 py-0.5 text-white font-bold text-[8.5px] shadow-inner shrink-0 min-w-[36px] text-center select-none">
              ${action.cost || 0}k
            </div>

            {/* Right Button: Red [X] Cancel/Undo */}
            <button 
              onClick={() => onUndo && onUndo(action.id)} 
              title="Undo this action"
              className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#8a141b] to-[#590a0f] hover:from-[#a81c24] hover:to-[#730f15] border border-[#ff4d4d]/40 text-white font-black text-[9px] flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
