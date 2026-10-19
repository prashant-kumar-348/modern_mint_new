import React from 'react';
import { Crown, Trophy, DollarSign, Building2, CreditCard, ArrowLeft, Award, Sparkles } from 'lucide-react';

export default function GameOverModal({ gameState, roomId }) {
  if (!gameState || !gameState.isFinished) return null;

  const scores = gameState.finalScores || [];
  const winners = gameState.winners || [];
  const maxRounds = gameState.mode === 'short' || gameState.mode === 'quick' ? 6 : 9;

  const handleReturnToLobby = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-500 font-sans select-none pointer-events-auto">
      <div className="relative w-full max-w-4xl bg-[#0a1914] rounded-2xl shadow-[0_0_80px_rgba(85,255,176,0.18)] border-2 border-[#1c4d3d] flex flex-col items-center p-5 sm:p-8 max-h-[92vh] overflow-y-auto hide-scrollbar">
        
        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#55ffb011_1px,transparent_1px),linear-gradient(to_bottom,#55ffb011_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none rounded-2xl"></div>

        {/* Crown Badge */}
        <div className="relative z-10 w-20 h-20 mb-3 flex items-center justify-center rounded-full bg-gradient-to-b from-[#112a20] to-[#081510] border-2 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.45)]">
          <Crown className="w-10 h-10 text-[#FFC240] drop-shadow-md" />
        </div>

        {/* Modern Mint Tagline */}
        <span className="relative z-10 text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#d4af37] font-extrabold font-mono text-center">
          Modern Mint Strategy Co. • Arena Standings
        </span>

        {/* Header */}
        <h1 className="relative z-10 text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.2em] text-center mt-1 drop-shadow-md">
          Game Over — Round {maxRounds} Complete
        </h1>

        <p className="relative z-10 text-xs text-[#a4d8c2] text-center font-mono tracking-widest mt-1 mb-6">
          Final Net Values authoritatively evaluated according to official rulebook formulas.
        </p>

        {/* WINNERS SHOWCASE */}
        {winners.length > 0 && (
          <div className="relative z-10 w-full mb-6">
            <div className={`grid gap-4 ${winners.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
              {winners.map((winner, idx) => {
                const isInvestorWinner = winner.isInvestorWinner;
                const title = isInvestorWinner ? 'Top Investor Champion' : (winners.length === 2 ? 'Top Founder Champion' : 'Grand Champion');
                return (
                  <div
                    key={winner.id || idx}
                    className="relative bg-gradient-to-b from-[#16382a] to-[#0a1914] border-2 border-[#d4af37] rounded-xl p-5 shadow-[0_0_30px_rgba(212,175,55,0.3)] flex flex-col items-center text-center overflow-hidden"
                  >
                    <div className="absolute top-2 right-2">
                      <Sparkles className="w-5 h-5 text-[#FFC240] opacity-80" />
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center mb-2">
                      <Award className="w-5 h-5 text-[#FFC240]" />
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#d4af37] font-bold">
                      {title}
                    </span>

                    <h3 className="text-xl font-black text-white uppercase tracking-wider mt-1 mb-2">
                      {winner.name}
                    </h3>

                    <div className="flex items-center gap-1.5 bg-black/40 border border-[#d4af37]/40 px-4 py-1.5 rounded-full mt-1">
                      <span className="text-xs uppercase tracking-widest text-[#a4d8c2] font-semibold">Net Value:</span>
                      <span className="text-lg font-mono font-black text-[#FFC240]">${winner.netValue}K</span>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-[11px] text-gray-300 font-mono mt-3">
                      <span>Cash: <strong className="text-white">${winner.cash}K</strong></span>
                      <span>•</span>
                      <span>Equity: <strong className="text-white">${winner.equityValuation}K</strong></span>
                      <span>•</span>
                      <span>Debt: <strong className="text-red-400">${winner.loans}K</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FULL LEADERBOARD TABLE */}
        <div className="relative z-10 w-full mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37] flex items-center gap-1.5 font-mono">
              <Trophy className="w-4 h-4 text-[#d4af37]" />
              Official Net Value Scoreboard
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">
              Net Value = Equity Valuation + Cash - Loans
            </span>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-[#1c4d3d] bg-black/60 shadow-inner">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1c4d3d] bg-[#112a20]/80 text-[#a4d8c2] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 sm:px-4 text-center">Rank</th>
                  <th className="py-3 px-3 sm:px-4">Player</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Role</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Cash</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Portfolio Equity</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Total Debt</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c4d3d]/50">
                {scores.map((player) => {
                  const isWinner = player.isFounderWinner || player.isInvestorWinner;
                  return (
                    <tr
                      key={player.id}
                      className={`transition-colors ${
                        isWinner ? 'bg-[#d4af37]/10 hover:bg-[#d4af37]/15' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            player.rank === 1
                              ? 'bg-[#d4af37] text-black shadow-md'
                              : player.rank === 2
                              ? 'bg-gray-300 text-black'
                              : player.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {player.rank}
                        </span>
                      </td>

                      {/* Player Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: player.color || '#55ffb0' }}
                          />
                          <span className="font-bold text-white uppercase tracking-wider">
                            {player.name}
                          </span>
                          {isWinner && (
                            <Crown className="w-3.5 h-3.5 text-[#FFC240] flex-shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            player.role === 'Investor'
                              ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/30'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {player.role}
                        </span>
                      </td>

                      {/* Cash */}
                      <td className="py-3 px-3 sm:px-4 text-right text-emerald-400 font-bold">
                        ${player.cash}K
                      </td>

                      {/* Equity */}
                      <td className="py-3 px-3 sm:px-4 text-right text-cyan-300">
                        ${player.equityValuation}K
                      </td>

                      {/* Debt */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        {player.loans > 0 ? (
                          <span className="text-rose-400">-${player.loans}K</span>
                        ) : (
                          <span className="text-gray-500">$0</span>
                        )}
                      </td>

                      {/* Net Value */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <span className="font-black text-sm text-[#FFC240]">
                          ${player.netValue}K
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button: Return to Lobby */}
        <button
          onClick={handleReturnToLobby}
          className="relative z-10 w-full max-w-sm py-4 bg-gradient-to-r from-[#2A7553] via-[#1c4d3d] to-[#2A7553] hover:from-[#55ffb0] hover:via-[#2A7553] hover:to-[#55ffb0] hover:text-black text-white font-black uppercase tracking-[0.25em] text-xs rounded-xl shadow-[0_0_30px_rgba(85,255,176,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Lobby
        </button>

      </div>
    </div>
  );
}
