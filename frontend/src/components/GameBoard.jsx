import React, { useState, useEffect } from 'react';
import { ref, set } from "firebase/database";
import { db } from '../firebase';
import {
  Coins,
  Truck,
  Cpu,
  Users,
  X,
  ShieldAlert,
  Landmark,
  Crown,
  Mic,
  Send,
  Search,
  FileText,
  Activity,
  Share2
} from 'lucide-react';

import BankLoanModal from './modals/BankLoanModal';
import DealSheetModal from './modals/DealSheetModal';
import MentorCardModal from './modals/MentorCardModal';
import MentorInventoryModal from './modals/MentorInventoryModal';
import PersonaSelectModal from './modals/PersonaSelectModal';
import PlayerMatModal from './modals/PlayerMatModal';
import SelfPortfolioModal from './modals/SelfPortfolioModal';
import TransferCashModal from './modals/TransferCashModal';
import MiddleBoard from './board/MiddleBoard';
import { GameProvider } from '../context/GameContext';
import { useMultiplayer } from '../hooks/useMultiplayer';
import Lobby from './Lobby';
import VoiceChatManager from './VoiceChatManager';
import Phase2Dashboard from './board/Phase2Dashboard';
import Phase2Manager from './board/Phase2Manager';
import ActionTrackerTray from './dashboard/ActionTrackerTray';
import Phase3DiceModal from './modals/Phase3DiceModal';
import BankruptcyModal from './modals/BankruptcyModal';
import FormalizeDealModal from './modals/FormalizeDealModal';
import RoyaltyProposalModal from './modals/RoyaltyProposalModal';
import RepayLoanModal from './modals/RepayLoanModal';
import PhaseTransitionOverlay from './board/PhaseTransitionOverlay';
import TutorialOverlay from './tutorial/TutorialOverlay';
import { TUTORIAL_STEPS } from './tutorial/tutorialData';
const safeSessionStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn("sessionStorage is blocked:", e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("sessionStorage is blocked:", e);
    }
  }
};

const getPlayerGradient = (color) => {
  if (color === '#ef4444') return 'from-[#571717] to-[#843040]';
  if (color === '#55ffb0') return 'from-[#112a20] to-[#1c4d3d]';
  if (color === '#d4af37') return 'from-[#2d2006] to-[#5e481b]';
  if (color === '#00e1ff') return 'from-[#072430] to-[#0e4e68]';
  return 'from-gray-800 to-gray-700';
};

const getPlayerPillStyle = (color, name = '') => {
  const c = String(color || '').toLowerCase();
  const n = String(name || '').toLowerCase();
  if (n.includes('ruthless') || c.includes('ef4444') || c.includes('843040') || c.includes('red') || c.includes('rn')) {
    return {
      backgroundImage: "url('/Rectangle-24.png')",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat'
    };
  }
  if (n.includes('robotic') || c.includes('55ffb0') || c.includes('teal') || c.includes('green') || c.includes('gt')) {
    return {
      backgroundImage: "url('/Rectangle-508.png')",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat'
    };
  }
  if (c.includes('d4af37') || c.includes('ffc240') || c.includes('gold') || c.includes('gd') || c.includes('yellow')) {
    return {
      background: 'linear-gradient(to right, #4a3412, #291c07)',
      border: '1px solid rgba(212, 175, 55, 0.4)'
    };
  }
  if (c.includes('00e1ff') || c.includes('blue') || c.includes('bl')) {
    return {
      background: 'linear-gradient(to right, #0d3446, #071d28)',
      border: '1px solid rgba(0, 225, 255, 0.4)'
    };
  }
  return {
    backgroundImage: "url('/Rectangle-508.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat'
  };
};

const getPlayerAvatarSrc = (player, idx = 0) => {
  if (player?.avatarId && AVATAR_IMAGE_BY_ID[player.avatarId]) {
    return AVATAR_IMAGE_BY_ID[player.avatarId];
  }
  const c = String(player?.color || '').toLowerCase();
  const n = String(player?.name || '').toLowerCase();
  if (n.includes('ruthless') || c.includes('ef4444') || c.includes('843040') || c.includes('red') || c.includes('rn')) {
    return '/avatar-ruthless.png';
  }
  if (n.includes('robotic') || c.includes('55ffb0') || c.includes('teal') || c.includes('green') || c.includes('gt')) {
    return '/avatar-robotic.png';
  }
  return `/player-avatar-${((idx % 4) + 1)}.png`;
};

const getCompanyShortName = (name) => {
  if (!name) return "";
  const upper = name.toUpperCase().trim();
  if (upper.includes("FARM") || upper.includes("CONTRACT")) return "CONTRACT FARMING";
  if (upper.includes("IOT") || upper.includes("AGRI")) return "AGRI IoT";
  if (upper.includes("WALLET")) return "WALLET";
  if (upper.includes("SNACK")) return "SNACKS";
  if (upper.includes("COMM") || upper.includes("QUICK")) return "QUICK COMMERCE";
  if (upper.includes("STOR")) return "SMART STORAGE";
  if (upper.includes("RESTRO") || upper.includes("CHAIN")) return "RESTRO - CHAIN";
  if (upper.includes("TRACE")) return "TRACEABILITY";
  if (upper.includes("ROBO") || upper.includes("PACK")) return "ROBO - PACKAGING";
  return name.toUpperCase();
};

const getLaunchedCompanyForMessage = (message) => {
  if (!message) return null;
  const msgUpper = message.toUpperCase();
  if (!msgUpper.includes("LAUNCHED")) return null;
  
  const baseCompanies = [
    { name: 'Wallet', icon: '/mat-icons/mat-icon-wallet.png', image: '/company-wallet.png' },
    { name: 'Quick Commerce', icon: '/mat-icons/mat-icon-quick-commerce.png', image: '/company-quick-commerce.png' },
    { name: 'Snacks', icon: '/mat-icons/mat-icon-snacks.png', image: '/company-snacks.png' },
    { name: 'Restro - Chain', icon: '/mat-icons/mat-icon-restro-chain.png', image: '/company-restro-chain.png' },
    { name: 'Contract Farming', icon: '/mat-icons/mat-icon-contract-farming.png', image: '/company-contract-farming.png' }, 
    { name: 'Agri IoT', icon: '/mat-icons/mat-icon-agri-iot.png', image: '/company-agri-iot.png' }, 
    { name: 'Smart Storage', icon: '/mat-icons/mat-icon-smart-storage.png', image: '/company-smart-storage.png' }, 
    { name: 'Robo - Packaging', icon: '/mat-icons/mat-icon-robo-packaging.png', image: '/company-robo-packaging.png' }, 
    { name: 'Traceability', icon: '/mat-icons/mat-icon-traceability.png', image: '/company-traceability.png' },
  ];

  const match = baseCompanies.find(comp => {
    const cleanCompName = comp.name.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanMsg = msgUpper.replace(/[^A-Z]/g, '');
    return cleanMsg.includes(cleanCompName);
  });
  
  return match || null;
};

const getCompanyLogoImage = (name) => {
  if (!name) return '/company-quick-commerce.png';
  const upper = name.toUpperCase().trim();
  if (upper.includes("FARM") || upper.includes("CONTRACT")) return '/company-contract-farming.png';
  if (upper.includes("IOT") || upper.includes("AGRI")) return '/company-agri-iot.png';
  if (upper.includes("WALLET")) return '/company-wallet.png';
  if (upper.includes("SNACK")) return '/company-snacks.png';
  if (upper.includes("COMM") || upper.includes("QUICK")) return '/company-quick-commerce.png';
  if (upper.includes("STOR")) return '/company-smart-storage.png';
  if (upper.includes("RESTRO") || upper.includes("CHAIN")) return '/company-restro-chain.png';
  if (upper.includes("TRACE")) return '/company-traceability.png';
  if (upper.includes("ROBO") || upper.includes("PACK")) return '/company-robo-packaging.png';
  return '/company-quick-commerce.png';
};

export const getStageTokenImage = (stage, playerIdx = 0, playerColor = null) => {
  const stageMap = {
    'L': 'L', '0': 'L', 0: 'L',
    'R': 'R', '1': 'R', 1: 'R',
    'G': 'G', '2': 'G', 2: 'G',
    'S': 'S', '3': 'S', 3: 'S',
    'Launch': 'L', 'LAUNCH': 'L',
    'Retain': 'R', 'RETAIN': 'R',
    'Grow': 'G', 'GROW': 'G',
    'Scale': 'S', 'SCALE': 'S'
  };
  const letter = stageMap[stage] || 'L';
  let type = ((playerIdx % 4) + 1);
  if (playerColor) {
    const c = String(playerColor).toLowerCase();
    if (c.includes('ef4444') || c.includes('843040') || c.includes('red') || c.includes('rn')) type = 1;
    else if (c.includes('55ffb0') || c.includes('36646c') || c.includes('teal') || c.includes('green') || c.includes('gt')) type = 2;
    else if (c.includes('535252') || c.includes('00e1ff') || c.includes('charcoal') || c.includes('blue') || c.includes('bl')) type = 3;
    else if (c.includes('ffc240') || c.includes('d4af37') || c.includes('gold') || c.includes('gd') || c.includes('yellow')) type = 4;
  }
  return `/stage-tokens/stage-${type}-${letter}.png`;
};

