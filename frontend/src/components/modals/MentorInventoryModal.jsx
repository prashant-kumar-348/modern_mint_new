import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const COMPANY_TEMPLATES = [
  'CONTRACT FARMING',
  'AGRI IoT',
  'WALLET',
  'SNACKS',
  'QUICK COMMERCE',
  'SMART STORAGE',
  'RESTRO - CHAIN',
  'TRACEABILITY',
  'ROBO - PACKAGING'
];

const formatCardTitle = (title) => {
  if (!title) return '';
  const words = title.trim().split(/\s+/);
  if (words.length === 2) {
    return (
      <>
        <span>{words[0]}</span>
        <br />
        <span>{words[1]}</span>
      </>
    );
  }
  if (words.length === 3) {
    return (
      <>
        <span>{words[0]} {words[1]}</span>
        <br />
        <span>{words[2]}</span>
      </>
    );
  }
  return title;
};

const parseCardDetails = (card) => {
  if (!card) return { tagline: '', body: '' };
  const desc = (card.description || card.desc || '').trim();

  // Find the first sentence ending with '. ' or '! '
  const dotIndex = desc.indexOf('. ');
  const exclIndex = desc.indexOf('! ');

  let splitIndex = -1;
  if (dotIndex !== -1 && exclIndex !== -1) {
    splitIndex = Math.min(dotIndex, exclIndex);
  } else if (dotIndex !== -1) {
    splitIndex = dotIndex;
  } else if (exclIndex !== -1) {
    splitIndex = exclIndex;
  }

  if (splitIndex !== -1) {
    return {
      tagline: desc.slice(0, splitIndex).trim(),
      body: desc.slice(splitIndex + 1).trim()
    };
  }

  return {
    tagline: '',
    body: desc
  };
};

const getCardRequirements = (card) => {
  if (!card) return { needsPlayer: false, needsCompany: false, needsTemplates: false };
  const effect = card.effectType;
  return {
    needsPlayer: ['skip_rival_turn', 'mutual_draw', 'halve_rival_cash'].includes(effect),
    needsCompany: [
      'free_stage_up', 'free_pr', 'free_workforce', 'half_cost_stage_up', 
      'double_revenue', 'half_cost_all_stages', 'tech_revenue_boost', 
      'reduce_tax', 'end_game_valuation_boost', 'sell_company_half_price', 
      'block_stage_up'
    ].includes(effect),
    needsTemplates: effect === 'quick_launch_retain'
  };
};

