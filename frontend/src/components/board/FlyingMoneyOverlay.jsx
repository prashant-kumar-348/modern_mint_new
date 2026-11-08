import React, { useState, useEffect, useCallback } from 'react';
import { CURRENCY_NOTES, getBestNoteForAmount } from '../../utils/currencyNotes';

export default function FlyingMoneyOverlay() {
  const [batches, setBatches] = useState([]);

  const triggerAnimation = useCallback((detail = {}) => {
    const { 
      amount = 1000, 
      text = '', 
      type = 'gain', // 'gain' (wallet -> player) or 'spend' (player -> board)
      fromElId,
      toElId
    } = detail;

    // Resolve start coordinates
    let startX = window.innerWidth - 120;
    let startY = window.innerHeight - 40;

    if (fromElId) {
      const el = document.getElementById(fromElId);
      if (el) {
        const rect = el.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    } else if (type === 'spend') {
      const cashEl = document.getElementById('player-cash-in-hand');
      if (cashEl) {
        const rect = cashEl.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    } else {
      const walletEl = document.getElementById('game-wallet-deck');
      if (walletEl) {
        const rect = walletEl.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    }

    // Resolve target coordinates
    let endX = window.innerWidth / 2;
    let endY = window.innerHeight - 35;

    if (toElId) {
      const el = document.getElementById(toElId);
      if (el) {
        const rect = el.getBoundingClientRect();
        endX = rect.left + rect.width / 2;
        endY = rect.top + rect.height / 2;
      }
    } else if (type === 'spend') {
      endX = window.innerWidth / 2;
      endY = window.innerHeight * 0.45; // fly to board center
    } else {
      const cashEl = document.getElementById('player-cash-in-hand');
      if (cashEl) {
        const rect = cashEl.getBoundingClientRect();
        endX = rect.left + rect.width / 2;
        endY = rect.top + rect.height / 2;
      }
    }

    const noteCount = amount >= 10000 ? 7 : amount >= 2000 ? 5 : 4;
    const bestNote = getBestNoteForAmount(amount);

    const notes = Array.from({ length: noteCount }, (_, i) => {
      // Pick note image (blend between best matching note and adjacent notes)
      const noteIdx = (i % 2 === 0) 
        ? CURRENCY_NOTES.findIndex(n => n.id === bestNote.id) 
        : Math.min(CURRENCY_NOTES.length - 1, CURRENCY_NOTES.findIndex(n => n.id === bestNote.id) + 1);
      const noteData = CURRENCY_NOTES[Math.max(0, noteIdx)] || bestNote;

      return {
        id: `note-${Date.now()}-${i}-${Math.random()}`,
        image: noteData.image,
        delay: i * 75,
        duration: 850 + Math.random() * 200,
        curveOffset: (Math.random() - 0.5) * 80 - 120, // Arching path upward
        rotation: (Math.random() - 0.5) * 60,
        scale: 0.8 + Math.random() * 0.35
      };
    });

    const newBatch = {
      id: `batch-${Date.now()}-${Math.random()}`,
      startX,
      startY,
      dx: endX - startX,
      dy: endY - startY,
      endX,
      endY,
      notes,
      text: text || (type === 'gain' ? `+$${amount}K` : `-$${amount}K`),
      type
    };

    setBatches(prev => [...prev, newBatch]);

    // Cleanup batch after animation completes
    setTimeout(() => {
      setBatches(prev => prev.filter(b => b.id !== newBatch.id));
    }, 2200);
  }, []);

  useEffect(() => {
    const handleFlyMoney = (e) => {
      if (e.detail) {
        triggerAnimation(e.detail);
      }
    };

    window.addEventListener('fly_money', handleFlyMoney);
    return () => window.removeEventListener('fly_money', handleFlyMoney);
  }, [triggerAnimation]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {batches.map(batch => (
        <div key={batch.id} className="absolute inset-0">
          
          {/* Notes Flight */}
          {batch.notes.map(note => (
            <div
              key={note.id}
              className="absolute w-[80px] h-[38px] md:w-[100px] md:h-[48px] will-change-transform"
              style={{
                left: `${batch.startX}px`,
                top: `${batch.startY}px`,
                animation: `flyNoteGlide ${note.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${note.delay}ms forwards`,
                '--dx': `${batch.dx}px`,
                '--dy': `${batch.dy}px`,
                '--curve': `${note.curveOffset}px`,
                '--rot': `${note.rotation}deg`,
                '--scale': `${note.scale}`
              }}
            >
              <img 
                src={note.image} 
                alt="Bank Note"
                className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] rounded-xs"
              />
            </div>
          ))}

          {/* Floating Amount Badge on Landing */}
          {batch.text && (
            <div 
              className={`absolute font-black font-mono text-sm md:text-base px-3 py-1 rounded-full shadow-lg border uppercase tracking-wider animate-in fade-in zoom-in-75 ${
                batch.type === 'gain'
                  ? 'bg-emerald-950/90 text-[#55ffb0] border-[#55ffb0]/40 shadow-[0_0_20px_rgba(85,255,176,0.4)]'
                  : 'bg-rose-950/90 text-[#ff6b6b] border-[#ff6b6b]/40 shadow-[0_0_20px_rgba(255,107,107,0.4)]'
              }`}
              style={{
                left: `${batch.endX}px`,
                top: `${batch.endY - 30}px`,
                transform: 'translate(-50%, -100%)',
                animation: 'fadeFloatUp 1.8s ease-out 400ms forwards'
              }}
            >
              {batch.text}
            </div>
          )}

        </div>
      ))}

      {/* Embedded CSS for smooth physics-based glide */}
      <style>{`
        @keyframes flyNoteGlide {
          0% {
            transform: translate3d(0, 0, 0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(calc(var(--dx) * 0.15), calc(var(--dy) * 0.15 + var(--curve)), 0) scale(calc(var(--scale) * 1.15)) rotate(calc(var(--rot) * 0.4));
          }
          65% {
            opacity: 1;
            transform: translate3d(calc(var(--dx) * 0.75), calc(var(--dy) * 0.75 + var(--curve) * 0.4), 0) scale(calc(var(--scale) * 0.95)) rotate(calc(var(--rot) * 0.85));
          }
          90% {
            opacity: 0.9;
            transform: translate3d(var(--dx), var(--dy), 0) scale(0.65) rotate(var(--rot));
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--dx), var(--dy), 0) scale(0.4) rotate(var(--rot));
          }
        }

        @keyframes fadeFloatUp {
          0% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -15px) scale(1.05);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -35px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}
