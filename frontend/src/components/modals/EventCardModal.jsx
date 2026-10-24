import React from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, ShieldAlert, DollarSign, Lock, CheckCircle } from 'lucide-react';

export default function EventCardModal({
  onClose,
  roundNum = 4,
  activeEvent = null,
  revealedEvents = {},
  currentRound = 1
}) {
  const isLocked = currentRound < roundNum;
  // Get event for this specific round (either from revealedEvents map, or activeEvent if current round matches)
  const card = revealedEvents?.[roundNum] || (currentRound >= roundNum && (roundNum === 7 || currentRound < 7) ? activeEvent : null);

  const getEffectBadge = (effect) => {
    switch (effect) {
      case 'pr_discount_100':
        return {
          icon: <TrendingUp className="w-5 h-5 text-[#55ffb0]" />,
          title: 'PR Subsidy Effect',
          badgeText: 'PR Discount: -$100K',
          badgeColor: 'border-[#55ffb0]/40 bg-[#55ffb0]/10 text-[#55ffb0]',
          detail: 'All PR service marketing campaigns cost $100K less for all Founders during this event cycle.'
        };
      case 'workforce_discount_half':
        return {
          icon: <Sparkles className="w-5 h-5 text-[#00e1ff]" />,
          title: 'Innovation & Workforce Boost',
          badgeText: 'Workforce Upgrade: 50% OFF',
          badgeColor: 'border-[#00e1ff]/40 bg-[#00e1ff]/10 text-[#00e1ff]',
          detail: 'Leveling up workforce across all owned companies is 50% cheaper during this event cycle.'
        };
      case 'loan_interest_15':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          title: 'Credit Crunch / High Rates',
          badgeText: 'Loan Interest: 15% (Up from 10%)',
          badgeColor: 'border-amber-400/40 bg-amber-400/10 text-amber-400',
          detail: 'Bank loan interest increases from 10% to 15% deducted at the start of Phase 3.'
        };
      case 'immediate_stimulus_100':
        return {
          icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
          title: 'Government Economic Stimulus',
          badgeText: 'Cash Grant: +$100K per Company',
          badgeColor: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400',
          detail: 'All Founders receive an immediate $100K cash grant for each company they currently own.'
        };
      case 'immediate_tax_50':
        return {
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          title: 'Regulatory Compliance Audit',
          badgeText: 'Audit Fee: -$50K',
          badgeColor: 'border-rose-400/40 bg-rose-400/10 text-rose-400',
          detail: 'Each Founder pays a one-time $50K compliance audit fee (unless protected by a Guardian Shield).'
        };
      default:
        return {
          icon: <TrendingUp className="w-5 h-5 text-gray-300" />,
          title: 'Market Effect',
          badgeText: 'Active Market Shock',
          badgeColor: 'border-gray-400/40 bg-gray-400/10 text-gray-300',
          detail: card?.description || 'Active market shock condition applied.'
        };
    }
  };

  const effectDetails = card ? getEffectBadge(card.effect) : null;

  return (
    <div className="relative w-full max-w-[480px] bg-gradient-to-b from-[#142822] via-[#0d1c17] to-[#08120e] border-2 border-[#1c4d3d] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-white flex flex-col font-sans select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c4d3d]/80 bg-black/40">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-black tracking-widest text-[#55ffb0] uppercase px-2 py-0.5 rounded bg-[#55ffb0]/10 border border-[#55ffb0]/30">
            Round {roundNum} Event
          </span>
          <span className="text-xs font-semibold text-gray-400">
            {roundNum === 4 ? 'Rounds 4 – 6' : 'Rounds 7 – 9'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 flex flex-col items-center">
        {isLocked ? (
          /* Locked State */
          <div className="flex flex-col items-center text-center py-6 px-4">
            <div className="w-20 h-20 rounded-2xl bg-[#091511] border-2 border-[#1c4d3d] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.6)] mb-4">
              <img src="/lock-icon.png" alt="Locked" className="w-10 h-10 object-contain drop-shadow" />
            </div>
            <h3 className="text-xl font-black text-gray-200 uppercase tracking-wider mb-2">
              Event Card Locked
            </h3>
            <p className="text-sm text-gray-400 max-w-[340px] leading-relaxed mb-4">
              This Market Shock card will automatically be drawn and revealed at the start of{' '}
              <span className="text-[#55ffb0] font-bold">Round {roundNum}</span>.
            </p>
            <div className="bg-black/30 border border-[#1c4d3d] rounded-lg p-3 text-xs text-gray-400 max-w-[340px]">
              Current Game Progress: <span className="text-white font-semibold">Round {currentRound}</span> of 9.
            </div>
          </div>
        ) : card ? (
          /* Unlocked & Revealed Card */
          <div className="w-full flex flex-col items-center">
            {/* Visual Card Mockup */}
            <div className="relative w-[240px] aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 border-[#00e1ff]/40 shadow-[0_0_30px_rgba(0,225,255,0.25)] mb-5 group">
              <img
                src="/event-card.jpg"
                alt="Event Card"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00e1ff] mb-1 drop-shadow">
                  Market Shock Event
                </span>
                <h4 className="text-lg font-black text-white leading-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {card.name}
                </h4>
              </div>
            </div>

            {/* Title & Description Box */}
            <div className="w-full text-center mb-4">
              <h2 className="text-2xl font-black text-[#55ffb0] tracking-wide uppercase drop-shadow mb-1.5">
                {card.name}
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed px-2">
                "{card.description}"
              </p>
            </div>

            {/* Effect Details Panel */}
            {effectDetails && (
              <div className="w-full bg-black/40 border border-[#1c4d3d] rounded-xl p-4 flex flex-col gap-2.5 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    {effectDetails.icon}
                    <span>{effectDetails.title}</span>
                  </div>
                  <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded border ${effectDetails.badgeColor}`}>
                    {effectDetails.badgeText}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  {effectDetails.detail}
                </p>
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-[#55ffb0] mt-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active in current market cycle</span>
            </div>
          </div>
        ) : (
          /* Unlocked but no card data fallback */
          <div className="flex flex-col items-center text-center py-6 px-4">
            <h3 className="text-lg font-bold text-gray-300 mb-2">Event Card Active</h3>
            <p className="text-sm text-gray-400 max-w-[320px]">
              Round {roundNum} Event has been triggered for this market cycle.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#1c4d3d]/80 bg-black/30 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-lg bg-[#1c4d3d] hover:bg-[#256651] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          Close
        </button>
      </div>

    </div>
  );
}
