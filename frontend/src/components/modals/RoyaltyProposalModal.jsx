import React from 'react';
import { Handshake } from 'lucide-react';

const RoyaltyProposalModal = ({ proposal, onClose, sendAction }) => {
  if (!proposal) return null;

  const handleAccept = () => {
    sendAction('accept_royalty_agreement', proposal);
    onClose();
  };

  const handleReject = () => {
    sendAction('reject_royalty_agreement', { proposerId: proposal.proposerId, proposal });
    onClose();
  };

  const cashVal = Number(proposal.cash) || 0;
  const equityVal = Number(proposal.equity) || 0;
  const royaltyVal = Number(proposal.royalty || proposal.percentage) || 0;
  const loanVal = Number(proposal.loan) || 0;

  const modalTitle = 
    equityVal > 0 && royaltyVal === 0 && loanVal === 0 ? 'Equity Proposal' :
    loanVal > 0 && equityVal === 0 && royaltyVal === 0 ? 'Loan Proposal' :
    royaltyVal > 0 && equityVal === 0 && loanVal === 0 ? 'Royalty Proposal' :
    'Deal Proposal';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4 font-sans select-none">
      <div className="w-[400px] bg-[#0a1914] border border-[#ffb055]/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,176,85,0.2)] flex flex-col gap-6 relative">
        
        <div className="text-center">
          <Handshake className="w-12 h-12 text-[#ffb055] mx-auto mb-2" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">
            {modalTitle}
          </h2>
          <p className="text-sm text-white/80">
            <strong className="text-[#ffb055]">{proposal.proposerName || proposal.proposer}</strong> wants to lock in a deal:
          </p>
        </div>

        <div className="bg-[#112a22] rounded-lg p-4 flex flex-col gap-3">
          {proposal.companyName && (
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Company</span>
              <span className="text-[#55ffb0] font-bold">{proposal.companyName}</span>
            </div>
          )}
          {cashVal > 0 && (
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Investment</span>
              <span className="text-[#55ffb0] font-black text-base">${cashVal >= 10 ? `${cashVal}K` : `${cashVal}M`}</span>
            </div>
          )}
          {equityVal > 0 && (
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Equity Share</span>
              <span className="text-[#55ffb0] font-black text-base">{equityVal}%</span>
            </div>
          )}
          {royaltyVal > 0 && (
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Royalty Cut</span>
              <span className="text-[#ffb055] font-black text-base">{royaltyVal}%</span>
            </div>
          )}
          {loanVal > 0 && (
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs text-white/50 uppercase tracking-widest">Loan Amount</span>
              <span className="text-yellow-400 font-black text-base">${loanVal >= 10 ? `${loanVal}K` : `${loanVal}M`}</span>
            </div>
          )}
          {proposal.terms && (
            <div className="flex flex-col gap-1 text-left pt-1">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Terms</span>
              <span className="text-white/80 text-xs italic">{proposal.terms}</span>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleReject}
            className="flex-1 py-3 bg-transparent border border-red-500/50 text-red-500 font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Reject
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 py-3 bg-[#55ffb0] text-black font-black uppercase tracking-widest rounded-lg hover:bg-[#43d995] transition-colors"
          >
            Accept
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoyaltyProposalModal;
