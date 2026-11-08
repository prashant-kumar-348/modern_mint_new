import React, { useState } from 'react';
import { X, Wallet, Sparkles, Building2, Layers, Send, Eye } from 'lucide-react';
import { CURRENCY_NOTES, breakdownCashIntoNotes } from '../../utils/currencyNotes';

export default function WalletModal({ onClose, cash = 0, player = null }) {
  const [selectedNote, setSelectedNote] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'MILLION', 'THOUSAND'

  // Player's notes breakdown
  const playerNoteBreakdown = breakdownCashIntoNotes(cash);

  const handleTestFlight = (noteValue = 1000) => {
    window.dispatchEvent(new CustomEvent('fly_money', {
      detail: {
        amount: noteValue,
        text: `+$${noteValue}K Flight Test`,
        type: 'gain'
      }
    }));
  };

  const filteredNotes = CURRENCY_NOTES.filter(note => {
    if (filter === 'MILLION') return note.value >= 1000;
    if (filter === 'THOUSAND') return note.value < 1000;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 font-sans select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* MODAL CONTAINER */}
      <div className="bg-[#0c1f19] text-white border-2 border-[#d4af37] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col relative overflow-hidden">
        
        {/* TOP GLOW HEADER - PINNED & VISIBLE */}
        <div className="shrink-0 bg-gradient-to-r from-[#143d2b] via-[#1b5038] to-[#143d2b] border-b border-[#d4af37]/40 px-6 py-5 flex items-center justify-between relative z-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#d4af37]/20 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8a6818] p-0.5 shadow-md flex items-center justify-center text-black shrink-0">
              <Wallet size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-mono font-black uppercase tracking-[0.22em] text-[#FFE885] block leading-snug">
                The Modern Mint Bank &amp; Reserve
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white flex items-center gap-2 mt-0.5">
                <span>Player Wallet &amp; Reserve Vault</span>
                <Sparkles size={16} className="text-[#FFE885] animate-pulse" />
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            <button
              type="button"
              onClick={() => handleTestFlight(cash > 0 ? Math.min(cash, 10000) : 2000)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#FFE885] text-black text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              title="Test flying money animation across screen"
            >
              <Send size={13} />
              <span>Test Fly Cash</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY CONTENT - SCROLLABLE */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 hide-scrollbar">

          {/* PLAYER WALLET SUMMARY STRIP */}
          <div className="bg-[#112a22] border border-[#d4af37]/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2A7553] border border-[#55ffb0]/40 flex items-center justify-center text-[#55ffb0]">
                <Layers size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest block">
                  {player?.name || 'Player'}'s Cash in Hand
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-[#55ffb0]">
                  ${cash}K
                </span>
              </div>
            </div>

            {/* Note Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider mr-1">
                Wallet Notes:
              </span>
              {playerNoteBreakdown.length > 0 ? (
                playerNoteBreakdown.map(({ note, count }) => (
                  <div
                    key={note.id}
                    onClick={() => handleTestFlight(note.value)}
                    className="flex items-center gap-1.5 bg-black/50 border border-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold hover:border-[#d4af37] transition-all cursor-pointer"
                    title={`Click to fly ${note.label}`}
                  >
                    <span style={{ color: note.color }}>{note.label}</span>
                    <span className="text-white/60 text-[10px]">x</span>
                    <span className="bg-white/20 text-white text-[11px] px-1.5 py-0.2 rounded-full font-black">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-white/40 italic">Wallet is empty ($0K)</span>
              )}
            </div>
          </div>

          {/* SECTION HEADER & FILTER TABS */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[#d4af37]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Official Reserve Notes (All 10 Denominations)
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    filter === 'ALL'
                      ? 'bg-[#d4af37] text-black shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  All (10)
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('MILLION')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    filter === 'MILLION'
                      ? 'bg-[#d4af37] text-black shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  $1M+ (4)
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('THOUSAND')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    filter === 'THOUSAND'
                      ? 'bg-[#d4af37] text-black shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  $5K–$500K (6)
                </button>
              </div>
            </div>

            {/* CURRENCY NOTE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map(note => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(isSelected ? null : note)}
                    className={`group bg-[#112a22]/80 hover:bg-[#14352b] border rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col gap-2.5 relative overflow-hidden ${
                      isSelected 
                        ? 'border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-[1.01]' 
                        : 'border-white/10 hover:border-[#d4af37]/60'
                    }`}
                  >
                    {/* Top note header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: note.color }}
                        ></span>
                        <span className="text-xs font-black uppercase tracking-wide text-white truncate" title={note.title}>
                          {note.title}
                        </span>
                      </div>
                      <span 
                        className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-black/40 border border-white/10 shrink-0"
                        style={{ color: note.color }}
                      >
                        {note.label}
                      </span>
                    </div>

                    {/* Note Image Preview */}
                    <div className="w-full aspect-[2/1] rounded-xl overflow-hidden bg-black/40 border border-white/10 relative group-hover:border-[#d4af37]/50 transition-colors">
                      <img 
                        src={note.image} 
                        alt={note.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-between">
                        <span className="text-[10px] text-white/90 font-mono font-bold flex items-center gap-1">
                          <Eye size={12} /> Inspect
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestFlight(note.value);
                          }}
                          className="px-2 py-0.5 bg-[#d4af37] hover:bg-[#FFE885] text-black text-[10px] font-black uppercase rounded shadow-sm"
                        >
                          Fly
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[10px] text-white/60 leading-tight font-sans line-clamp-2">
                      {note.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LARGE INSPECT MODAL OVERLAY (IF NOTE SELECTED) */}
          {selectedNote && (
            <div className="bg-black/70 border border-[#d4af37] rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black uppercase tracking-widest text-[#FFE885]">
                  High-Resolution Note Inspection: {selectedNote.title} ({selectedNote.label})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="text-white/60 hover:text-white text-xs font-bold uppercase cursor-pointer"
                >
                  ✕ Close Preview
                </button>
              </div>

              <div className="w-full max-w-xl aspect-[2/1] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                <img 
                  src={selectedNote.image} 
                  alt={selectedNote.title} 
                  className="w-full h-full object-contain bg-black"
                />
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => handleTestFlight(selectedNote.value)}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#FFE885] text-black text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={12} />
                  <span>Fly This {selectedNote.label} Note</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER - PINNED */}
        <div className="shrink-0 bg-[#081511] border-t border-white/10 px-6 py-3.5 flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">
            WALLET POSITION: UNDER 'LOCK THE DEAL'
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Wallet
          </button>
        </div>

      </div>
    </div>
  );
}
