import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

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

const MentorCardModal = ({ onClose, onBuy, drawnCard, clearDrawnCard, notification, hasBoughtThisRound }) => {
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    if (notification && notification.show && notification.message.includes('REJECTED')) {
      setIsBuying(false);
    }
  }, [notification]);

  const handleBuyClick = () => {
    setIsBuying(true);
    onBuy();
  };

  const handleAcknowledge = () => {
    clearDrawnCard();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      {/* Close Button */}
      {!drawnCard && (
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-3 rounded-full bg-black/50 text-white/50 hover:bg-white hover:text-black transition-all border border-white/20 z-50 cursor-pointer"
        >
          <X size={28} />
        </button>
      )}

      <div className="flex flex-col items-center justify-center w-full max-w-4xl h-full relative">
        
        {/* STEP 1: PAYMENT CONFIRMATION (No Card Yet) */}
        {!drawnCard && (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <h2 className="text-[#FFC240] font-black tracking-widest uppercase text-3xl drop-shadow-md mb-8">
              Buy Mentor Card
            </h2>
            
            <div className="bg-[#2A0D12] border-2 border-[#FFC240]/40 rounded-2xl p-12 flex flex-col items-center shadow-[0_0_40px_rgba(255,194,64,0.15)] text-center">
              <div className="w-24 h-24 bg-[#FFF2D8] rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner border border-[#3A141A]/20">
                🃏
              </div>
              
              <h3 className="text-white text-xl font-bold tracking-wider mb-2">
                Blind Draw from Central Deck
              </h3>
              <p className="text-white/60 mb-8 max-w-md leading-relaxed">
                You need to pay <strong className="text-[#55ffb0]">$20K</strong> to buy a Mentor Card. You may only buy one card per round.
              </p>

              {hasBoughtThisRound ? (
                <button 
                  disabled
                  className="w-[280px] bg-[#1a080b] text-white/30 font-black text-lg py-4 rounded-xl cursor-not-allowed opacity-50 tracking-wider uppercase border border-[#FFC240]/10"
                >
                  Already Bought
                </button>
              ) : isBuying ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-[#FFC240] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#FFC240] font-bold tracking-widest uppercase text-sm animate-pulse">Drawing Card...</span>
                </div>
              ) : (
                <button 
                  onClick={handleBuyClick}
                  className="w-[280px] bg-gradient-to-br from-[#FFC240] to-[#F59E0B] text-[#2A0D12] font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(255,194,64,0.4)] hover:scale-105 active:scale-95 transition-all tracking-wider uppercase border border-white/40 cursor-pointer"
                >
                  Confirm Payment
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: REVEAL DRAWN CARD */}
        {drawnCard && (() => {
          const { tagline, body } = parseCardDetails(drawnCard);
          const hasTagline = Boolean(tagline);
          return (
            <div className="flex flex-col items-center animate-in zoom-in duration-500">
              <h2 className="text-[#55ffb0] font-black tracking-widest uppercase text-2xl drop-shadow-md mb-1">
                Card Drawn!
              </h2>
              <p className="text-white/70 tracking-widest uppercase text-xs mb-3 font-bold">
                {drawnCard.type?.toUpperCase() === 'PLAY NOW' ? 'Immediate Effect Applied' : 'Added to Inventory'}
              </p>

              {/* Diamond Card Container */}
              <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[450px] md:h-[450px] flex items-center justify-center mb-6">
                <img 
                  src="/mentor-card-template.png" 
                  alt={drawnCard.name || 'Mentor Card'} 
                  className="absolute inset-0 w-full h-full object-contain z-0 drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] pointer-events-none"
                />

                {/* Exact Text Alignment Overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none select-none">
                  {/* Title at Y=33%..43% */}
                  <div className="absolute top-[33%] left-1/2 -translate-x-1/2 w-[52%] max-w-[200px] flex flex-col items-center justify-center text-center">
                    <h2 className="text-white font-black text-base sm:text-xl md:text-2xl uppercase tracking-wider text-center leading-[1.12] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                      {formatCardTitle(drawnCard.name || drawnCard.title)}
                    </h2>
                  </div>

                  {/* Tagline at Y=47%..52% */}
                  {hasTagline && (
                    <div className="absolute top-[47%] left-1/2 -translate-x-1/2 w-[68%] max-w-[260px] flex items-center justify-center text-center">
                      <p className="text-white font-bold text-[11px] sm:text-xs md:text-sm text-center leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                        {tagline}
                      </p>
                    </div>
                  )}

                  {/* Ability / Description Body */}
                  <div className={`absolute ${hasTagline ? 'top-[54%]' : 'top-[48%]'} left-1/2 -translate-x-1/2 w-[68%] max-w-[250px] flex items-center justify-center text-center`}>
                    <p className="text-white font-medium text-[10px] sm:text-xs md:text-[13px] leading-relaxed text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                      {body}
                    </p>
                  </div>

                  {/* Timing Badge at Y=73%..77% */}
                  <div className="absolute top-[73%] left-1/2 -translate-x-1/2 w-[55%] max-w-[200px] flex items-center justify-center text-center">
                    <div className="text-white font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-widest text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                      {drawnCard.type || 'PLAY ANYTIME'}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAcknowledge}
                className="flex items-center justify-center gap-2 w-[280px] bg-gradient-to-r from-[#44ab72] to-[#2f8857] hover:from-[#52be82] hover:to-[#389b64] text-white font-black text-base py-3.5 rounded-xl shadow-[0_4px_20px_rgba(40,160,80,0.4)] hover:scale-105 active:scale-95 transition-all tracking-wider uppercase border border-white/20 cursor-pointer"
              >
                <CheckCircle size={20} />
                Acknowledge
              </button>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default MentorCardModal;
