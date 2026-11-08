import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, Layers, Check, X, ChevronLeft, ChevronRight, Building2, Handshake, FileText } from 'lucide-react';

const ALL_COMPANIES = [
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

const COMPANY_ICONS = {
  'CONTRACT FARMING': '/mat-icons/mat-icon-contract-farming.png',
  'AGRI IoT': '/mat-icons/mat-icon-agri-iot.png',
  'WALLET': '/mat-icons/mat-icon-wallet.png',
  'SNACKS': '/mat-icons/mat-icon-snacks.png',
  'QUICK COMMERCE': '/mat-icons/mat-icon-quick-commerce.png',
  'SMART STORAGE': '/mat-icons/mat-icon-smart-storage.png',
  'RESTRO - CHAIN': '/mat-icons/mat-icon-restro-chain.png',
  'TRACEABILITY': '/mat-icons/mat-icon-traceability.png',
  'ROBO - PACKAGING': '/mat-icons/mat-icon-robo-packaging.png'
};

export default function DealSheetModal({ 
  onClose, 
  onSubmitDeal, 
  targetName, 
  opponents = [], 
  readOnly = false, 
  deals = [],
  username = '',
  ownedCompanies = [],
  targetPlayer = null,
  localPlayer = null
}) {
  const isViewMode = readOnly;

  // Determine selectable companies for proposing deals
  const selectableCompanies = useMemo(() => {
    const isFounder = (localPlayer?.role || '').toLowerCase() === 'founder';
    if (isFounder && ownedCompanies && ownedCompanies.length > 0) {
      return ownedCompanies.map(c => c.name);
    }
    if (!isFounder && targetPlayer?.ownedCompanies && targetPlayer.ownedCompanies.length > 0) {
      return targetPlayer.ownedCompanies.map(c => c.name);
    }
    return ALL_COMPANIES;
  }, [localPlayer, ownedCompanies, targetPlayer]);

  // Group deals into Company Sheets for View Mode
  const companySheetMap = useMemo(() => {
    if (!isViewMode) return {};
    const map = {};

    // 1. Add all launched companies owned by local player first
    (ownedCompanies || []).forEach(comp => {
      const cName = comp.name?.toUpperCase().trim();
      if (cName) {
        map[cName] = {
          companyName: comp.name,
          companyInfo: comp,
          deals: []
        };
      }
    });

    // 2. Group all player deals into the respective company sheet
    (deals || []).forEach(deal => {
      let rawName = (deal.companyName || '').trim();
      let canonicalName = ALL_COMPANIES.find(c => 
        c.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === rawName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      ) || ALL_COMPANIES.find(c => c.toLowerCase() === rawName.toLowerCase()) || rawName;

      if (!canonicalName) {
        if (ownedCompanies && ownedCompanies.length === 1) {
          canonicalName = ownedCompanies[0].name;
        } else {
          canonicalName = 'General Portfolio';
        }
      }

      const key = canonicalName.toUpperCase().trim();
      if (!map[key]) {
        map[key] = {
          companyName: canonicalName,
          companyInfo: (ownedCompanies || []).find(c => c.name?.toUpperCase().trim() === key) || null,
          deals: []
        };
      }
      map[key].deals.push(deal);
    });

    return map;
  }, [isViewMode, deals, ownedCompanies]);

  const companyKeys = useMemo(() => {
    const keys = Object.keys(companySheetMap);
    return keys.length > 0 ? keys : ['GENERAL PORTFOLIO'];
  }, [companySheetMap]);

  // Total sheets in view mode = number of company sheets; in proposal mode = number of opponents
  const totalSheets = isViewMode ? companyKeys.length : Math.max(1, opponents.length);

  // Initialize active sheet index (1-based)
  const [currentSheetIndex, setCurrentSheetIndex] = useState(() => {
    if (isViewMode) return 1;
    const idx = opponents.findIndex(p => p.name === targetName);
    return idx !== -1 ? idx + 1 : 1;
  });

  // Deal forms state for proposal mode (one form per opponent)
  const [dealForms, setDealForms] = useState(() => {
    if (isViewMode) return {};
    const initial = {};
    const defaultComp = selectableCompanies[0] || ALL_COMPANIES[0];

    opponents.forEach(p => {
      initial[p.name] = {
        companyName: defaultComp,
        cash: '', 
        equity: '', 
        loan: '', 
        royalty: '', 
        terms: '', 
        proposerSigned: false, 
        receiverSigned: false
      };
    });
    return initial;
  });

  const nextSheet = () => setCurrentSheetIndex(prev => Math.min(prev + 1, totalSheets));
  const prevSheet = () => setCurrentSheetIndex(prev => Math.max(prev - 1, 1));

  // Active Proposal Opponent / Active Form
  let currentOpponent = null;
  let activeForm = {};

  if (!isViewMode) {
    currentOpponent = opponents[currentSheetIndex - 1] || { name: targetName || 'Partner' };
    activeForm = dealForms[currentOpponent.name] || {
      companyName: selectableCompanies[0] || ALL_COMPANIES[0],
      cash: '', equity: '', loan: '', royalty: '', terms: '', proposerSigned: false, receiverSigned: false
    };
  }

  const updateField = (field, value) => {
    if (isViewMode || !currentOpponent) return;
    setDealForms(prev => ({
      ...prev,
      [currentOpponent.name]: {
        ...prev[currentOpponent.name],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) {
      onClose();
      return;
    }
    if (!activeForm.proposerSigned) {
      alert("Please sign your Proposer Signature before offering the deal!");
      return;
    }
    const hasValue = (Number(activeForm.cash) || 0) > 0 ||
                     (Number(activeForm.equity) || 0) > 0 ||
                     (Number(activeForm.loan) || 0) > 0 ||
                     (Number(activeForm.royalty) || 0) > 0 ||
                     Boolean(activeForm.terms && activeForm.terms.trim());
    if (!hasValue) {
      alert("Please specify at least one deal term (Cash, Equity, Loan, Royalty, or Conditions)!");
      return;
    }
    if (onSubmitDeal && currentOpponent) {
      onSubmitDeal(activeForm, currentOpponent.name);
    } else {
      onClose();
    }
  };

  // Current company sheet in View Mode
  const activeCompanyKey = companyKeys[Math.min(currentSheetIndex - 1, companyKeys.length - 1)];
  const currentCompanySheet = companySheetMap[activeCompanyKey] || {
    companyName: activeCompanyKey,
    companyInfo: null,
    deals: []
  };

  const companyIcon = COMPANY_ICONS[currentCompanySheet.companyName] || '/mat-icons/mat-icon-wallet.png';

  // Calculate aggregates for current company sheet
  const companyAggregates = useMemo(() => {
    if (!isViewMode || !currentCompanySheet.deals) {
      return { totalCash: 0, totalEquity: 0, totalRoyalty: 0, totalLoan: 0, count: 0 };
    }
    let totalCash = 0;
    let totalEquity = 0;
    let totalRoyalty = 0;
    let totalLoan = 0;

    currentCompanySheet.deals.forEach(d => {
      if (d.status === 'accepted' || !d.status) {
        totalCash += (Number(d.cash) || 0);
        totalEquity += (Number(d.equity) || 0);
        totalRoyalty += (Number(d.royalty) || 0);
        totalLoan += (Number(d.loan) || 0);
      }
    });

    return {
      totalCash,
      totalEquity,
      totalRoyalty,
      totalLoan,
      count: currentCompanySheet.deals.length
    };
  }, [isViewMode, currentCompanySheet]);

  return (
    <div className="flex items-center justify-center w-full relative pointer-events-auto font-sans select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* LEFT ARROW NAVIGATION */}
      <button 
        type="button"
        onClick={prevSheet}
        disabled={currentSheetIndex === 1}
        className="hidden sm:flex absolute -left-16 text-white hover:text-[#d4af37] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer p-2 z-20"
        title="Previous Sheet"
      >
        <ChevronLeft size={44} />
      </button>

      {/* MAIN DEAL SHEET CONTAINER */}
      <div className="bg-[#FAF8F5] text-gray-900 max-w-2xl w-full max-h-[92vh] overflow-y-auto hide-scrollbar rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] p-5 sm:p-7 relative border-t-8 border-[#d4af37] border-b-4 border-x border-gray-300">
        
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-black transition-colors cursor-pointer z-20"
        >
          <X size={20} />
        </button>

        {/* Sheet Counter */}
        <div className="absolute top-4 left-4 text-[11px] font-black text-gray-400 font-mono tracking-widest select-none">
          {isViewMode ? `COMPANY SHEET ${currentSheetIndex} / ${totalSheets}` : `OPPONENT ${currentSheetIndex} / ${totalSheets}`}
        </div>

        {/* VIEW MODE: COMPANY TABS */}
        {isViewMode && companyKeys.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mt-7 mb-2 border-b border-gray-200">
            {companyKeys.map((cKey, idx) => {
              const sheetData = companySheetMap[cKey];
              const isActive = idx === (currentSheetIndex - 1);
              const dealCount = sheetData?.deals?.length || 0;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setCurrentSheetIndex(idx + 1)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#d4af37] text-black shadow-md scale-105' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <span>{sheetData?.companyName || cKey}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-black/20 text-black' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {dealCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* DOCUMENT HEADER */}
        <div className={`text-center mb-4 ${isViewMode && companyKeys.length > 1 ? 'mt-2' : 'mt-5'}`}>
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#d4af37] font-black font-mono">Modern Mint Strategy Co.</span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 mt-0.5 uppercase">
            {isViewMode ? 'OFFICIAL COMPANY DEAL SHEET' : 'OFFICIAL DEAL PROPOSAL'}
          </h3>

          {/* VIEW MODE: COMPANY BRANDING PILL */}
          {isViewMode ? (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="bg-[#FFF2D8] border border-[#d4af37] px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <img 
                  src={companyIcon} 
                  alt={currentCompanySheet.companyName} 
                  className="w-6 h-6 rounded-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="font-black text-xs sm:text-sm text-[#4A1720] uppercase tracking-wide">
                  {currentCompanySheet.companyName}
                </span>
                {currentCompanySheet.companyInfo && (
                  <span className="bg-[#d4af37] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full ml-1">
                    Stage {currentCompanySheet.companyInfo.stage || 'L'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            currentOpponent && (
              <div className="text-xs font-bold bg-gray-100 text-gray-700 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full mt-2 uppercase tracking-widest border border-gray-200">
                <Handshake size={14} className="text-[#d4af37]" />
                <span>NEGOTIATING WITH: <strong className="text-black">{currentOpponent.name}</strong></span>
              </div>
            )
          )}

          <div className="w-16 h-1 bg-[#d4af37] mx-auto mt-3"></div>
        </div>

        {/* ============================================================== */}
        {/* VIEW MODE: COMPANY-CENTRIC DEAL LEDGER & ACCUMULATED DEALS */}
        {/* ============================================================== */}
        {isViewMode ? (
          <div className="space-y-4">
            
            {/* COMPANY AGGREGATE SUMMARY STRIP */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider">Total Deals</span>
                <span className="text-base font-black text-gray-900 font-mono">{companyAggregates.count}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <span className="text-[9px] font-bold text-emerald-700 uppercase block tracking-wider">Total Cash Raised</span>
                <span className="text-base font-black text-emerald-800 font-mono">${companyAggregates.totalCash}K</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <span className="text-[9px] font-bold text-amber-700 uppercase block tracking-wider">Total Equity Given</span>
                <span className="text-base font-black text-amber-800 font-mono">{companyAggregates.totalEquity}%</span>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <span className="text-[9px] font-bold text-blue-700 uppercase block tracking-wider">Royalty / Loans</span>
                <span className="text-xs font-black text-blue-800 font-mono">
                  {companyAggregates.totalRoyalty}% / ${companyAggregates.totalLoan}K
                </span>
              </div>
            </div>

            {/* LIST OF ALL DEALS FOR THIS SINGLE COMPANY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase text-gray-600 tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-[#d4af37]" />
                  <span>Deals Recorded For {currentCompanySheet.companyName}</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-gray-400">
                  {currentCompanySheet.deals.length} Recorded
                </span>
              </div>

              {currentCompanySheet.deals.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <Building2 size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                    No Deals Recorded for this Company Yet
                  </p>
                  <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                    During Phase 1 (Fundraise & Bank Loans), pitch to investors or founders using 'Offer a Deal' to raise capital and record agreements here.
                  </p>
                </div>
              ) : (
                currentCompanySheet.deals.map((deal, idx) => {
                  const partnerName = ((deal.proposer || '').toLowerCase() === (username || '').toLowerCase())
                    ? (deal.partner || deal.partnerName || deal.investorName || deal.founderName)
                    : (deal.proposer || deal.proposerName || deal.founderName || deal.investorName);
                  const isAccepted = deal.status === 'accepted';
                  const isRejected = deal.status === 'rejected';

                  return (
                    <div 
                      key={deal.id || idx}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Top Bar: Deal # & Partner & Status */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-mono font-black px-2 py-0.5 rounded">
                            DEAL #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            Partner: <strong className="text-black uppercase">{partnerName || 'Investor'}</strong>
                          </span>
                        </div>

                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm text-white ${
                          isAccepted ? 'bg-emerald-600' : isRejected ? 'bg-rose-600' : 'bg-amber-600'
                        }`}>
                          {deal.status || 'Accepted'}
                        </span>
                      </div>

                      {/* Deal Values Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Cash Raised</span>
                          <span className="text-sm font-black text-gray-900 font-mono">
                            ${deal.cash || 0}K
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Equity</span>
                          <span className="text-sm font-black text-gray-900 font-mono">
                            {deal.equity || 0}%
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Royalty</span>
                          <span className="text-sm font-black text-gray-900 font-mono">
                            {deal.royalty || 0}%
                          </span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-[9px] font-bold text-gray-400 uppercase block">Debt Loan</span>
                          <span className="text-sm font-black text-gray-900 font-mono">
                            ${deal.loan || 0}K
                          </span>
                        </div>
                      </div>

                      {/* Additional Terms */}
                      {deal.terms && (
                        <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-2.5 mb-3 text-xs text-amber-950 font-serif italic">
                          "{deal.terms}"
                        </div>
                      )}

                      {/* Signatures Row */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-[10px]">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <Check size={14} className="text-emerald-600" />
                          <span>Proposer: {deal.proposer || deal.proposerName || deal.founderName || 'Signed'}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 font-bold">
                          {isAccepted ? (
                            <span className="flex items-center gap-1.5 text-emerald-700">
                              <Check size={14} className="text-emerald-600" />
                              <span>Opponent: {deal.partner || deal.partnerName || deal.investorName || 'Signed'}</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">
                              Awaiting opponent signature
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Navigation & Close */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={prevSheet} 
                  disabled={currentSheetIndex === 1}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs font-bold uppercase transition-colors"
                >
                  Prev Company
                </button>
                <button 
                  type="button" 
                  onClick={nextSheet} 
                  disabled={currentSheetIndex === totalSheets}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs font-bold uppercase transition-colors"
                >
                  Next Company
                </button>
              </div>

              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2 bg-gradient-to-r from-[#d4af37] to-[#c59b27] hover:from-[#FFE885] hover:to-[#d4af37] text-black font-black text-xs uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer"
              >
                Close Sheet
              </button>
            </div>

          </div>
        ) : (
          /* ============================================================== */
          /* PROPOSAL MODE: FORM WITH EXPLICIT COMPANY SELECTION */
          /* ============================================================== */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* COMPANY SELECTION FIELD */}
            <div>
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1">
                Select Company For This Deal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <select
                  value={activeForm.companyName || selectableCompanies[0] || ALL_COMPANIES[0]}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="pl-8 pr-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-xs md:text-sm w-full outline-none focus:border-[#d4af37] font-black text-[#4A1720] uppercase shadow-sm cursor-pointer"
                >
                  {selectableCompanies.map(cName => (
                    <option key={cName} value={cName}>
                      {cName}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                All agreements and investment terms will be recorded on the official sheet for this company.
              </p>
            </div>

            {/* Financial Terms Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Cash Consideration ($K)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    step="5" 
                    min="0" 
                    value={activeForm.cash} 
                    onChange={(e) => updateField('cash', e.target.value)} 
                    className="pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm w-full outline-none focus:border-[#d4af37] font-mono font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Equity Shares (%)</label>
                <div className="relative">
                  <Percent size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    max="100" 
                    value={activeForm.equity} 
                    onChange={(e) => updateField('equity', e.target.value)} 
                    className="pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm w-full outline-none focus:border-[#d4af37] font-mono font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Assumed Debt Loan ($K)</label>
                <div className="relative">
                  <Layers size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    step="5" 
                    min="0" 
                    value={activeForm.loan} 
                    onChange={(e) => updateField('loan', e.target.value)} 
                    className="pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm w-full outline-none focus:border-[#d4af37] font-mono font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Royalty Commitment (%)</label>
                <div className="relative">
                  <Percent size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    min="0" 
                    max="100" 
                    value={activeForm.royalty} 
                    onChange={(e) => updateField('royalty', e.target.value)} 
                    className="pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm w-full outline-none focus:border-[#d4af37] font-mono font-bold" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Additional Terms & Conditions</label>
              <textarea 
                rows="2" 
                placeholder="Enter strategic agreements, merger covenants, or debt repayment terms..." 
                value={activeForm.terms} 
                onChange={(e) => updateField('terms', e.target.value)} 
                className="p-3 bg-white border border-gray-300 rounded-lg text-xs w-full resize-none outline-none focus:border-[#d4af37] font-sans"
              />
            </div>

            {/* SIGNATURES BLOCK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-y border-gray-200 my-3">
              {/* Proposer Signature */}
              <div 
                onClick={() => updateField('proposerSigned', !activeForm.proposerSigned)} 
                className={`border-2 border-dashed rounded-lg p-3 text-center transition-all select-none cursor-pointer ${
                  activeForm.proposerSigned 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-500'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {activeForm.proposerSigned ? (
                    <div className="p-1 bg-emerald-500 text-white rounded-full"><Check size={14} /></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs uppercase font-mono">
                      {username ? username.substring(0, 2).toUpperCase() : 'ME'}
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-black uppercase">Proposer Signature</div>
                <div className="text-[9px] mt-0.5 font-mono italic">
                  {activeForm.proposerSigned ? 'Signed digitally' : 'Click to Sign'}
                </div>
              </div>

              {/* Opponent Signature */}
              <div 
                className="border-2 border-dashed border-gray-300 bg-gray-100 text-gray-500 rounded-lg p-3 text-center transition-all select-none opacity-90 cursor-not-allowed"
                title="The opponent will sign upon reviewing your offer"
              >
                <div className="flex justify-center mb-1">
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs uppercase font-mono">
                    {currentOpponent ? currentOpponent.name.substring(0, 2).toUpperCase() : 'OP'}
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase text-gray-600">Opponent Signature</div>
                <div className="text-[9px] mt-0.5 font-mono italic text-amber-700 font-medium">
                  Awaiting opponent signature
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <div className="flex sm:hidden justify-between items-center mb-2 px-2">
                <button type="button" onClick={prevSheet} disabled={currentSheetIndex === 1} className="p-2 bg-gray-100 rounded disabled:opacity-50"><ChevronLeft size={16}/></button>
                <span className="text-xs font-bold text-gray-400 font-mono">Opponent {currentSheetIndex} of {totalSheets}</span>
                <button type="button" onClick={nextSheet} disabled={currentSheetIndex === totalSheets} className="p-2 bg-gray-100 rounded disabled:opacity-50"><ChevronRight size={16}/></button>
              </div>
              
              <div className="flex w-full sm:w-auto gap-3 ml-auto">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-2 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#FFE885] to-[#c59b27] hover:from-[#FFE885] hover:to-[#d4af37] text-black rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  OFFER DEAL ({activeForm.companyName || selectableCompanies[0]})
                </button>
              </div>
            </div>

          </form>
        )}

      </div>

      {/* RIGHT ARROW NAVIGATION */}
      <button 
        type="button"
        onClick={nextSheet}
        disabled={currentSheetIndex === totalSheets}
        className="hidden sm:flex absolute -right-16 text-white hover:text-[#d4af37] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer p-2 z-20"
        title="Next Sheet"
      >
        <ChevronRight size={44} />
      </button>

    </div>
  );
}