export const getTeamTokenCoinImage = (teamLevel) => {
  const lvl = Number(teamLevel);
  if (lvl === 3) return '/team-token-3-coin.png';
  if (lvl === 4) return '/team-token-4-coin.png';
  return '/team-token-2-coin.png';
};

const AVATAR_IMAGE_BY_ID = {
  1: 'https://modernmintgame.com/cdn/shop/files/01.png?v=1772091663&width=2000',
  2: 'https://modernmintgame.com/cdn/shop/files/03.png?v=1772091662&width=2000',
  3: 'https://modernmintgame.com/cdn/shop/files/02.png?v=1772091663&width=2000',
  4: 'https://modernmintgame.com/cdn/shop/files/05.png?v=1772091663&width=2000',
  5: 'https://modernmintgame.com/cdn/shop/files/04.png?v=1772091663&width=2000',
  6: 'https://modernmintgame.com/cdn/shop/files/06.png?v=1772091663&width=2000',
};

function GameBoard({ roomId: propRoomId, username: propUsername, role: propRole, avatarId }) {
  const [activeModal, setActiveModal] = useState(null); 
  const [isHoverOpenedMat, setIsHoverOpenedMat] = useState(false);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(true);
  const [isPlayingTutorial, setIsPlayingTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(1);
  // 'deal', 'topup', 'mentor', 'team_action', 'pe_fund', 'phaseEnd'
  const [activeTopPanel, setActiveTopPanel] = useState(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [isBankrupt, setIsBankrupt] = useState(false);
  const [royaltyProposal, setRoyaltyProposal] = useState(null);

  // Responsive Desktop Scaling (Letterboxed)
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const baseWidth = 1920;
      const baseHeight = 1080;
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const [isTalking, setIsTalking] = useState(false);
  const [dealTarget, setDealTarget] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [isActionTrayOpen, setIsActionTrayOpen] = useState(true);

  const [launchedCompanies, setLaunchedCompanies] = useState({
    1: { launched: true, logo: '/mat-icons/mat-icon-contract-farming.png', stage: 'L', teamColor: 'from-gray-300 to-gray-500' },
    2: { launched: true, logo: '/mat-icons/mat-icon-agri-iot.png', stage: 'G', teamColor: 'from-yellow-600 to-yellow-800' },
    3: { launched: false, logo: '/mat-icons/mat-icon-smart-storage.png', stage: 'L', teamColor: 'from-[#b87333] to-[#8c5220]' },
    4: { launched: false, logo: '/mat-icons/mat-icon-quick-commerce.png', stage: 'S', teamColor: 'from-blue-400 to-blue-600' }
  });

  const [roomId, setRoomId] = useState(propRoomId);
  const [username, setUsername] = useState(propUsername);
  const [role, setRole] = useState(propRole || 'Founder');

  console.log("App Render Context:", { roomId, username, search: window.location.search });

  // Keep URL in sync with roomId and remove username parameter to keep links shareable
  useEffect(() => {
    if (roomId) {
      const params = new URLSearchParams(window.location.search);
      let updated = false;
      if (params.get('room') !== roomId) {
        params.set('room', roomId);
        updated = true;
      }
      if (params.has('username')) {
        params.delete('username');
        updated = true;
      }
      if (updated) {
        const newUrl = `?${params.toString()}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    }
  }, [roomId]);

  const { gameState, notification: serverNotification, sendAction, socketId, drawnCard, clearDrawnCard, socket } = useMultiplayer(roomId, username, role, avatarId);
  const rawGamePhase = gameState?.phase || 1;
  const gameRound = gameState?.round || 1;

  const [activeSpeakers, setActiveSpeakers] = useState({});

  useEffect(() => {
    const handleVoiceState = (e) => {
      const { username: speakerName, isTalking: speakerTalking } = e.detail || {};
      if (speakerName) {
        setActiveSpeakers(prev => ({
          ...prev,
          [speakerName]: Boolean(speakerTalking)
        }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('voice_state_update', handleVoiceState);
      return () => window.removeEventListener('voice_state_update', handleVoiceState);
    }
  }, []);

  const currentTutorialStep = isPlayingTutorial && tutorialStepIndex > 0 && tutorialStepIndex <= TUTORIAL_STEPS.length 
    ? TUTORIAL_STEPS[tutorialStepIndex - 1] 
    : null;
  const tutorialVisualPhase = currentTutorialStep?.visualPhase || 1;
  const gamePhase = isPlayingTutorial ? tutorialVisualPhase : rawGamePhase;

  useEffect(() => {
    if (gamePhase !== 1 && isTalking) {
      setIsTalking(false);
    }
  }, [gamePhase, isTalking]);

  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [pendingNotification, setPendingNotification] = useState(null);

  useEffect(() => {
    if (serverNotification && serverNotification.show) {
      if (isDiceRolling) {
        setPendingNotification(serverNotification);
      } else {
        setNotification(serverNotification);
      }
    } else {
      setNotification({ show: false, message: '' });
    }
  }, [serverNotification, isDiceRolling]);

  useEffect(() => {
    const handleRollStart = () => {
      setIsDiceRolling(true);
    };
    const handleRollEnd = () => {
      setIsDiceRolling(false);
      setPendingNotification(prev => {
        if (prev) {
          setNotification(prev);
        }
        return null;
      });
    };

    window.addEventListener('dice_roll_start', handleRollStart);
    window.addEventListener('dice_roll_end', handleRollEnd);
    return () => {
      window.removeEventListener('dice_roll_start', handleRollStart);
      window.removeEventListener('dice_roll_end', handleRollEnd);
    };
  }, []);


  // Listen for phase2_end_proceed and phase 3 events
  useEffect(() => {
    const handleProceed = () => {
      sendAction('end_phase2_turn', {});
    };
    const handleSecondChance = () => {
      sendAction('second_chance_roll', {});
    };
    const handleBankruptcy = (e) => {
      console.log("BANKRUPTCY TRIGGERED", e.detail);
      setIsBankrupt(true);
    };
    const handleBankruptcyCleared = () => {
      setIsBankrupt(false);
    };

    const handleRoyaltyProposal = (e) => {
      setRoyaltyProposal(e.detail);
    };

    window.addEventListener('royalty_proposal_received', handleRoyaltyProposal);

    window.addEventListener('phase2_end_proceed', handleProceed);
    window.addEventListener('trigger_second_chance', handleSecondChance);
    window.addEventListener('trigger_bankruptcy', handleBankruptcy);
    window.addEventListener('bankruptcy_cleared', handleBankruptcyCleared);

    return () => {
      window.removeEventListener('phase2_end_proceed', handleProceed);
      window.removeEventListener('trigger_second_chance', handleSecondChance);
      window.removeEventListener('trigger_bankruptcy', handleBankruptcy);
      window.removeEventListener('bankruptcy_cleared', handleBankruptcyCleared);
      window.removeEventListener('royalty_proposal_received', handleRoyaltyProposal);
    };
  }, [sendAction]);

  // If no room is joined, or no username is selected, show Lobby
  if (!roomId || !username) {
    return (
      <Lobby 
        existingRoomId={roomId} 
        onJoin={(id, name) => { 
          safeSessionStorage.setItem('modernmint_username', name);
          setRoomId(id); 
          setUsername(name); 
          
          // Ensure URL only has room ID
          const params = new URLSearchParams(window.location.search);
          params.set('room', id);
          params.delete('username');
          const newUrl = `?${params.toString()}`;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }} 
      />
    );
  }
  
  if (!gameState) {
    return (
      <div className="w-screen h-screen bg-[#030806] flex items-center justify-center text-[#55ffb0] font-mono tracking-widest uppercase">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#55ffb0] border-t-transparent rounded-full animate-spin"></div>
          <div>Connecting to Server...</div>
        </div>
      </div>
    );
  }

  const companyDataMap = {
    'CONTRACT FARMING': [[10,100,500,0], [100,200,1000,20], [1000,1000,2500,200], [2000,2000,10000,400]],
    'AGRI IoT': [[100,10,1000,0], [500,300,3000,300], [1500,1500,6000,2000], [8000,8000,36000,7000]],
    'WALLET': [[50,10,1000,0], [1200,400,3000,400], [1500,2000,8000,1800], [7000,10000,36000,5000]],
    'SNACKS': [[10,20,1000,0], [300,200,1500,200], [1000,1100,7500,1500], [6000,4000,32000,8000]],
    'QUICK COMMERCE': [[10,30,100,0], [200,400,2500,100], [2000,1200,10000,800], [10000,4000,50000,6000]],
    'SMART STORAGE': [[200,200,2000,200], [3000,1600,5000,2000], [3000,5400,9000,4000], [10000,7500,40000,12000]],
    'RESTRO - CHAIN': [[150, 300, 1000, 200], [300, 400, 2000, 500], [1200, 1400, 4000, 2000], [12000, 8000, 26000, 15000]],
    'TRACEABILITY': [[30,30,300,0], [300,200,2000,200], [1200,2000,7500,1000], [10000,8000,38000,5000]],
    'ROBO - PACKAGING': [[100,150,1500,200], [1200,500,4000,1000], [5000,2500,15000,2000], [4000,9000,45000,8000]]
  };

  const { players, deals, phase } = gameState;
  const localPlayer = (socketId ? players.find(p => p.id === socketId) : null) || players.find(p => p.name === username) || players[0];
  const localPlayerName = localPlayer?.name || username;
  
  const capital = localPlayer?.capital ?? 0;
  const globalLoan = localPlayer?.loan ?? 0;
  const cash = localPlayer?.cash ?? 0;
  const valuation = localPlayer?.valuation ?? 0;
  const isLocked = localPlayer?.isLocked || false;

  // Player-specific metrics
  const localPlayerDeals = (deals || []).filter(d => 
    d.proposer?.toLowerCase() === localPlayerName.toLowerCase() || 
    d.partner?.toLowerCase() === localPlayerName.toLowerCase()
  );
  const localDealCount = localPlayerDeals.length;
  const localActionCount = localPlayer?.actionCount ?? 0;

  const augmentedPlayers = players.map(p => ({
    ...p,
    isLocal: socketId ? (p.id === socketId) : (p.name === username),
    hasLocked: p.isLocked
  }));

  // Global Notification
  const showGlobalNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 2000);
  };



  const handleFinalizeLoan = (totalNewLoans, activeCompanies, loanBreakdown) => {
    if (totalNewLoans > 0) {
      sendAction('take_loan', { amount: totalNewLoans, loanBreakdown: loanBreakdown, companiesString: activeCompanies || 'YOUR COMPANIES' });
    }
    setActiveModal(null);
  };

  const submitDeal = (dealForm, partnerName) => {
    const target = partnerName || dealTarget || 'Random Player';
    sendAction('propose_royalty_deal', { 
      proposerName: username,
      partnerName: target,
      cash: Number(dealForm.cash) || 0,
      equity: Number(dealForm.equity) || 0,
      loan: Number(dealForm.loan) || 0,
      royalty: Number(dealForm.royalty) || 0,
      terms: dealForm.terms || ''
    });
    setActiveModal(null);
    setDealTarget(null);
    showGlobalNotification(`Deal Finalised With: ${target}`);
  };

  const isMyPhase1Turn = gamePhase === 1 && gameState?.players?.[gameState?.phase1TurnIndex || 0]?.name === username;
  const activePhase1Player = gamePhase === 1 ? gameState?.players?.[gameState?.phase1TurnIndex || 0] : null;

  const isMyPhase2Turn = gamePhase === 2 && gameState?.players?.[gameState?.phase2TurnIndex || 0]?.name === username;
  const activePhase2Player = gamePhase === 2 ? gameState?.players?.[gameState?.phase2TurnIndex || 0] : null;

  const phase3Founders = (gameState?.players || []).filter(p => p.role?.toLowerCase() === 'founder');
  const isMyPhase3Turn = gamePhase === 3 && phase3Founders[gameState?.phase3TurnIndex || 0]?.name === username;
  const activePhase3Player = gamePhase === 3 ? phase3Founders[gameState?.phase3TurnIndex || 0] : null;

  const isCurrentPlayerTurnActive = 
    gamePhase === 1 ? isMyPhase1Turn : 
    gamePhase === 2 ? isMyPhase2Turn : 
    gamePhase === 3 ? isMyPhase3Turn : 
    true;

  const isTurnLocked = isPlayingTutorial ? false : (isLocked || !isCurrentPlayerTurnActive);

  const activePlayerObj = 
    gamePhase === 1 ? activePhase1Player :
    gamePhase === 2 ? activePhase2Player :
    gamePhase === 3 ? activePhase3Player :
    null;



  const handleLockDeal = () => {
    if (!isLocked) {
      if (gamePhase === 1) {
        sendAction('lock_phase1', {});
      } else if (gamePhase === 2) {
        sendAction('end_phase2_turn', {});
      } else {
        sendAction('lock_turn', {});
      }
    }
  };

  const handleLaunchCompany = (playerId) => {
    sendAction('launch_company', { targetPlayerId: playerId });
  };

  return (
    <GameProvider>
        <VoiceChatManager 
          roomName={roomId} 
          username={username} 
          isTalking={isTalking && gamePhase === 1} 
          socket={socket}
          onMicError={() => {
            setIsTalking(false);
            setNotification({ show: true, message: 'Microphone permission required for voice chat' });
          }}
        />
        <PhaseTransitionOverlay phase={gamePhase} />
        
        {isBankrupt && localPlayer && (
           <BankruptcyModal 
             player={localPlayer} 
             onResolve={(option, companyName) => sendAction('resolve_bankruptcy', { option, companyName })} 
           />
        )}
        
        {activeModal === 'transfer' && localPlayer && (
           <TransferCashModal 
             players={gameState?.players || []} 
             localPlayer={localPlayer} 
             onClose={() => setActiveModal(null)}
             onTransfer={(targetPlayerId, amount) => sendAction('transfer_cash', { targetPlayerId, amount })} 
             onOpenFormalizeDeal={() => setActiveModal('formalize_deal')}
           />
        )}

        {activeModal === 'formalize_deal' && localPlayer && (
          <FormalizeDealModal
            players={gameState?.players || []}
            localPlayer={localPlayer}
            onClose={() => setActiveModal(null)}
            sendAction={sendAction}
          />
        )}

        {royaltyProposal && (
          <RoyaltyProposalModal
            proposal={royaltyProposal}
            onClose={() => setRoyaltyProposal(null)}
            sendAction={sendAction}
          />
        )}

        <div className="relative w-screen h-screen overflow-hidden bg-[#030806] flex items-center justify-center font-sans">
        
        {/* Background Image with Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[10px] scale-110"
          style={{ backgroundImage: `url('/bg.jpg')` }}
        />

        <div 
          className="relative z-10 w-[1920px] h-[1080px] shrink-0 overflow-hidden text-[#a4d8c2] select-none"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        >

        {/* DEV: FORCE PHASE BUTTON */}
        <button 
          onClick={() => sendAction('force_next_phase', {})}
          className="absolute top-4 left-4 z-50 bg-red-600 text-white font-black uppercase text-xs px-4 py-2 rounded pointer-events-auto hover:bg-red-500 shadow-lg border border-red-400"
        >
          Dev: Force Next Phase
        </button>



        {/* TOP NOTIFICATION PROMPTS */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto">
          {isLocked ? (
            <div className="bg-black/80 border border-[#d4af37] text-white px-8 py-3 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] text-center animate-in slide-in-from-top">
              <h3 className="text-xl font-bold tracking-widest uppercase mb-1">Waiting for Others!</h3>
              <p className="text-xs text-[#d4af37]">Waiting for remaining players to lock their turns...</p>
            </div>
          ) : activeTopPanel === 'prompts' ? (
            <div className="rounded-xl p-[2px] bg-gradient-to-r from-[#8a6818] via-[#FFE885] to-[#8a6818] shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-black/95 rounded-[10px] px-24 py-6 text-center min-w-[500px] md:min-w-[650px] flex flex-col items-center justify-center">
                <h2 className="text-white text-xl md:text-2xl font-medium tracking-wide mb-1">Offer Deal</h2>
                <p className="text-[#d4af37] text-xs md:text-sm tracking-wider">Press 'Offer Deal' to proceed</p>
              </div>
            </div>
          ) : (isTalking && gamePhase === 1) ? (
            <div 
              onClick={() => setIsTalking(false)}
              title="Click to Mute Microphone"
              className="bg-gradient-to-b from-[#1a1202] to-black border border-[#d4af37] text-white px-8 py-3 rounded-lg text-center opacity-95 transition-all flex flex-col items-center shadow-[0_0_20px_rgba(212,175,55,0.4)] min-w-[300px] cursor-pointer hover:border-[#FFE885] group"
            >
              <h3 className="text-sm font-bold tracking-widest uppercase text-[#FFE885] mb-2 flex items-center gap-2">
                <Mic size={16} className="text-[#FFE885] animate-pulse" /> Active Negotiations
              </h3>
              <div className="flex items-center gap-4 bg-black/60 border border-[#d4af37]/40 px-4 py-2 rounded-lg w-full group-hover:border-[#FFE885]/60 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-400 flex items-center justify-center animate-pulse shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                   <Mic size={14} className="text-emerald-400" />
                </div>
                <div className="text-left text-xs flex-1">
                  <div className="font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Voice Channel: LIVE</span>
                    {/* Animated sound bars */}
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2"></span>
                      <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3"></span>
                      <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1.5"></span>
                    </div>
                  </div>
                  <div className="text-[#d4af37]">Microphone on &bull; Click to mute</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* MASSIVE GOLDEN NOTIFICATION BANNER */}
        {notification.show && (() => {
          const matchedCompany = getLaunchedCompanyForMessage(notification.message);
          return (
            <div className="absolute top-[45%] left-0 w-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] py-6 z-[100] shadow-[0_0_40px_rgba(245,158,11,0.4)] border-y-2 border-white/40 flex items-center justify-center animate-in zoom-in-y duration-300 pointer-events-none">
              <div className="flex items-center justify-center gap-6 md:gap-10 px-8">
                {matchedCompany && (
                  <div className="w-24 h-24 md:w-36 md:h-36 flex items-center justify-center shrink-0 -my-12 relative z-[110]">
                     <img 
                       src={matchedCompany.image} 
                       alt={matchedCompany.name} 
                       className="w-[200%] h-[200%] max-w-none object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.85)] animate-[bounce_3.5s_infinite] -translate-y-6" 
                     />
                  </div>
                )}
                <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-[0.15em] drop-shadow-lg text-center select-none max-w-3xl leading-tight">
                  {notification.message}
                </h1>
              </div>
            </div>
          );
        })()}

        {/* 3D WebGL Canvas Background Layer */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(28,77,61,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(28,77,61,0.2)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#030806_95%)] pointer-events-none"></div>
          <div className="text-center opacity-25">
            <div className="text-xs uppercase tracking-[0.4em] text-[#55ffb0] mb-2">Simulation Space</div>
            <div className="font-mono text-sm tracking-[0.2em] border border-[#1c4d3d]/30 rounded-lg px-8 py-4 bg-[#0a1914]/40 backdrop-blur-sm">
              &lt; UNITY 3D WEBGL BOARD CANVAS &gt;
            </div>
          </div>
        </div>

        {/* HUD 2D Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          
          {/* === UPPER HALF: BOARD & TOP CORNERS === */}
          <div className="absolute inset-0 flex justify-center pt-6 z-10">
            
            {/* Top-Left: Tokens & Action Prompts */}
            <div className="absolute left-7 top-6 pointer-events-auto flex items-start gap-11 z-50">
              {/* Left Column: Title + Team Token Coins */}
              <div className="flex flex-col gap-5">
                <div className="text-white font-black text-[13px] uppercase tracking-wider leading-[1.2] drop-shadow-md select-none">
                  TEAM TOKENS<br/>AVAILABLE
                </div>
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src="/team-token-2-coin.png" 
                      alt="Team 2 Token" 
                      className="w-[46px] h-[46px] object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] select-none shrink-0" 
                    />
                    <span className="text-white font-medium text-[15px] tracking-wide whitespace-nowrap select-none">X 12</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <img 
                      src="/team-token-3-coin.png" 
                      alt="Team 3 Token" 
                      className="w-[46px] h-[46px] object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] select-none shrink-0" 
                    />
                    <span className="text-white font-medium text-[15px] tracking-wide whitespace-nowrap select-none">X 8</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <img 
                      src="/team-token-4-coin.png" 
                      alt="Team 4 Token" 
                      className="w-[46px] h-[46px] object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] select-none shrink-0" 
                    />
                    <span className="text-white font-medium text-[15px] tracking-wide whitespace-nowrap select-none">X 6</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setActiveTopPanel(prev => prev === 'prompts' ? null : 'prompts')}
                  title="Toggle Prompts"
                  className={`w-[49px] h-[49px] rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-lg select-none relative overflow-hidden group ${
                    activeTopPanel === 'prompts' 
                      ? 'scale-105 shadow-[0_0_20px_rgba(255,194,64,0.8)]' 
                      : 'hover:scale-105'
                  }`}
                >
                  {/* Outer Button Frame Image */}
                  <img 
                    src="/search-btn-frame.png" 
                    alt="Button Frame" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" 
                  />
                  {/* Inner Magnification Glass Icon Image */}
                  <img 
                    src="/search-icon-gold.png" 
                    alt="Magnification Icon" 
                    className="w-[26px] h-[26px] object-contain relative z-10 pointer-events-none select-none transition-transform group-hover:scale-110" 
                  />
                </button>
                {gamePhase === 1 && (
                  <button 
                    onClick={() => setIsTalking(prev => !prev)}
                    title={isTalking ? "Mute Microphone (Currently Live)" : "Unmute Microphone (Currently Muted)"}
                    className={`w-[49px] h-[49px] rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-lg select-none relative overflow-hidden group ${
                      isTalking 
                        ? 'scale-105 ring-2 ring-[#FFE885] shadow-[0_0_25px_rgba(255,194,64,0.9)] bg-black/60' 
                        : 'hover:scale-105 bg-black/40'
                    }`}
                  >
                    {/* Outer Button Frame Image */}
                    <img 
                      src="/mic-btn-frame.png" 
                      alt="Mic Button Frame" 
                      className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-opacity ${
                        isTalking ? 'opacity-100' : 'opacity-70'
                      }`} 
                    />

                    {/* Microphone Icon */}
                    <img 
                      src="/mic-icon-gold.png" 
                      alt="Microphone Icon" 
                      className={`w-[23px] h-[28px] object-contain relative z-10 pointer-events-none select-none transition-all ${
                        isTalking 
                          ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,232,133,0.95)]' 
                          : 'opacity-60 scale-95'
                      }`} 
                    />

                    {/* MUTED STATE: Prominent Red Diagonal Slash across the mic */}
                    {!isTalking && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 49 49">
                        <line 
                          x1="13" 
                          y1="13" 
                          x2="36" 
                          y2="36" 
                          stroke="#ef4444" 
                          strokeWidth="3.2" 
                          strokeLinecap="round" 
                          className="drop-shadow-[0_0_5px_rgba(239,68,68,0.95)]" 
                        />
                      </svg>
                    )}

                    {/* Corner Status Indicator */}
                    <div className="absolute bottom-1 right-1 z-30 pointer-events-none">
                      {isTalking ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black shadow-[0_0_6px_#10b981]"></span>
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full h-2 w-2 bg-red-500 border border-black/80 shadow-[0_0_3px_#ef4444]"></span>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
            {/* Top-Right: Player Roster */}
            <div data-tutorial="tutorial-player-roster" className="absolute right-6 top-6 pointer-events-auto flex flex-col items-end gap-2 w-fit z-50">
              {augmentedPlayers.map((player, playerIdx) => {
                const isPlayerTalking = player.isLocal ? isTalking : Boolean(activeSpeakers[player.name]);
                return (
                  <div key={player.id} className="w-full flex flex-col items-end gap-1">
                    <div className="flex gap-2 items-start w-full justify-end">
                      {/* Circular Avatar */}
                      <div 
                        onClick={() => setExpandedPlayerId(prev => prev === player.id ? null : player.id)}
                        className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 border-2 overflow-hidden bg-gray-900 transition-all cursor-pointer hover:opacity-95 select-none relative ${
                          (isPlayerTalking && gamePhase === 1) ? 'ring-2 ring-emerald-400' : ''
                        }`}
                        style={{ 
                          borderColor: player.isLocked ? '#d4af37' : (player.color || '#55ffb0'),
                          boxShadow: (isPlayerTalking && gamePhase === 1)
                            ? '0 0 16px #34d399, inset 0 0 8px rgba(52,211,153,0.5)'
                            : player.isLocked 
                              ? '0 0 15px rgba(212, 175, 55, 0.9), inset 0 0 8px rgba(212, 175, 55, 0.4)' 
                              : `0 0 12px ${player.color || '#55ffb0'}`
                        }}
                      >
                        <img 
                          src={getPlayerAvatarSrc(player, playerIdx)} 
                          alt={player.name} 
                          className="w-full h-full object-cover select-none pointer-events-none" 
                        />
                        {/* Speaking badge indicator on avatar */}
                        {(isPlayerTalking && gamePhase === 1) && (
                          <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none animate-pulse"></div>
                        )}
                      </div>
                    
                    {/* Banner or Expanded Dropdown */}
                    <div 
                      onClick={() => setExpandedPlayerId(prev => prev === player.id ? null : player.id)}
                      className="cursor-pointer hover:opacity-95 transition-opacity select-none"
                    >
                      {expandedPlayerId === player.id && !player.isLocal ? (
                        <div 
                          style={{
                            backgroundImage: "url('/Rectangle-608.png')",
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat'
                          }}
                          className="w-[220px] min-h-[115px] rounded-[6px] p-3 shadow-[0_6px_20px_rgba(0,0,0,0.6)] flex flex-col items-center font-sans animate-in fade-in zoom-in-[0.98] duration-200 border border-white/10"
                        >
                          <div className="text-white text-[14px] md:text-[15px] mb-2.5 font-bold tracking-wide drop-shadow-md text-center flex items-center justify-between w-full px-1">
                            <span className="truncate">
                              {player.name}
                              {player.role && !player.name.includes(player.role) ? ` (${player.role})` : ''}
                            </span>
                            <span className="text-white/70 text-[10px] shrink-0 ml-1">▲</span>
                          </div>
                          <div className="flex flex-col gap-2.5 w-full px-1 pb-1">
                            {player.ownedCompanies.length > 0 ? (
                              player.ownedCompanies.map((c, i) => (
                                <div key={i} className="flex items-center justify-between w-full px-2 py-0.5">
                                  {/* Company 3D Icon */}
                                  <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0">
                                    <img src={getCompanyLogoImage(c.name)} alt={c.name} className="w-full h-full object-contain filter drop-shadow-md select-none" />
                                  </div>
                                  {/* Stage Level Badge using Rectangle 549 */}
                                  <div className="w-[32px] h-[32px] relative flex items-center justify-center shrink-0 select-none">
                                    <img src="/stage-badge-bg.png" alt="Stage" className="absolute inset-0 w-full h-full object-contain" />
                                    <span className="relative z-10 text-white text-[13px] font-bold leading-none select-none drop-shadow-sm">
                                      {c.stage}
                                    </span>
                                  </div>
                                  {/* Team Token Coin using team-token-2.png */}
                                  <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0 select-none">
                                    <img 
                                      src="/team-token-2.png" 
                                      alt="Team Token" 
                                      className="w-full h-full object-contain drop-shadow-md select-none" 
                                    />
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-[11px] text-white/50 italic text-center py-2.5 w-full">No assets owned</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          style={getPlayerPillStyle(player.color, player.name)}
                          className="w-[230px] h-[38px] rounded-[6px] flex items-center justify-between px-3.5 shadow-lg border border-white/10 select-none"
                        >
                          <span className="text-[14px] md:text-[15px] font-bold text-white tracking-wide truncate drop-shadow-sm">
                            {player.name}
                            {player.role && !player.name.includes(player.role) && !player.isLocal ? ` (${player.role})` : ''}
                          </span>
                          <span className="text-white/80 text-[11px] ml-1.5 shrink-0">▼</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {expandedPlayerId === player.id && player.isLocal && (
                      // Local Player Detailed Company List
                      <div 
                        style={{
                          background: 'linear-gradient(180deg, #2a181a 0%, #291719 60%, #342419 75%, #41351a 90%, #4b4219 100%)'
                        }}
                        className="w-[316px] h-[373px] border-[1.5px] border-[#dfa832] rounded-[24px] overflow-hidden mt-1.5 animate-in slide-in-from-top-2 flex flex-col font-sans shadow-[0_12px_36px_rgba(0,0,0,0.7)] select-none shrink-0"
                      >
                        {/* Header Row */}
                        <div className="grid grid-cols-[82px_49px_68px_67px_1fr] h-[77px] shrink-0 text-center items-start pt-3">
                          {/* Column 1: Company */}
                          <div className="flex flex-col items-center border-r border-[#a87a3e]/30 h-full">
                            <span className="text-[13px] font-medium text-[#dfa832] leading-tight">Company</span>
                            <span className="text-[10px] font-normal text-[#ba9463] lowercase leading-none mt-1">$k</span>
                            <div className="w-[62px] border-b border-[#a87a3e]/40 mt-2" />
                          </div>
                          {/* Column 2: Invest */}
                          <div className="flex flex-col items-center border-r border-[#a87a3e]/30 h-full">
                            <span className="text-[13px] font-medium text-[#dfa832] leading-tight">Invest</span>
                            <span className="text-[10px] font-normal text-[#ba9463] lowercase leading-none mt-1">$k</span>
                            <div className="w-[36px] border-b border-[#a87a3e]/40 mt-2" />
                          </div>
                          {/* Column 3: Projected Rev */}
                          <div className="flex flex-col items-center border-r border-[#a87a3e]/30 h-full">
                            <span className="text-[12px] font-medium text-[#dfa832] leading-[1.1]">Projected<br/>Rev</span>
                            <span className="text-[10px] font-normal text-[#ba9463] lowercase leading-none mt-0.5">$k</span>
                            <div className="w-[52px] border-b border-[#a87a3e]/40 mt-1" />
                          </div>
                          {/* Column 4: Valuation */}
                          <div className="flex flex-col items-center border-r border-[#a87a3e]/30 h-full">
                            <span className="text-[13px] font-medium text-[#dfa832] leading-tight">Valuation</span>
                            <span className="text-[10px] font-normal text-[#ba9463] lowercase leading-none mt-1">$k</span>
                            <div className="w-[50px] border-b border-[#a87a3e]/40 mt-2" />
                          </div>
                          {/* Column 5: Loan */}
                          <div className="flex flex-col items-center h-full">
                            <span className="text-[13px] font-medium text-[#dfa832] leading-tight">Loan</span>
                            <span className="text-[10px] font-normal text-[#ba9463] lowercase leading-none mt-1">$k</span>
                            <div className="w-[36px] border-b border-[#a87a3e]/40 mt-2" />
                          </div>
                        </div>

                        {/* 4 Data / Empty Rows */}
                        <div className="flex-1 flex flex-col justify-between">
                          {Array.from({ length: 4 }).map((_, idx) => {
                            const c = player.ownedCompanies[idx];
                            if (c) {
                              let valInvest = c.invest;
                              let valRev = c.revenue;
                              let valVal = c.valuation;
                              let valLoan = c.loan;
                              
                              if (companyDataMap[c.name] && companyDataMap[c.name][c.stage]) {
                                valInvest = companyDataMap[c.name][c.stage][0];
                                valRev = companyDataMap[c.name][c.stage][1];
                                valVal = companyDataMap[c.name][c.stage][2];
                                valLoan = companyDataMap[c.name][c.stage][3];
                              }
                              
                              const loanPercent = valVal > 0 ? Math.round((valLoan / valVal) * 100) : (valLoan || 0);

                              return (
                                <div key={idx} className="grid grid-cols-[82px_49px_68px_67px_1fr] flex-1 items-center text-center font-sans">
                                  {/* Company Identity */}
                                  <div className="border-r border-[#a87a3e]/30 h-full flex flex-col items-center justify-center px-1">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <img 
                                        src={getCompanyLogoImage(c.name)} 
                                        alt={c.name} 
                                        className="w-[28px] h-[28px] object-contain drop-shadow-sm select-none shrink-0" 
                                      />
                                      <div className="flex flex-col items-center gap-1 shrink-0">
                                        <div className="w-[18px] h-[18px] bg-[#6e2030] rounded-[3px] flex items-center justify-center shadow-sm select-none">
                                          <span className="text-white text-[10px] font-bold leading-none select-none">
                                            {c.stage}
                                          </span>
                                        </div>
                                        <img 
                                          src="/team-token-2.png" 
                                          alt="Token" 
                                          className="w-[16px] h-[16px] object-contain drop-shadow-sm select-none" 
                                        />
                                      </div>
                                    </div>
                                    <span className="font-black text-[9px] text-white tracking-tight uppercase text-center leading-tight mt-1 select-none px-0.5 break-words max-w-full">
                                      {getCompanyShortName(c.name)}
                                    </span>
                                  </div>

                                  {/* Invest */}
                                  <div className="border-r border-[#a87a3e]/30 h-full flex items-center justify-center text-[15px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                    {valInvest !== undefined ? valInvest : ''}
                                  </div>

                                  {/* Projected Rev */}
                                  <div className="border-r border-[#a87a3e]/30 h-full flex items-center justify-center text-[15px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                    {valRev !== undefined ? valRev : ''}
                                  </div>

                                  {/* Valuation */}
                                  <div className="border-r border-[#a87a3e]/30 h-full flex items-center justify-center text-[15px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                    {valVal !== undefined ? valVal : ''}
                                  </div>

                                  {/* Loan */}
                                  <div className="h-full flex items-center justify-center text-[15px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                    {loanPercent}%
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx} className="grid grid-cols-[82px_49px_68px_67px_1fr] flex-1 items-stretch text-center font-sans">
                                  <div className="flex items-center justify-center border-r border-[#a87a3e]/30 h-full">
                                    <span className="text-4xl font-black text-white/35 select-none">{idx + 1}</span>
                                  </div>
                                  <div className="border-r border-[#a87a3e]/30 h-full"></div>
                                  <div className="border-r border-[#a87a3e]/30 h-full"></div>
                                  <div className="border-r border-[#a87a3e]/30 h-full"></div>
                                  <div className="h-full"></div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                  )}
                </div>
              );
            })}
            </div>

            {/* Center: Constrained Middle Board */}
            <div data-tutorial="tutorial-game-board" className="w-full max-w-[1450px] h-full max-h-[760px] pointer-events-auto relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#1c4d3d] rounded-xl overflow-hidden bg-[#0a1914] scale-[0.9] origin-top">
               <MiddleBoard 
                 players={augmentedPlayers} 
                 onDeckClick={() => setActiveModal('buy_mentor')} 
                 currentRound={gameRound} 
                 onBankLoanClick={() => setActiveModal('loan')} 
                 onPRServicesClick={() => setActiveModal('buy_pr')} 
               />
            </div>

          </div>

          {/* === LOWER HALF: DESK AREA & TRACKERS === */}
          <div className="absolute bottom-[130px] w-full h-[240px] flex justify-center items-end gap-8 z-20">
            
            {/* Bottom-Left: Trackers */}
            <div data-tutorial="tutorial-trackers" className="absolute left-6 bottom-4 pointer-events-auto flex flex-col gap-3">
              {isActionTrayOpen && (
                <ActionTrackerTray
                  actions={localPlayer?.roundActions || []}
                  onUndo={(actionId) => sendAction('undo_action', { actionId })}
                />
              )}

              {gamePhase === 1 ? (
                <>
                  <div 
                    onClick={() => setActiveModal('dealSheets')}
                    className="bg-gradient-to-r from-black to-[#397564] border border-white/5 rounded-[10px] px-4 w-[214px] h-[42px] flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Deal Tracker</span>
                    <span className="text-[40px] font-black bg-gradient-to-b from-white to-[#FFC240] bg-clip-text text-transparent leading-none select-none">{localDealCount}</span>
                  </div>
                  <div 
                    onClick={() => setIsActionTrayOpen(prev => !prev)}
                    className="bg-gradient-to-r from-black to-[#397564] border border-white/5 rounded-[10px] px-4 w-[214px] h-[42px] flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Action Tracker</span>
                    <span className="text-[40px] font-black bg-gradient-to-b from-white to-[#FFC240] bg-clip-text text-transparent leading-none select-none">{localActionCount}</span>
                  </div>
                </>
              ) : (
                <>
                  <div 
                    onClick={() => setIsActionTrayOpen(prev => !prev)}
                    className="bg-gradient-to-r from-black to-[#397564] border border-white/5 rounded-[10px] px-4 w-[214px] h-[42px] flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Action Tracker</span>
                    <span className="text-[40px] font-black bg-gradient-to-b from-white to-[#FFC240] bg-clip-text text-transparent leading-none select-none">{localActionCount}</span>
                  </div>
                  <div 
                    onClick={() => setActiveModal('dealSheets')}
                    className="bg-gradient-to-r from-black to-[#397564] border border-white/5 rounded-[10px] px-4 w-[214px] h-[42px] flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Deal Tracker</span>
                    <span className="text-[40px] font-black bg-gradient-to-b from-white to-[#FFC240] bg-clip-text text-transparent leading-none select-none">{localDealCount}</span>
                  </div>
                </>
              )}
            </div>

            {/* Desk Element 1: Launch Status List */}
            <div className="flex flex-col gap-2.5 mb-2 pointer-events-auto min-w-[145px]">
              {Array.from({ length: 4 }).map((_, idx) => {
                const comp = localPlayer?.ownedCompanies?.[idx] || null;
                const getStageInitial = (stageIdx) => ['L', 'R', 'G', 'S'][stageIdx] || 'L';

                return (
                  <div key={idx} className="flex items-center gap-2.5 h-[36px]">
                    <span className="text-sm md:text-base font-bold text-white w-4 shrink-0 text-left select-none">
                      {idx + 1}.
                    </span>

                    {comp ? (
                      <div 
                        onClick={() => setActiveModal('playerMat')}
                        className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                      >
                        {/* Company Original 3D Logo */}
                        <div className="w-9 h-9 flex items-center justify-center shrink-0">
                          <img 
                            src={getCompanyLogoImage(comp.name)} 
                            alt={comp.name} 
                            className="w-full h-full object-contain drop-shadow-md select-none" 
                          />
                        </div>

                        {/* Stage Level Token */}
                        <div className="w-8 h-8 flex items-center justify-center rounded-sm overflow-hidden shadow-sm shrink-0">
                          <img 
                            src={getStageTokenImage(comp.stage, 0, localPlayer?.color)} 
                            alt={getStageInitial(comp.stage)} 
                            className="w-full h-full object-contain select-none" 
                          />
                        </div>

                        {/* Team Token Coin */}
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          <img 
                            src={getTeamTokenCoinImage(comp.team)} 
                            alt="Team Token" 
                            className="w-full h-full object-contain drop-shadow-md select-none" 
                          />
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveModal('playerMat')}
                        className="w-[78px] h-[32px] rounded-[8px] bg-[#546461] hover:bg-[#637571] text-white text-[9px] font-bold uppercase tracking-wider leading-tight flex flex-col items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
                      >
                        <span>LAUNCH</span>
                        <span>COMPANY</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desk Element 2: Mini Player Mat */}
            <div 
              onMouseEnter={() => {
                setActiveModal('playerMat');
                setIsHoverOpenedMat(true);
              }}
              onClick={() => {
                setActiveModal('playerMat');
                setIsHoverOpenedMat(false);
              }}
              className="pointer-events-auto cursor-pointer transition-all duration-300 scale-[0.65] translate-y-2 hover:scale-[0.95] hover:-translate-y-6 relative z-10 hover:z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-lg bg-[#4A1720] border-2 border-[#2A0D12] p-2 flex gap-2 origin-bottom mb-6"
            >
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  "CONTRACT FARM", "AGRI IoT", "WALLET",
                  "SNACKS", "QUICK COMM", "SMART STOR",
                  "RESTRO CHAIN", "TRACEABILITY", "ROBO-PACK"
                ].map((name, i) => (
                  <div key={i} className="w-[75px] h-[95px] bg-[#7D3C4A] border border-[#3A141A] rounded flex flex-col items-center p-1 overflow-hidden">
                    <div className="w-full bg-[#FFF2D8] rounded-md flex items-center justify-center mb-1 p-1 min-h-[24px]">
                      <span className="text-[9px] font-black text-[#4A1720] leading-tight text-center break-words w-full">{name}</span>
                    </div>
                    <div className="w-full flex-1 border-t border-white/20 mt-1 flex flex-col justify-evenly">
                      <div className="w-full h-[2px] bg-white/20 rounded"></div>
                      <div className="w-full h-[2px] bg-white/20 rounded"></div>
                      <div className="w-full h-[2px] bg-white/20 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 w-[75px]">
                <div className="h-[40px] bg-[#FFF2D8] rounded flex items-center justify-center p-1 text-center"><span className="text-[10px] font-black text-[#4A1720] leading-tight">2ND<br/>CHANCE</span></div>
                <div className="h-[70px] bg-[#FFF2D8] rounded flex items-center justify-center p-1 text-center"><span className="text-[10px] font-black text-[#4A1720] leading-tight">MULTIPLIER</span></div>
                <div className="flex-1 bg-[#FFF2D8] rounded flex items-center justify-center p-1 text-center"><span className="text-[10px] font-black text-[#4A1720] leading-tight">NOTES</span></div>
              </div>
            </div>

            {/* Desk Element 3: Owned Mentor Cards (Inventory) */}
            {localPlayer && localPlayer.mentorCards && (
              <div 
                data-tutorial="tutorial-card-area"
                onClick={() => setActiveModal('mentorInventory')}
                className="relative w-[160px] h-[160px] pointer-events-auto cursor-pointer group mb-6 ml-6"
                title="Your Owned Mentor Cards"
              >
                <div className="absolute -top-2 -right-2 bg-red-600 border-2 border-white text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center z-50 drop-shadow-md">
                   {localPlayer.mentorCards.length}
                </div>
                {localPlayer.mentorCards.length === 0 ? (
                  <img 
                    src="/center-mentor-card.png" 
                    alt="Empty Mentor Inventory" 
                    className="absolute inset-0 w-full h-full object-contain origin-bottom opacity-50 grayscale cursor-pointer" 
                  />
                ) : (
                  localPlayer.mentorCards.map((card, idx) => {
                    const maxCards = Math.min(localPlayer.mentorCards.length, 3);
                    const displayIdx = idx >= maxCards ? maxCards - 1 : idx;
                    const rotation = (displayIdx - (maxCards - 1)/2) * 10;
                    return (
                      <img 
                        key={card.id || idx} 
                        src="/center-mentor-card.png" 
                        alt="Owned Mentor Card" 
                        className="absolute inset-0 w-full h-full object-contain origin-bottom transition-transform drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]" 
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                    );
                  })
                )}
              </div>
            )}

            {/* Bottom-Right: Static BANK icon */}
            <div 
              onClick={() => !isLocked && setActiveModal('loan')}
              className="absolute right-6 bottom-4 pointer-events-auto flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform"
            >
              <svg width="54" height="42" viewBox="0 0 60 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFAEF" />
                    <stop offset="100%" stopColor="#FFC240" />
                  </linearGradient>
                </defs>
                {/* Roof */}
                <path d="M30 4 L5 18 H55 Z" stroke="url(#goldGradient)" strokeWidth="3.5" strokeLinejoin="round" fill="none" />
                {/* Architrave */}
                <rect x="8" y="20" width="44" height="3.5" rx="1" fill="url(#goldGradient)" />
                {/* Pillars */}
                <rect x="13.5" y="23.5" width="4.5" height="14" rx="0.5" fill="url(#goldGradient)" />
                <rect x="27.75" y="23.5" width="4.5" height="14" rx="0.5" fill="url(#goldGradient)" />
                <rect x="42.5" y="23.5" width="4.5" height="14" rx="0.5" fill="url(#goldGradient)" />
                {/* Base Steps */}
                <rect x="8" y="37.5" width="44" height="3" rx="0.5" fill="url(#goldGradient)" />
                <rect x="5" y="40.5" width="50" height="3" rx="0.5" fill="url(#goldGradient)" />
              </svg>
              {/* Separator Line */}
              <div className="w-[48px] h-[3px] rounded-full bg-[#FFC240] mt-1 shadow-[0_1px_5px_rgba(0,0,0,0.5)]"></div>
              {/* Text */}
              <span className="text-[11px] font-black uppercase tracking-widest mt-1 bg-gradient-to-b from-[#FFFFFF] to-[#FFC240] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] font-sans">Bank</span>
            </div>

          </div>
        </div>

        {/* FULL WIDTH BOTTOM DASHBOARD */}
        <div className="absolute bottom-0 w-full z-40 pointer-events-auto flex flex-col">
          {/* Main Bar */}
          <div className="bg-[#112a20] border-t-2 border-[#1c4d3d] w-full flex items-stretch h-[60px] md:h-[70px]">
            
            {/* Left: Time */}
            <div className="flex items-center gap-6 px-6 md:px-10 shrink-0">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[8px] md:text-[10px] text-white/70 uppercase tracking-widest leading-none mb-1">Round</span>
                <span className="text-2xl md:text-3xl font-black text-white leading-none drop-shadow-md">{gameRound}</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[8px] md:text-[10px] text-white/70 uppercase tracking-widest leading-none mb-1">Phase</span>
                <span className="text-2xl md:text-3xl font-black text-white leading-none drop-shadow-md">{gamePhase}</span>
              </div>
              <div className="flex flex-col items-center justify-center min-w-[60px]">
                <span className="text-[8px] md:text-[10px] text-white/70 uppercase tracking-widest leading-none mb-1">Turn</span>
                <div className="flex items-center gap-2 h-9 select-none">
                  {/* Left side: column of small inactive tokens */}
                  <div className="flex flex-col gap-0.5 justify-center">
                    {(gameState?.players || []).map((p) => {
                      const isActive = activePlayerObj && p.id === activePlayerObj.id;
                      if (isActive) return null;
                      const color = p.color || '#55ffb0';
                      return (
                        <div 
                          key={p.id}
                          className="w-2.5 h-2.5 rounded-full border border-white/25"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${color} 45%, #000 100%)`,
                            boxShadow: `0 0 5px ${color}90, inset 0 1px 2px rgba(255,255,255,0.45)`
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Right side: large active token */}
                  {activePlayerObj ? (
                    <div 
                      className="w-7 h-7 rounded-full border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative group transition-all"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${activePlayerObj.color || '#55ffb0'} 20%, #000 100%)`,
                        boxShadow: `0 0 12px ${(activePlayerObj.color || '#55ffb0')}a0, inset 0 2px 4px rgba(255,255,255,0.4)`
                      }}
                    >
                      {/* Glossy highlight overlay */}
                      <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none"></div>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-white leading-none">All</span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Action Buttons */}
            <div className="flex-1 flex justify-center items-center gap-6 border-l border-[#1c4d3d]">
              <div data-tutorial="tutorial-action-bar" className="flex items-center gap-6 p-1">
              {gamePhase === 1 ? (
                <>
                  <button
                    onClick={() => !isTurnLocked && setActiveModal('loan')}
                    disabled={isTurnLocked}
                    className={`px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#2e8b57] to-[#1c5435] border border-[#55ffb0]/20 text-white font-semibold tracking-wide select-none cursor-pointer transition-all ${isTurnLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-[#3cb371] hover:to-[#228b22] hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(46,139,87,0.4)]'}`}
                  >
                    Take Bank Loan
                  </button>
                  <button
                    onClick={() => !isTurnLocked && setActiveModal('personaSelect')}
                    disabled={isTurnLocked}
                    className={`px-6 py-2.5 rounded-xl font-semibold tracking-wide select-none cursor-pointer transition-all h-[42px] flex items-center justify-center
                      ${activeModal === 'personaSelect' || activeModal === 'deal'
                        ? 'bg-gradient-to-br from-[#FFE885] via-[#d4af37] to-[#8a6818] border-2 border-white text-black shadow-[0_0_20px_rgba(212,175,55,0.8)] scale-105 font-black uppercase'
                        : 'bg-gradient-to-br from-[#2e8b57] to-[#1c5435] border border-[#55ffb0]/20 text-white hover:from-[#3cb371] hover:to-[#228b22] hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(46,139,87,0.4)]'
                      } ${isTurnLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    Offer a Deal
                  </button>
                </>
              ) : gamePhase === 2 ? (
                <Phase2Dashboard isLocked={isTurnLocked} onActionClick={(action) => setActiveModal(action)} />
              ) : (
                <>
                  <button
                    onClick={() => !isTurnLocked && setActiveModal('phase3Dice')}
                    disabled={isTurnLocked}
                    className={`px-6 py-2 rounded-2xl text-[10px] md:text-xs font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#4ade80] to-[#166534] text-white text-center flex flex-col items-center justify-center min-w-[120px] h-[52px] leading-tight border border-[#e5c158] shadow-[0_0_15px_rgba(229,193,88,0.4)] ${isTurnLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-[#52ea90] hover:to-[#1b753d] hover:scale-105 active:scale-95'}`}
                  >
                    <span>Roll</span>
                    <span>the Dice</span>
                  </button>
                  <button
                    onClick={() => !isTurnLocked && setActiveModal('loanRepay')}
                    disabled={isTurnLocked}
                    className={`px-6 py-2 rounded-2xl text-[10px] md:text-xs font-bold transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#4ade80] to-[#166534] text-white text-center flex flex-col items-center justify-center min-w-[120px] h-[52px] leading-tight border border-[#166534] ${isTurnLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-[#52ea90] hover:to-[#1b753d] hover:scale-105 active:scale-95'}`}
                  >
                    <span>Repay</span>
                    <span>Loan</span>
                  </button>
                </>
              )}
              </div>
            </div>

            {/* Right: End Turn / Lock Button */}
            <div data-tutorial="tutorial-lock-button" className="w-[120px] md:w-[150px] lg:w-[180px] h-full flex items-center justify-center border-l border-[#1c4d3d]">
              <button 
                onClick={handleLockDeal}
                disabled={isTurnLocked}
                className={`relative group overflow-hidden bg-gradient-to-br from-[#d4af37] via-[#FFE885] to-[#8a6818] text-black font-black uppercase tracking-widest text-[10px] md:text-[11px] lg:text-xs py-2 md:py-3 px-3 md:px-5 lg:px-6 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all transform ${isTurnLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(255,232,133,0.6)]'}`}
              >
                {/* Shine effect */}
                {!isTurnLocked && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"></div>}
                
                <div className="flex flex-col items-center gap-0.5 relative z-10 text-center">
                 {isLocked ? (
                   <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] leading-tight text-xs">Waiting for<br/>other players...</span>
                 ) : !isCurrentPlayerTurnActive ? (
                   <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] leading-tight text-xs">Waiting for<br/>your turn...</span>
                 ) : (
                   <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] leading-tight">
                     {gamePhase === 1 ? (
                       <>LOCK THE<br/>DEAL</>
                     ) : gamePhase === 2 ? (
                       <>END<br/>ACTIONS</>
                     ) : (
                       <>END<br/>PHASE 3</>
                     )}
                   </span>
                 )}
                </div>
               </button>
            </div>
          </div>

          {/* Sub-Bar: Financials */}
          <div className="flex w-full bg-black border-t border-[#1c4d3d] h-[55px] md:h-[60px] items-center px-4 relative">
            
            <div data-tutorial="tutorial-player-info" className="flex items-center justify-center gap-6 md:gap-12 lg:gap-20 w-full px-4 py-1">
              
              <div className="flex items-center gap-3">
                <span className="text-white uppercase font-bold tracking-widest text-[10px] md:text-xs text-right leading-tight">Net<br/>Worth</span>
                <div className="bg-[#2A7553] text-white font-mono font-bold px-4 py-2 rounded-lg shadow-md flex items-center gap-2 text-xs md:text-sm">
                  <Crown size={14} className="text-[#FFE885]"/> ${Number(capital).toFixed(2)}M
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-white uppercase font-bold tracking-widest text-[10px] md:text-xs text-right leading-tight">Total<br/>Valuation</span>
                <div className="bg-[#2A7553] text-[#55ffb0] font-mono font-bold px-4 py-2 rounded-lg shadow-md text-xs md:text-sm">${Number(valuation).toFixed(2)}M</div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-white uppercase font-bold tracking-widest text-[10px] md:text-xs text-right leading-tight">Cash in<br/>Hand</span>
                <div className="bg-[#2A7553] text-[#55ffb0] font-mono font-bold px-4 py-2 rounded-lg shadow-md text-xs md:text-sm">${cash}K</div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-white uppercase font-bold tracking-widest text-[10px] md:text-xs text-right leading-tight">Current Loan<br/>+ Interest</span>
                <div className="bg-[#2A7553] text-[#ff6b6b] font-mono font-bold px-4 py-2 rounded-lg shadow-md text-xs md:text-sm">${globalLoan}K</div>
              </div>

            </div>

            {/* Blue Cash Deck Visual */}
            <div className="absolute right-12 md:right-20 bottom-1 flex flex-col items-center pointer-events-auto cursor-pointer hover:-translate-y-1 transition-transform z-50">
              <div className="w-16 h-12 bg-[#8ba4c9] rounded-sm border border-[#506a8f] shadow-[0_5px_15px_rgba(0,0,0,0.5)] transform -rotate-2 relative flex items-start justify-between p-1 overflow-hidden">
                 <span className="text-[5px] font-black text-[#506a8f]">50K</span>
                 <div className="w-full h-[1px] bg-[#506a8f]/30 absolute top-3 left-0"></div>
                 <div className="w-full h-[1px] bg-[#506a8f]/30 absolute bottom-3 left-0"></div>
                 <div className="absolute w-16 h-12 bg-[#a3bcdc] rounded-sm border border-[#506a8f] shadow-[0_2px_5px_rgba(0,0,0,0.4)] transform rotate-2 -top-1 left-1 flex flex-col justify-between p-1">
                    <div className="flex justify-between w-full">
                       <span className="text-[5px] font-black text-[#506a8f] leading-none">50K</span>
                       <div className="w-1 h-3 bg-[#e8e4c9] border border-[#506a8f]"></div>
                    </div>
                    <div className="flex justify-center w-full">
                       <div className="w-3 h-3 border border-[#506a8f]/50 rounded-full flex items-center justify-center">
                          <span className="text-[4px] text-[#506a8f]">✦</span>
                       </div>
                    </div>
                    <div className="flex justify-between w-full">
                       <span className="text-[5px] font-black text-[#506a8f] leading-none transform rotate-180">50K</span>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </div>

        {/* PHASE 2 MODAL MANAGER */}
        {(gamePhase === 2 || ['launch', 'stage_up', 'buy_pr', 'upgrade_workforce'].includes(activeModal)) && (
          <Phase2Manager 
            activeModal={activeModal} 
            setActiveModal={setActiveModal} 
            sendAction={sendAction} 
            localPlayer={localPlayer} 
            currentRound={gameRound} 
            activeEvent={gameState?.activeEvent} 
          />
        )}

        {/* MENTOR CARD MODAL (Accessible Anytime) */}
        {activeModal === 'buy_mentor' && (
          <MentorCardModal 
            onClose={() => setActiveModal(null)} 
            onBuy={() => {
              sendAction('buy_mentor_card', {});
            }}
            drawnCard={drawnCard}
            clearDrawnCard={clearDrawnCard}
            notification={notification}
            hasBoughtThisRound={localPlayer?.boughtMentorRound === gameRound}
          />
        )}

        {/* POPUP MODALS WITH BACKDROP */}
        {activeModal && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto transition-all duration-300 ${
            activeModal === 'playerMat' && isHoverOpenedMat 
              ? 'p-0 bg-transparent' 
              : 'p-4 bg-black/75 backdrop-blur-sm'
          }`}>
            
            {/* DEAL SHEETS MODAL (READ-ONLY SHEET BROWSER) */}
            {activeModal === 'dealSheets' && (
              <DealSheetModal
                onClose={() => setActiveModal(null)}
                readOnly={true}
                deals={localPlayerDeals}
                username={username}
              />
            )}



            {activeModal === 'loan' && (
              <BankLoanModal 
                onClose={() => setActiveModal(null)} 
                onFinalize={handleFinalizeLoan} 
                ownedCompanies={localPlayer.ownedCompanies || []} 
                companyDataMap={companyDataMap} 
              />
            )}

            {activeModal === 'loanRepay' && (
              <RepayLoanModal
                onClose={() => setActiveModal(null)}
                player={localPlayer}
                sendAction={sendAction}
              />
            )}

            {activeModal === 'selfPortfolio' && (
              <SelfPortfolioModal 
                onClose={() => setActiveModal(null)} 
                player={players.find(p => p.isLocal)} 
                sendAction={sendAction}
              />
            )}

            {activeModal === 'personaSelect' && (
              <PersonaSelectModal
                onClose={() => setActiveModal(null)}
                players={players.filter(p => p.name !== username)}
                onSelectPersona={(name) => {
                  setDealTarget(name);
                  setActiveModal('deal');
                }}
              />
            )}

            {activeModal === 'deal' && (
              <DealSheetModal
                onClose={() => setActiveModal(null)}
                onSubmitDeal={submitDeal}
                targetName={dealTarget}
                opponents={gameState?.players?.filter(p => p.name !== username) || []}
                username={username}
              />
            )}

            {activeModal === 'playerMat' && (
              <PlayerMatModal 
                onClose={() => {
                  setActiveModal(null);
                  setIsHoverOpenedMat(false);
                }} 
                ownedCompanies={localPlayer?.ownedCompanies || []}
                isHoverOpened={isHoverOpenedMat}
                onPin={() => setIsHoverOpenedMat(false)}
              />
            )}

            {activeModal === 'mentorInventory' && (
              <MentorInventoryModal 
                onClose={() => setActiveModal(null)} 
                player={localPlayer}
                players={gameState?.players || []}
                onPlayCard={(cardId, targetPlayerId, companyName) => {
                  sendAction('play_mentor_card', { cardId, targetPlayerId, companyName });
                  setActiveModal(null);
                }}
              />
            )}


            {activeModal === 'phase3Dice' && (
              <Phase3DiceModal 
                onClose={() => setActiveModal(null)} 
                player={localPlayer} 
                sendAction={sendAction} 
                gameState={gameState} 
                roomId={roomId}
              />
            )}

          </div>
        )}

        </div>

        {/* IN-GAME TUTORIAL PROMPT MODAL */}
        {showTutorialPrompt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
            <div className="max-w-md w-full p-8 text-center bg-black/95 border border-[#d4af37]/60 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.3)]">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFE885] via-[#d4af37] to-[#8a6818] flex items-center justify-center text-black mx-auto mb-4 shadow-lg text-2xl font-black">
                ?
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">
                Would you like to play the tutorial?
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                Take a quick 1-minute interactive tour of the arena board, player roster, action bar, and trackers.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowTutorialPrompt(false);
                    setIsPlayingTutorial(true);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-[#FFE885] via-[#d4af37] to-[#8a6818] text-black font-black uppercase tracking-wider text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  YES
                </button>
                <button
                  onClick={() => {
                    setShowTutorialPrompt(false);
                    setIsPlayingTutorial(false);
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IN-GAME TUTORIAL OVERLAY */}
        {isPlayingTutorial && (
          <TutorialOverlay
            onClose={() => setIsPlayingTutorial(false)}
            initialStep={1}
            onStepChange={(stepIdx) => setTutorialStepIndex(stepIdx)}
          />
        )}

      </div>
    </GameProvider>
  );
}

export default GameBoard;