const MentorInventoryModal = ({ onClose, player, players, onPlayCard }) => {
  const mentorCards = player?.mentorCards || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [targetCompanyName, setTargetCompanyName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const safeIndex = mentorCards.length > 0 ? Math.min(currentIndex, mentorCards.length - 1) : 0;
  const currentCard = mentorCards[safeIndex];

  const handlePrev = () => {
    if (mentorCards.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mentorCards.length - 1));
    setTargetPlayerId('');
    setTargetCompanyName('');
    setErrorMsg('');
  };

  const handleNext = () => {
    if (mentorCards.length <= 1) return;
    setCurrentIndex((prev) => (prev < mentorCards.length - 1 ? prev + 1 : 0));
    setTargetPlayerId('');
    setTargetCompanyName('');
    setErrorMsg('');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mentorCards.length]);

  if (!mentorCards || mentorCards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="relative bg-[#1a080b] border-2 border-[#FFC240]/40 rounded-3xl p-10 max-w-md w-full flex flex-col items-center text-center shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <div className="w-20 h-20 bg-[#FFF2D8]/10 rounded-full flex items-center justify-center text-4xl mb-4 border border-[#FFC240]/30 shadow-inner">
            🃏
          </div>
          <h3 className="text-xl font-black text-[#FFC240] uppercase tracking-wider mb-2">
            Inventory Empty
          </h3>
          <p className="text-white/60 text-xs leading-relaxed max-w-xs mb-6">
            You don't have any Mentor Cards stored. Buy Mentor Cards during Phase 2 to store and activate them here.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] hover:from-[#b91c1c] hover:to-[#991b1b] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md border border-white/20 active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { tagline, body } = parseCardDetails(currentCard);
  const hasTagline = Boolean(tagline);
  const { needsPlayer, needsCompany, needsTemplates } = getCardRequirements(currentCard);
  const rivals = (players || []).filter(p => p.id !== player?.id);
  const ownedCompanies = player?.ownedCompanies || [];
  const unownedTemplates = COMPANY_TEMPLATES.filter(
    tName => !ownedCompanies.some(c => c.name === tName)
  );

  const handleApply = () => {
    if (!currentCard) return;

    // Validate target player
    if (needsPlayer && !targetPlayerId) {
      if (rivals.length === 0) {
        setErrorMsg('No rival players available.');
      } else {
        setErrorMsg('Please select a target rival player.');
      }
      return;
    }

    // Validate target company
    if (needsCompany && !targetCompanyName) {
      if (ownedCompanies.length === 0) {
        setErrorMsg('You do not own any companies to apply this card.');
      } else {
        setErrorMsg('Please select a target company.');
      }
      return;
    }

    // Validate company template to launch
    if (needsTemplates && !targetCompanyName) {
      if (unownedTemplates.length === 0) {
        setErrorMsg('All companies are already launched.');
      } else {
        setErrorMsg('Please select a company to launch.');
      }
      return;
    }

    onPlayCard(currentCard.id, targetPlayerId, targetCompanyName);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/85 backdrop-blur-md p-4 sm:p-6 select-none animate-in fade-in duration-300 overflow-hidden">
      
      {/* Top Bar with subtle card counter & Close button */}
      <div className="w-full flex items-center justify-between px-4 sm:px-8 pt-2 z-30">
        <div className="flex items-center gap-2">
          {mentorCards.length > 1 && (
            <span className="text-[#FFC240] text-xs font-black tracking-widest uppercase bg-black/40 border border-[#FFC240]/30 rounded-full px-3 py-1 shadow-inner">
              CARD {safeIndex + 1} OF {mentorCards.length}
            </span>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="p-2.5 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/10 cursor-pointer drop-shadow-md"
          title="Close (Esc)"
        >
          <X size={22} />
        </button>
      </div>

      {/* Center Card Area with Arrows and Diamond Card Stack */}
      <div className="flex-1 flex items-center justify-center w-full my-auto z-20">
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-10">
          
          {/* Left Navigation Arrow */}
          {mentorCards.length > 1 ? (
            <button
              onClick={handlePrev}
              className="p-3 text-white/85 hover:text-white hover:scale-115 active:scale-95 transition-all cursor-pointer drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] focus:outline-none"
              title="Previous Card (Left Arrow)"
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="38" y1="22" x2="6" y2="22" />
                <polyline points="18 10 6 22 18 34" />
              </svg>
            </button>
          ) : (
            <div className="w-[44px]" />
          )}

          {/* Diamond Card Container */}
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] flex items-center justify-center shrink-0">
            
            {/* Layered Card 3 (back) */}
            {mentorCards.length >= 3 && (
              <img 
                src="/mentor-card-template.png" 
                alt="" 
                className="absolute inset-0 w-full h-full object-contain scale-[1.14] opacity-80 -z-20 drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] pointer-events-none transition-transform duration-300"
              />
            )}

            {/* Layered Card 2 (middle) */}
            {mentorCards.length >= 2 && (
              <img 
                src="/mentor-card-template.png" 
                alt="" 
                className="absolute inset-0 w-full h-full object-contain scale-[1.07] opacity-90 -z-10 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] pointer-events-none transition-transform duration-300"
              />
            )}

            {/* Front Active Card Graphic */}
            <img 
              src="/mentor-card-template.png" 
              alt={currentCard.name || 'Mentor Card'} 
              className="absolute inset-0 w-full h-full object-contain z-0 drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] pointer-events-none"
            />

            {/* Card Text Content Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none select-none">
              
              {/* 1. Title: Y=33%..43% */}
              <div className="absolute top-[33%] left-1/2 -translate-x-1/2 w-[52%] max-w-[200px] flex flex-col items-center justify-center text-center">
                <h2 className="text-white font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider text-center leading-[1.12] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  {formatCardTitle(currentCard.name || currentCard.title)}
                </h2>
              </div>

              {/* 2. Tagline: Y=47%..52% */}
              {hasTagline && (
                <div className="absolute top-[47%] left-1/2 -translate-x-1/2 w-[68%] max-w-[260px] flex items-center justify-center text-center">
                  <p className="text-white font-bold text-[11px] sm:text-xs md:text-sm text-center leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                    {tagline}
                  </p>
                </div>
              )}

              {/* 3. Ability / Description: Y=54%..67% */}
              <div className={`absolute ${hasTagline ? 'top-[54%]' : 'top-[48%]'} left-1/2 -translate-x-1/2 w-[68%] max-w-[250px] flex items-center justify-center text-center`}>
                <p className="text-white font-medium text-[10px] sm:text-xs md:text-[13px] leading-relaxed text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                  {body}
                </p>
              </div>

              {/* 4. Timing Badge: Y=73%..77% */}
              <div className="absolute top-[73%] left-1/2 -translate-x-1/2 w-[55%] max-w-[200px] flex items-center justify-center text-center">
                <div className="text-white font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-widest text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  {currentCard.type || 'PLAY ANYTIME'}
                </div>
              </div>

            </div>

          </div>

          {/* Right Navigation Arrow */}
          {mentorCards.length > 1 ? (
            <button
              onClick={handleNext}
              className="p-3 text-white/85 hover:text-white hover:scale-115 active:scale-95 transition-all cursor-pointer drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] focus:outline-none"
              title="Next Card (Right Arrow)"
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="22" x2="38" y2="22" />
                <polyline points="26 10 38 22 26 34" />
              </svg>
            </button>
          ) : (
            <div className="w-[44px]" />
          )}

        </div>
      </div>

      {/* Bottom Action Area: Targets + Apply & Keep Buttons */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xl pb-3 sm:pb-5 z-30">
        
        {/* Target Selection Panel (if current card requires target) */}
        {(needsCompany || needsPlayer || needsTemplates) && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 bg-[#1f0a0d]/95 border-2 border-[#FFC240]/60 rounded-2xl px-5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in fade-in duration-200">
            <span className="text-[#FFC240] text-xs font-black uppercase tracking-wider">
              {needsCompany ? 'Target Company:' : needsTemplates ? 'Launch Template:' : 'Target Player:'}
            </span>
            {needsCompany && (
              <select
                value={targetCompanyName}
                onChange={(e) => { setTargetCompanyName(e.target.value); setErrorMsg(''); }}
                className="bg-[#2d0e13] text-white border border-[#FFC240]/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-[#FFC240]"
              >
                <option value="">-- Choose Company --</option>
                {ownedCompanies.map(c => {
                  const stageName = ['Launch', 'Retain', 'Grow', 'Scale'][c.stage === 'L' || c.stage === 0 ? 0 : c.stage === 'R' || c.stage === 1 ? 1 : c.stage === 'G' || c.stage === 2 ? 2 : 3] || 'Launch';
                  return (
                    <option key={c.name} value={c.name}>{c.name} ({stageName})</option>
                  );
                })}
              </select>
            )}
            {needsTemplates && (
              <select
                value={targetCompanyName}
                onChange={(e) => { setTargetCompanyName(e.target.value); setErrorMsg(''); }}
                className="bg-[#2d0e13] text-white border border-[#FFC240]/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-[#FFC240]"
              >
                <option value="">-- Choose Template --</option>
                {unownedTemplates.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
            {needsPlayer && (
              <select
                value={targetPlayerId}
                onChange={(e) => { setTargetPlayerId(e.target.value); setErrorMsg(''); }}
                className="bg-[#2d0e13] text-white border border-[#FFC240]/40 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-[#FFC240]"
              >
                <option value="">-- Choose Rival Player --</option>
                {rivals.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.cash}K Cash)</option>
                ))}
              </select>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="text-red-400 font-bold text-xs uppercase tracking-wider bg-red-950/90 border border-red-500/60 rounded-xl px-4 py-1.5 shadow-lg animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Apply & Keep Buttons */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mt-1">
          <button
            onClick={handleApply}
            className="px-8 sm:px-12 py-2.5 sm:py-3 bg-gradient-to-r from-[#44ab72] to-[#2f8857] hover:from-[#52be82] hover:to-[#389b64] text-white font-black text-sm sm:text-base tracking-wider rounded-xl shadow-[0_4px_20px_rgba(40,160,80,0.4)] border border-white/20 active:scale-95 transition-all cursor-pointer min-w-[120px] sm:min-w-[140px]"
          >
            Apply
          </button>
          <button
            onClick={onClose}
            className="px-8 sm:px-12 py-2.5 sm:py-3 bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] hover:from-[#b91c1c] hover:to-[#991b1b] text-white font-black text-sm sm:text-base tracking-wider rounded-xl shadow-[0_4px_20px_rgba(180,30,30,0.4)] border border-white/20 active:scale-95 transition-all cursor-pointer min-w-[120px] sm:min-w-[140px]"
          >
            Keep
          </button>
        </div>

      </div>

    </div>
  );
};

export default MentorInventoryModal;
