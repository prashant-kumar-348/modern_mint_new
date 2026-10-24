import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { generateMentorDeck, MentorCard } from "./mentorCardsData";
import { generateEventDeck, EventCard } from "./eventCardsData";
import { DUMMY_INVESTORS, getActiveDummyPeriod, DummyInvestorProfile } from "./dummyInvestorData";
import { pool } from "./config/database";


// In-memory game rooms dictionary
const rooms: Record<string, any> = {};

const MULTIPLIER_TABLE: Record<number, number[]> = {
  1:  [-2, -2, -1,  0],
  2:  [-2, -1,  0,  1],
  3:  [-1, -1,  0,  1],
  4:  [-1,  0,  1,  2],
  5:  [ 0,  0,  1,  2],
  6:  [ 0,  1,  2,  3],
  7:  [ 1,  1,  2,  3],
  8:  [ 1,  2,  3,  4],
  9:  [ 2,  2,  3,  4],
  10: [ 2,  3,  4,  5]
};

export const COMPANY_DATA_MAP: Record<string, number[][]> = {
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

export const getStageIndex = (stage: string | number): number => {
  if (stage === 'L' || stage === 0) return 0;
  if (stage === 'R' || stage === 1) return 1;
  if (stage === 'G' || stage === 2) return 2;
  if (stage === 'S' || stage === 3) return 3;
  return 0;
};

export interface CompanyRevenueBreakdown {
  companyName: string;
  baseRev: number;
  projectedRev: number;
  hasPR: boolean;
  sharingPlayers: number;
  dividedRev: number;
  teamLevel: number;
  multi: number;
  actualRevenue: number;
  royaltyCut: number;
  royaltyInvestorId?: string;
  royaltyInvestorName?: string;
  founderNetRevenue: number;
}

export const calculateCompanyRevenue = (
  pCompany: any,
  player: any,
  room: any,
  roll: number
): CompanyRevenueBreakdown => {
  const dataRow = COMPANY_DATA_MAP[pCompany.name];
  const stageIndex = getStageIndex(pCompany.stage);
  const baseRev = dataRow ? dataRow[stageIndex][1] : (pCompany.revenue || 0);

  // 1. PR Services doubles projected revenue for the round
  const hasPR = !!pCompany.prBoughtRound && pCompany.prBoughtRound === room.round;
  const projectedRev = hasPR ? baseRev * 2 : baseRev;

  // 2. Count sharing players (other founders who own this company at the exact same stage)
  // In Quick Mode: Ignore revenue sharing (sharingPlayers = 1), 100% of projected revenue.
  const isQuickMode = room.mode === 'short' || room.mode === 'quick';
  let sharingPlayers = 1;
  if (!isQuickMode) {
    let count = 0;
    (room.players || []).forEach((otherP: any) => {
      if (otherP.role?.toLowerCase() === 'founder') {
        const theirComp = otherP.ownedCompanies?.find(
          (c: any) => c.name?.toUpperCase().trim() === pCompany.name?.toUpperCase().trim()
        );
        if (theirComp && getStageIndex(theirComp.stage) === stageIndex) {
          count += 1;
        }
      }
    });
    if (count > 1) sharingPlayers = count;
  }

  // 3. Revenue sharing:
  // In Quick Mode: Ignore revenue sharing, 100% of projected revenue.
  // In Standard Mode: Divide projected revenue equally among sharing founders.
  const dividedRev = (!isQuickMode && sharingPlayers > 1)
    ? Math.floor(projectedRev / sharingPlayers)
    : projectedRev;

  // 4. Team Level lookup: Level 1..4 -> columns 0..3
  const teamLevel = Math.min(4, Math.max(1, Number(pCompany.teamLevel || pCompany.team) || 1));
  const teamIndex = teamLevel - 1;

  const currentRoll = Math.min(10, Math.max(1, Number(roll) || 2));
  let multi = MULTIPLIER_TABLE[currentRoll]?.[teamIndex] ?? 1;

  if (player.mentorMultiplier) {
    multi += player.mentorMultiplier;
  }

  // 5. Initial Actual Revenue
  let actualRevenue = dividedRev * multi;

  // Mentor card modifiers
  if (pCompany.doubleRevenueRound === room.round) {
    actualRevenue *= 2;
  }
  if (pCompany.techBoostRound === room.round) {
    actualRevenue += 50;
  }
  if (player.riskMultiplierActive === room.round) {
    if (currentRoll >= 5) {
      actualRevenue *= 2;
    } else if (currentRoll <= 2) {
      actualRevenue = Math.floor(actualRevenue / 2);
    }
  }

  // 6. Investor Royalty: only applies if actualRevenue > 0
  let royaltyCut = 0;
  let royaltyInvestorId: string | undefined;
  let royaltyInvestorName: string | undefined;

  if (actualRevenue > 0 && Array.isArray(room.royaltyAgreements)) {
    room.royaltyAgreements.forEach((agr: any) => {
      const isThisFounder = (agr.founderId === player.id) ||
        (agr.proposer === player.name) ||
        (agr.partner === player.name);

      if (!isThisFounder) return;

      const pct = Number(agr.royalty || (agr.percentage && !agr.equity ? agr.percentage : 0));
      if (pct <= 0) return;

      if (agr.companyName && agr.companyName.toUpperCase().trim() !== pCompany.name?.toUpperCase().trim()) {
        return;
      }

      const investor = (room.players || []).find((p: any) =>
        p.id === agr.investorId ||
        (p.name !== player.name && (p.name === agr.partner || p.name === agr.proposer))
      );

      if (investor && investor.role?.toLowerCase() === 'investor') {
        const cut = Math.floor((actualRevenue * pct) / 100);
        royaltyCut += cut;
        royaltyInvestorId = investor.id;
        royaltyInvestorName = investor.name;
      }
    });
  }

  const founderNetRevenue = actualRevenue - royaltyCut;

  return {
    companyName: pCompany.name,
    baseRev,
    projectedRev,
    hasPR,
    sharingPlayers,
    dividedRev,
    teamLevel,
    multi,
    actualRevenue,
    royaltyCut,
    royaltyInvestorId,
    royaltyInvestorName,
    founderNetRevenue
  };
};

export const computeTotalRevenue = (player: any, room: any, roll: number): number => {
  let total = 0;
  (player.ownedCompanies || []).forEach((pCompany: any) => {
    const res = calculateCompanyRevenue(pCompany, player, room, roll);
    total += res.founderNetRevenue;
  });
  return total;
};

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function calculateFinalScores(room: any) {
  const scores: any[] = [];
  const players = room.players || [];
  const agreements = room.royaltyAgreements || [];

  // Map of investorId -> accumulated equity valuation from deals
  const investorEquityMap: Record<string, number> = {};
  players.forEach((p: any) => {
    if (p.role?.toLowerCase() === 'investor') {
      investorEquityMap[p.id] = 0;
    }
  });

  // Calculate founder retained valuations and distribute investor equity
  const founderEquityMap: Record<string, number> = {};

  players.forEach((founder: any) => {
    if (founder.role?.toLowerCase() === 'founder') {
      let totalFounderRetainedValuation = 0;
      const companies = founder.ownedCompanies || [];

      companies.forEach((comp: any) => {
        const dataRow = COMPANY_DATA_MAP[comp.name];
        const stageIdx = getStageIndex(comp.stage);
        let compValuation = dataRow ? dataRow[stageIdx][2] : (comp.valuation || 0);
        if (comp.endGameValuationBoost) {
          compValuation = Math.round(compValuation * 1.2);
        }

        let equitySoldPct = 0;

        agreements.forEach((agr: any) => {
          const isThisFounder = (agr.founderId === founder.id) ||
            (agr.proposer === founder.name) ||
            (agr.partner === founder.name);

          if (!isThisFounder) return;

          const eqPct = Number(agr.equity || (agr.percentage && !agr.royalty ? agr.percentage : 0));
          if (eqPct <= 0) return;

          if (agr.companyName && agr.companyName.toUpperCase() !== comp.name.toUpperCase()) {
            return;
          }

          equitySoldPct += eqPct;

          const investor = players.find((p: any) => 
            p.id === agr.investorId || 
            (p.name !== founder.name && (p.name === agr.partner || p.name === agr.proposer))
          );

          if (investor) {
            const investorValShare = Math.round(compValuation * (eqPct / 100));
            investorEquityMap[investor.id] = (investorEquityMap[investor.id] || 0) + investorValShare;
          }
        });

        const retainedPct = Math.max(0, 100 - equitySoldPct);
        const retainedVal = Math.round(compValuation * (retainedPct / 100));
        totalFounderRetainedValuation += retainedVal;
      });

      founderEquityMap[founder.id] = totalFounderRetainedValuation;
    }
  });

  players.forEach((player: any) => {
    if (player.isDummy) return;
    const isInvestor = player.role?.toLowerCase() === 'investor';
    const equityVal = isInvestor 
      ? (investorEquityMap[player.id] || 0) 
      : (founderEquityMap[player.id] || 0);

    const cashVal = Number(player.cash) || 0;
    const loansVal = (Number(player.loan) || 0) + (Number(player.survivalLoan) || 0) + (Number(player.investorDebt) || 0);
    const receivables = isInvestor ? (Number(player.investorLoansGiven) || 0) : 0;
    const netValue = equityVal + cashVal + receivables - loansVal;

    scores.push({
      id: player.id,
      name: player.name,
      role: isInvestor ? 'Investor' : 'Founder',
      color: player.color,
      avatarId: player.avatarId || (isInvestor ? 5 : 1),
      cash: cashVal,
      equityValuation: equityVal,
      loans: loansVal,
      receivables: receivables,
      netValue: netValue
    });
  });

  // Sort: 1) netValue desc, 2) equityValuation desc, 3) cash desc, 4) loans asc
  scores.sort((a, b) => {
    if (b.netValue !== a.netValue) return b.netValue - a.netValue;
    if (b.equityValuation !== a.equityValuation) return b.equityValuation - a.equityValuation;
    if (b.cash !== a.cash) return b.cash - a.cash;
    return a.loans - b.loans;
  });

  scores.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  const founders = scores.filter(s => s.role.toLowerCase() === 'founder');
  const investors = scores.filter(s => s.role.toLowerCase() === 'investor');

  const topFounder = founders.length > 0 ? founders[0] : null;
  const topInvestor = investors.length > 0 ? investors[0] : null;

  const winners: any[] = [];

  const realPlayers = players.filter((p: any) => !p.isDummy);

  if (realPlayers.length >= 4 && topInvestor && !topInvestor.isDummy) {
    if (topFounder) {
      topFounder.isFounderWinner = true;
      winners.push(topFounder);
    }
    topInvestor.isInvestorWinner = true;
    winners.push(topInvestor);
  } else {
    if (topFounder) {
      topFounder.isFounderWinner = true;
      winners.push(topFounder);
    }
  }

  return { scores, winners };
}

export const getStartingTeamTokenPool = (playerCount: number = 4) => {
  const pools: Record<number, { 2: number; 3: number; 4: number }> = {
    2: { 2: 4, 3: 2, 4: 1 },
    3: { 2: 4, 3: 3, 4: 1 },
    4: { 2: 6, 3: 3, 4: 2 },
    5: { 2: 6, 3: 4, 4: 2 },
    6: { 2: 8, 3: 4, 4: 3 }
  };
  return pools[playerCount] ? { ...pools[playerCount] } : { 2: 12, 3: 8, 4: 4 };
};

export const AVATAR_COLORS: Record<number, string> = {
  1: '#9b2c3d', // Katana Girl - Maroon / Crimson
  2: '#e08b26', // Glasses Girl - Amber / Gold
  3: '#4a4d50', // Smiling Guy - Dark Grey / Charcoal
  4: '#2b828a', // VR Goggles Boy - Teal / Steel Blue
  5: '#00e1ff', // Investor 1 - Cyan
  6: '#d4af37', // Investor 2 - Gold
};

const createEmptyRoom = (maxPlayers = 4, mode = 'standard', difficulty = 'medium') => {
  const isQuick = mode === 'quick' || mode === 'short';
  const fullEventDeck = shuffle(generateEventDeck());
  const eventCardsToPlace = isQuick ? 1 : 2;
  const eventDeck = fullEventDeck.slice(0, eventCardsToPlace);
  return {
    players: [] as any[],
    deals: [] as any[],
    royaltyAgreements: [] as any[],
    mentorDeck: shuffle(generateMentorDeck()),
    eventDeck: eventDeck,
    activeEvent: undefined as EventCard | undefined,
    revealedEvents: {} as Record<number, EventCard>,
    dummyInvestor: null as any,
    capital: 100,
    globalLoan: 10,
    actionCount: 0,
    dealCount: 0,
    phase: 2,
    round: 1,
    turn: 'All',
    phase2TurnIndex: 0,
    isStarted: false,
    maxPlayers: maxPlayers,
    mode: mode,
    isFinished: false,
    finalScores: null as any,
    winners: null as any,
    teamTokenPool: { 2: 12, 3: 8, 4: 4 } as Record<number, number>,
    teamTokenPoolModified: false
  };
};

export function setupSocket(server: HttpServer): SocketServer {

  const allowedOrigins = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const io = new SocketServer(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      if (!origin) {
        callback(null, true);
        return;
      }

      // Local development
      const isLocal =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:");

      // Vercel deployments
      const isVercel =
        origin.endsWith(".vercel.app");

      // Explicitly configured frontend URLs
      const isAllowed =
        allowedOrigins.includes(origin);

      if (isLocal || isVercel || isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`Socket.IO CORS blocked: ${origin}`));
    },

    methods: ["GET", "POST"],

    credentials: true,
  },
});

  const applyMentorCardEffect = (player: any, room: any, card: MentorCard, targetPlayerId: string, companyName: string, socket?: Socket) => {
    const effect = card.effectType;
    let success = true;

    switch (effect) {
      case 'free_stage_up': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp) {
          comp = player.ownedCompanies.find((c: any) => getStageIndex(c.stage) < 3);
        }
        if (comp) {
          const currentIndex = getStageIndex(comp.stage);
          if (currentIndex < 3) {
            const nextStageIndex = currentIndex + 1;
            const dataRow = COMPANY_DATA_MAP[comp.name];
            const nextValuation = dataRow ? dataRow[nextStageIndex][2] : comp.valuation;
            const oldValuation = comp.valuation || 0;
            comp.stage = ['L', 'R', 'G', 'S'][nextStageIndex];
            comp.valuation = nextValuation;
            player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name}'s ${comp.name} advanced to Stage ${comp.stage} for free!`);
          } else {
            success = false;
            if (socket) socket.emit('notification', 'Company is already at maximum stage.');
          }
        } else {
          if (!player.mentorCards.some((c: any) => c.id === card.id)) {
            player.mentorCards.push(card);
            io.to(room.id).emit('notification', `MENTOR EFFECT: ${card.name} stored in inventory (activate once you own an upgradable company).`);
          }
        }
        break;
      }
      case 'add_multiplier': {
        player.mentorMultiplier = (player.mentorMultiplier || 0) + 1;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} gets +1 on company multiplier next roll!`);
        break;
      }
      case 'add_multiplier_2': {
        player.mentorMultiplier = (player.mentorMultiplier || 0) + 2;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} gets +2 on company multiplier next roll!`);
        break;
      }
      case 'free_stage_or_cash': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) {
          comp = player.ownedCompanies.find((c: any) => getStageIndex(c.stage) < 3);
        }
        if (comp && getStageIndex(comp.stage) < 3) {
          const currentIndex = getStageIndex(comp.stage);
          const nextStageIndex = currentIndex + 1;
          const dataRow = COMPANY_DATA_MAP[comp.name];
          const nextValuation = dataRow ? dataRow[nextStageIndex][2] : comp.valuation;
          const oldValuation = comp.valuation || 0;
          comp.stage = ['L', 'R', 'G', 'S'][nextStageIndex];
          comp.valuation = nextValuation;
          player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name}'s ${comp.name} advanced to Stage ${comp.stage} for free!`);
        } else {
          player.cash += 10;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} claimed $10K cash option!`);
        }
        break;
      }
      case 'free_pr': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (comp) {
          comp.freePRRound = room.round;
        } else {
          player.freePRRound = room.round;
        }
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} gets free PR ${comp ? 'for ' + comp.name : ''} this round!`);
        break;
      }
      case 'free_workforce': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (comp) {
          comp.freeWorkforceRound = room.round;
        } else {
          player.freeWorkforceRound = room.round;
        }
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} gets free workforce upgrade ${comp ? 'for ' + comp.name : ''} this round!`);
        break;
      }
      case 'shield_event': {
        player.eventShieldActive = true;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} gained an Event Shield!`);
        break;
      }
      case 'peek_events': {
        const topTwo = (room.eventDeck || []).slice(0, 2);
        if (socket) {
          socket.emit('notification', `PEEK EVENTS: Next is ${topTwo.map((e: any) => e.name).join(' & ') || 'None'}`);
        }
        break;
      }
      case 'peek_event_1': {
        const topOne = (room.eventDeck || [])[0];
        if (socket) {
          socket.emit('notification', `PEEK EVENT: Next is ${topOne ? topOne.name : 'None'}`);
        }
        break;
      }
      case 'draw_two_cards': {
        if (!room.mentorDeck || room.mentorDeck.length < 2) {
          room.mentorDeck = [...(room.mentorDeck || []), ...shuffle(generateMentorDeck())];
        }
        const cardsDrawn = [room.mentorDeck.shift(), room.mentorDeck.shift()].filter(Boolean);
        player.mentorCards.push(...cardsDrawn);
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} drew 2 Mentor cards!`);
        break;
      }
      case 'risk_multiplier': {
        player.riskMultiplierActive = room.round;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} activated Risk Multiplier for this round!`);
        break;
      }
      case 'quick_launch_retain': {
        if ((player.ownedCompanies || []).length >= 4) {
          if (socket) socket.emit('notification', 'ACTION REJECTED: Maximum of 4 company launches allowed per Founder.');
          success = false;
          break;
        }
        let targetName = companyName;
        if (!targetName || !COMPANY_DATA_MAP[targetName] || player.ownedCompanies.some((c: any) => c.name.toUpperCase() === targetName.toUpperCase())) {
          const unowned = Object.keys(COMPANY_DATA_MAP).find(name => !player.ownedCompanies.some((c: any) => c.name.toUpperCase() === name.toUpperCase()));
          if (unowned) targetName = unowned;
        }
        if (!targetName || !COMPANY_DATA_MAP[targetName]) {
          if (socket) socket.emit('notification', 'ACTION REJECTED: No available company to launch.');
          success = false;
          break;
        }
        const dataRow = COMPANY_DATA_MAP[targetName];
        const retainCost = dataRow[1][0];
        if (player.cash < retainCost) {
          if (socket) socket.emit('notification', `ACTION REJECTED: Insufficient cash ($${retainCost}K needed) to launch at Retain.`);
          success = false;
          break;
        }
        const retainValuation = dataRow[1][2];
        const retainRevenue = dataRow[1][1];

        const icons: Record<string, string> = {
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

        const newComp = {
          name: targetName,
          icon: icons[targetName] || '🏢',
          invest: retainCost,
          revenue: retainRevenue,
          valuation: retainValuation,
          loan: 0,
          stage: 'R',
          team: 1,
          teamLevel: 1,
          equityGiven: 0
        };
        player.ownedCompanies.push(newComp);
        player.cash -= retainCost;
        player.valuation += (retainValuation / 1000);
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} quick-launched ${newComp.name} directly at Retain (Stage R)!`);
        break;
      }
      case 'extra_loan': {
        player.cash += 50;
        player.loan = (player.loan || 0) + 50;
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} borrowed extra $50K from the bank.`);
        break;
      }
      case 'extra_actions': {
        player.extraActions = 2;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} has 2 extra actions this round!`);
        break;
      }
      case 'force_dice_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('initial_roll_result', { playerId: player.id, roll: 6 });
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} locked roll to 6!`);
        break;
      }
      case 'steal_cash': {
        room.players.forEach((p: any) => {
          if (p.id !== player.id) {
            const cut = Math.min(5, p.cash);
            p.cash -= cut;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
            player.cash += cut;
          }
        });
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} collected cash from players!`);
        break;
      }
      case 'half_cost_stage_up': {
        player.hasHalfCostStageUp = true;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} will pay half cost on next stage up!`);
        break;
      }
      case 'double_revenue': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          comp.doubleRevenueRound = room.round;
          io.to(room.id).emit('notification', `MENTOR EFFECT: Double revenue set on ${comp.name}!`);
        } else {
          success = false;
        }
        break;
      }
      case 'half_cost_all_stages': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (comp) {
          comp.halfCostAllStagesRound = room.round;
          io.to(room.id).emit('notification', `MENTOR EFFECT: Half stage upgrade cost set for ${comp.name}!`);
        } else {
          player.halfCostAllStagesCompany = companyName || (player.ownedCompanies[0]?.name);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Half stage upgrade cost set for ${player.name}!`);
        }
        break;
      }
      case 'tech_revenue_boost': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) {
          const techNames = ['WALLET', 'AGRI IoT', 'TRACEABILITY', 'ROBO - PACKAGING', 'SMART STORAGE', 'QUICK COMMERCE'];
          comp = player.ownedCompanies.find((c: any) => techNames.includes(c.name.toUpperCase())) || player.ownedCompanies[0];
        }
        if (comp) {
          comp.techBoostRound = room.round;
          io.to(room.id).emit('notification', `MENTOR EFFECT: Tech boost +$50K set on ${comp.name}!`);
        } else {
          success = false;
        }
        break;
      }
      case 'discard_all_mentors': {
        room.players.forEach((p: any) => {
          p.mentorCards = [];
        });
        io.to(room.id).emit('notification', `MENTOR EFFECT: ALL PLAYERS DISCARDED MENTOR CARDS!`);
        break;
      }
      case 'skip_rival_turn': {
        let target = room.players.find((p: any) => p.id === targetPlayerId && p.id !== player.id);
        if (!target) {
          const rivals = room.players.filter((p: any) => p.id !== player.id && !p.isDummy);
          if (rivals.length > 0) {
            rivals.sort((a: any, b: any) => (b.cash + b.valuation * 1000) - (a.cash + a.valuation * 1000));
            target = rivals[0];
          }
        }
        if (target) {
          target.isLocked = true;
          io.to(room.id).emit('notification', `MENTOR EFFECT: ${target.name}'s turn was skipped by Boardroom Shark!`);
        } else {
          success = false;
        }
        break;
      }
      case 'reduce_tax': {
        player.taxDiscountRound = room.round;
        io.to(room.id).emit('notification', `MENTOR EFFECT: Tax and fees reduced by 50% for ${player.name} this round!`);
        break;
      }
      case 'free_tech_invest': {
        const techCompanies = ['WALLET', 'AGRI IoT', 'TRACEABILITY', 'ROBO - PACKAGING', 'SMART STORAGE', 'QUICK COMMERCE'];
        let techComp = (player.ownedCompanies || []).find((c: any) => techCompanies.includes(c.name.toUpperCase()) && getStageIndex(c.stage) < 3);
        if (techComp) {
          const currentIndex = getStageIndex(techComp.stage);
          const nextStageIndex = currentIndex + 1;
          const dataRow = COMPANY_DATA_MAP[techComp.name];
          const nextValuation = dataRow ? dataRow[nextStageIndex][2] : techComp.valuation;
          const oldValuation = techComp.valuation || 0;
          techComp.stage = ['L', 'R', 'G', 'S'][nextStageIndex];
          techComp.valuation = nextValuation;
          player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Tech Unicorn advanced ${techComp.name} to Stage ${techComp.stage} for free!`);
        } else if ((player.ownedCompanies || []).length < 4) {
          const unownedTech = techCompanies.find(name => !player.ownedCompanies.some((c: any) => c.name.toUpperCase() === name.toUpperCase()));
          if (unownedTech && COMPANY_DATA_MAP[unownedTech]) {
            const dataRow = COMPANY_DATA_MAP[unownedTech];
            const icons: Record<string, string> = {
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
            const newTechComp = {
              name: unownedTech,
              icon: icons[unownedTech] || '🏢',
              invest: 0,
              revenue: dataRow[0][1],
              valuation: dataRow[0][2],
              loan: 0,
              stage: 'L',
              team: 1,
              teamLevel: 1,
              equityGiven: 0
            };
            player.ownedCompanies.push(newTechComp);
            player.valuation += (newTechComp.valuation / 1000);
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            io.to(room.id).emit('notification', `MENTOR EFFECT: Tech Unicorn launched ${newTechComp.name} for free!`);
          } else {
            player.cash += 50;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            io.to(room.id).emit('notification', `MENTOR EFFECT: Tech Unicorn granted $50K dividend!`);
          }
        } else {
          player.cash += 50;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Tech Unicorn granted $50K dividend!`);
        }
        break;
      }
      case 'mutual_draw': {
        let target = room.players.find((p: any) => p.id === targetPlayerId && p.id !== player.id);
        if (!target) {
          target = room.players.find((p: any) => p.id !== player.id && !p.isDummy);
        }
        if (target) {
          if (!room.mentorDeck || room.mentorDeck.length < 2) {
            room.mentorDeck = [...(room.mentorDeck || []), ...shuffle(generateMentorDeck())];
          }
          const card1 = room.mentorDeck.shift();
          const card2 = room.mentorDeck.shift();
          if (card1) player.mentorCards.push(card1);
          if (card2) target.mentorCards.push(card2);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Both ${player.name} & ${target.name} drew 1 card!`);
        } else {
          success = false;
        }
        break;
      }
      case 'halve_rival_cash': {
        let target = room.players.find((p: any) => p.id === targetPlayerId && p.id !== player.id);
        if (!target) {
          const rivals = room.players.filter((p: any) => p.id !== player.id && !p.isDummy);
          if (rivals.length > 0) {
            rivals.sort((a: any, b: any) => b.cash - a.cash);
            target = rivals[0];
          }
        }
        if (target) {
          const lost = Math.ceil(target.cash / 2);
          target.cash -= lost;
          target.capital = (target.cash / 1000) + target.valuation - (target.loan / 1000) - ((target.survivalLoan || 0) / 1000) - ((target.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Disruptor halved ${target.name}'s cash (-${lost}K)!`);
        } else {
          success = false;
        }
        break;
      }
      case 'auto_roll_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('initial_roll_result', { playerId: player.id, roll: 6 });
        io.to(room.id).emit('notification', `MENTOR EFFECT: Roll auto-set to 6!`);
        break;
      }
      case 'cash_from_total_loans': {
        let totalLoans = 0;
        room.players.forEach((p: any) => {
          totalLoans += (p.loan || 0);
        });
        const bonus = Math.round(totalLoans * 0.20);
        player.cash += bonus;
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} received $${bonus}K from total loan volume!`);
        break;
      }
      case 'end_game_valuation_boost': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) {
          comp = player.ownedCompanies[0];
        }
        if (comp) {
          comp.endGameValuationBoost = true;
          io.to(room.id).emit('notification', `MENTOR EFFECT: Valuation boost (+20%) locked in for ${comp.name} at game end!`);
        } else {
          io.to(room.id).emit('notification', `MENTOR EFFECT: Valuation boost set for ${companyName || 'company'} at game end!`);
        }
        break;
      }
      case 'sell_company_half_price': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          player.ownedCompanies = player.ownedCompanies.filter((c: any) => c.name !== comp.name);
          const refund = Math.floor((comp.valuation || 0) / 2);
          player.cash += refund;
          player.valuation -= ((comp.valuation || 0) / 1000);
          player.loan = Math.max(0, (player.loan || 0) - (comp.loan || 0));
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Sold ${comp.name} for $${refund}K.`);
        } else {
          success = false;
        }
        break;
      }
      case 'block_loans': {
        player.loansBlocked = true;
        player.loansBlockedRound = room.round;
        io.to(room.id).emit('notification', `MENTOR EFFECT: Loans blocked for ${player.name} this round!`);
        break;
      }
      case 'lose_cash_20k': {
        player.cash -= 20;
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} lost $20K cash.`);
        if (player.cash < 0) {
          const shortfall = Math.abs(player.cash);
          if (socket) socket.emit('trigger_bankruptcy', { shortfall });
          io.to(room.id).emit('notification', `BANKRUPTCY ALERT: ${player.name} went bankrupt by -$${shortfall}K!`);
        }
        break;
      }
      case 'block_stage_up': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          comp.stageUpBlockedRound = room.round;
          io.to(room.id).emit('notification', `MENTOR EFFECT: Stage upgrades blocked for ${comp.name} this round!`);
        } else {
          io.to(room.id).emit('notification', `MENTOR EFFECT: Upgrades blocked for ${companyName || 'company'}!`);
        }
        break;
      }
      case 'forced_sale': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          player.ownedCompanies = player.ownedCompanies.filter((c: any) => c.name !== comp.name);
          const refund = Math.floor((comp.valuation || 0) / 2);
          player.cash += refund;
          player.valuation -= ((comp.valuation || 0) / 1000);
          player.loan = Math.max(0, (player.loan || 0) - (comp.loan || 0));
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', `MENTOR EFFECT: Forced sale of ${comp.name} completed.`);
        } else {
          success = false;
        }
        break;
      }
      case 'lose_action': {
        player.actionCount = (player.actionCount || 0) + 1;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} lost 1 action point!`);
        break;
      }
      case 'miss_turn': {
        player.isLocked = true;
        io.to(room.id).emit('notification', `MENTOR EFFECT: ${player.name} missed their turn!`);
        break;
      }
      default: {
        success = false;
        break;
      }
    }

    return success;
  };

  const resolveAIBankruptcyIfNeeded = (player: any, room: any, io: any, roomId: string) => {
    if (player.is_ai && player.cash < 0) {
      console.log(`[AI Bankruptcy] Resolving for ${player.name}`);
      while (player.cash < 0) {
        if (player.ownedCompanies && player.ownedCompanies.length > 0) {
          const comp = player.ownedCompanies.shift();
          let totalInvested = 0;
          const compStageIndex = getStageIndex(comp.stage);
          const dataRow = COMPANY_DATA_MAP[comp.name];
          if (dataRow) {
             for (let stg = 0; stg <= compStageIndex; stg++) {
                totalInvested += dataRow[stg][0];
             }
          } else {
             totalInvested = comp.invest || 0;
          }
          const activeLoan = comp.loan || 0;
          const netProceeds = Math.max(0, totalInvested - activeLoan);

          player.cash += netProceeds;
          player.valuation = Math.max(0, player.valuation - (comp.valuation / 1000));
          player.loan = Math.max(0, player.loan - activeLoan);
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(roomId).emit('notification', `ASSET LIQUIDATION: ${player.name} sold ${comp.name} for $${netProceeds}K net proceeds.`);
        } else {
          const shortfall = Math.abs(player.cash);
          player.cash += shortfall;
          player.survivalLoan = (player.survivalLoan || 0) + shortfall;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(roomId).emit('notification', `SURVIVAL LOAN: ${player.name} accepted a $${shortfall}K survival loan.`);
        }
      }
      io.to(roomId).emit('notification', `BANKRUPTCY SOLVED: ${player.name} has resolved their shortfall.`);
    }
  };

  const addAIPlayers = (room: any) => {
    const humanPlayer = room.players[0];
    if (!humanPlayer) return;

    // Guard: never add duplicates if AI players already exist in the room
    if (room.players.some((p: any) => p.is_ai)) return;

    const names = ["Alpha Bot", "Delta Bot", "Omega Bot", "Sigma Bot"];
    const colors = ['#ef4444', '#55ffb0', '#d4af37', '#00e1ff'];
    const humanColor = humanPlayer.color;
    const humanRole = humanPlayer.role;

    const availableColors = colors.filter(c => c !== humanColor);
    const availableNames = names;

    let aiRoles: string[] = [];
    if (humanRole === 'Investor') {
      aiRoles = ['Founder', 'Founder', 'Founder'];
    } else {
      aiRoles = ['Founder', 'Founder', 'Investor'];
    }

    const availableFounderAvatars = [1, 2, 4, 3].filter(id => id !== humanPlayer.avatarId);
    const availableInvestorAvatars = [5, 6].filter(id => id !== humanPlayer.avatarId);

    for (let i = 0; i < 3; i++) {
      const role = aiRoles[i];
      const assignedAvatarId = role === 'Investor' 
        ? (availableInvestorAvatars.shift() || 5) 
        : (availableFounderAvatars.shift() || 1);
      const color = AVATAR_COLORS[assignedAvatarId] || availableColors[i % availableColors.length];
      const name = `${availableNames[i]} (${role})`;
      const startCash = role === 'Investor' ? 5000 : 1000;
      const startCapital = startCash / 1000;
      
      room.players.push({
        id: 'ai_' + Math.random().toString(36).substring(2, 15),
        name: name,
        color: color,
        isLocked: false,
        ownedCompanies: [],
        capital: startCapital,
        loan: 0,
        survivalLoan: 0,
        lastRevenueClaimed: 0,
        cash: startCash,
        valuation: 0,
        actionCount: 0,
        avatarId: assignedAvatarId,
        mentorCards: [],
        boughtMentorRound: 0,
        lifelines: 2,
        currentPhase3Roll: null,
        roundActions: [],
        role: role,
        is_ai: true
      });
    }
  };

  const playAIPhase1 = (room: any, player: any, io: any, roomId: string) => {
    const difficulty = (room.difficulty || 'medium').toLowerCase();
    console.log(`[AI Phase 1] Running for ${player.name} (Difficulty: ${difficulty})`);
    let actualLoanGranted = 0;
    let companiesString = "";

    if (player.role?.toLowerCase() === 'founder' && player.ownedCompanies.length > 0) {
      let loanThreshold = 20;
      let shouldConsiderLoan = true;
      if (difficulty === 'easy') {
        loanThreshold = 10;
        shouldConsiderLoan = Math.random() < 0.5;
      } else if (difficulty === 'hard') {
        loanThreshold = 60;
      } else if (difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
        loanThreshold = 100;
      }

      if (shouldConsiderLoan && player.cash < loanThreshold) {
        const eligible = player.ownedCompanies.filter((c: any) => c.loanTakenStage !== c.stage);
        if (eligible.length > 0) {
          let chosen = eligible[0];
          if (difficulty === 'hard' || difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
            chosen = eligible.reduce((best: any, curr: any) => {
              const bestRow = COMPANY_DATA_MAP[best.name];
              const currRow = COMPANY_DATA_MAP[curr.name];
              const bestMax = bestRow ? bestRow[getStageIndex(best.stage)][3] : 0;
              const currMax = currRow ? currRow[getStageIndex(curr.stage)][3] : 0;
              return currMax > bestMax ? curr : best;
            }, eligible[0]);
          }

          const dataRow = COMPANY_DATA_MAP[chosen.name];
          if (dataRow) {
            const stageIndex = getStageIndex(chosen.stage);
            const maxLoan = dataRow[stageIndex][3];
            if (maxLoan > 0) {
              chosen.loanTakenStage = chosen.stage;
              chosen.loan = (chosen.loan || 0) + maxLoan;
              actualLoanGranted = maxLoan;
              companiesString = chosen.name;
            }
          }
        }
      }
    }

    if (actualLoanGranted > 0) {
       player.cash += actualLoanGranted;
       player.loan += actualLoanGranted;
       player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
       io.to(roomId).emit('notification', `LOAN SUCCESS: ${player.name} borrowed $${actualLoanGranted}K against ${companiesString}.`);
    }

    if (player.isDummy) {
      player.isLocked = true;
      room.phase1TurnIndex = (room.phase1TurnIndex || 0) + 1;
      if (room.phase1TurnIndex >= room.players.length) {
         room.phase = 2;
         room.phase2TurnIndex = 0;
         room.players.forEach((p: any) => { p.isLocked = false; });
         const firstP = room.players[0];
         io.to(roomId).emit('notification', `PHASE 2 BEGINS: It is ${firstP ? firstP.name : 'Unknown'}'s turn.`);
      } else {
         const nextP = room.players[room.phase1TurnIndex];
         if (nextP) {
            io.to(roomId).emit('notification', `IT IS NOW ${nextP.name.toUpperCase()}'S TURN.`);
         }
      }
      io.to(roomId).emit('game_state_update', room);
      triggerAIIfNeeded(room, io, roomId);
      return;
    }

    player.isLocked = true;
    io.to(roomId).emit('notification', `${player.name.toUpperCase()} FINISHED ACTIONS IN PHASE 1.`);
    
    room.phase1TurnIndex = (room.phase1TurnIndex || 0) + 1;
    if (room.phase1TurnIndex >= room.players.length) {
       room.phase = 2;
       room.phase2TurnIndex = 0;
       room.players.forEach((p: any) => { p.isLocked = false; });
       const firstP = room.players[0];
       io.to(roomId).emit('notification', `PHASE 2 BEGINS: It is ${firstP ? firstP.name : 'Unknown'}'s turn.`);
    } else {
       const nextP = room.players[room.phase1TurnIndex];
       if (nextP) {
          io.to(roomId).emit('notification', `IT IS NOW ${nextP.name.toUpperCase()}'S TURN.`);
       }
    }
    io.to(roomId).emit('game_state_update', room);
    triggerAIIfNeeded(room, io, roomId);
  };

  const playAIPhase2 = (room: any, player: any, io: any, roomId: string) => {
    const difficulty = (room.difficulty || 'medium').toLowerCase();
    console.log(`[AI Phase 2] Running for ${player.name} (Difficulty: ${difficulty})`);
    
    if (player.role?.toLowerCase() === 'founder') {
      const templates = [
        'CONTRACT FARMING', 'AGRI IoT', 'WALLET', 'SNACKS', 'QUICK COMMERCE',
        'SMART STORAGE', 'RESTRO - CHAIN', 'TRACEABILITY', 'ROBO - PACKAGING'
      ];
      const preferredByDifficulty: Record<string, string[]> = {
        hard: ['RESTRO - CHAIN', 'CONTRACT FARMING', 'QUICK COMMERCE', 'SNACKS', 'WALLET'],
        unfair: ['RESTRO - CHAIN', 'CONTRACT FARMING', 'QUICK COMMERCE'],
        expert: ['RESTRO - CHAIN', 'CONTRACT FARMING', 'QUICK COMMERCE'],
        legendary: ['RESTRO - CHAIN', 'CONTRACT FARMING', 'QUICK COMMERCE']
      };

      if (player.ownedCompanies.length < 2) {
        const unowned = templates.filter(name => !player.ownedCompanies.some((c: any) => c.name === name));
        let companyName: string | null = null;

        if (difficulty === 'hard' || difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
          const pref = preferredByDifficulty[difficulty] || preferredByDifficulty.hard;
          const affordablePref = pref.filter(name => {
            const row = COMPANY_DATA_MAP[name];
            return row && unowned.includes(name) && player.cash >= row[0][0];
          });
          if (affordablePref.length > 0) {
            companyName = affordablePref[0];
          }
        }

        if (!companyName && unowned.length > 0) {
          const affordableUnowned = unowned.filter(name => {
            const row = COMPANY_DATA_MAP[name];
            return row && player.cash >= row[0][0];
          });
          if (affordableUnowned.length > 0) {
            companyName = affordableUnowned[Math.floor(Math.random() * affordableUnowned.length)];
          } else if (unowned.length > 0) {
            companyName = unowned[Math.floor(Math.random() * unowned.length)];
          }
        }

        if (companyName) {
          const dataRow = COMPANY_DATA_MAP[companyName];
          if (dataRow && player.cash >= dataRow[0][0]) {
            const stage = 'L';
            const invest = dataRow[0][0];
            const revenue = dataRow[0][1];
            const valuation = dataRow[0][2];

            const icons: Record<string, string> = {
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

            const newCompany = {
              name: companyName,
              icon: icons[companyName] || '🏢',
              invest,
              revenue,
              valuation,
              loan: 0,
              stage,
              team: 1,
              teamLevel: 1,
              equityGiven: 0
            };
            
            player.ownedCompanies.push(newCompany);
            player.valuation += (newCompany.valuation / 1000);
            player.cash -= newCompany.invest;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            
            if (room.mode !== 'quick' && room.mode !== 'short') {
              room.actionCount += 1;
              player.actionCount = (player.actionCount || 0) + 1;
            }
            
            io.to(roomId).emit('notification', `${player.name.toUpperCase()} LAUNCHED ${newCompany.name.toUpperCase()} (STAGE ${stage})`);
            io.to(roomId).emit('game_state_update', room);
          }
        }
      } else {
        // Upgrade existing companies
        let shouldUpgradeStage = true;
        if (difficulty === 'easy') {
          shouldUpgradeStage = Math.random() < 0.4;
        }

        if (shouldUpgradeStage) {
          const eligibleToUpgrade = player.ownedCompanies.filter((c: any) => getStageIndex(c.stage) < 3 && c.upgradedRound !== room.round);
          if (eligibleToUpgrade.length > 0) {
            let compToUpgrade = eligibleToUpgrade[0];
            if (difficulty === 'hard' || difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
              const affordableEligible = eligibleToUpgrade.filter((c: any) => {
                const row = COMPANY_DATA_MAP[c.name];
                return row && player.cash >= row[getStageIndex(c.stage) + 1][0];
              });
              if (affordableEligible.length > 0) {
                compToUpgrade = affordableEligible.reduce((best: any, curr: any) => {
                  const bRow = COMPANY_DATA_MAP[best.name];
                  const cRow = COMPANY_DATA_MAP[curr.name];
                  const bVal = bRow ? bRow[getStageIndex(best.stage) + 1][2] : 0;
                  const cVal = cRow ? cRow[getStageIndex(curr.stage) + 1][2] : 0;
                  return cVal > bVal ? curr : best;
                }, affordableEligible[0]);
              }
            }

            const currentIndex = getStageIndex(compToUpgrade.stage);
            const dataRow = COMPANY_DATA_MAP[compToUpgrade.name];
            if (dataRow) {
              const nextStageIndex = currentIndex + 1;
              const stageUpCost = dataRow[nextStageIndex][0];
              const nextValuation = dataRow[nextStageIndex][2];

              if (player.cash >= stageUpCost) {
                player.cash -= stageUpCost;
                compToUpgrade.stage = ['L', 'R', 'G', 'S'][nextStageIndex];
                compToUpgrade.upgradedRound = room.round;
                
                const oldValuation = compToUpgrade.valuation || 0;
                compToUpgrade.valuation = nextValuation;

                player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
                player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

                if (room.mode !== 'quick' && room.mode !== 'short') {
                  room.actionCount += 1;
                  player.actionCount = (player.actionCount || 0) + 1;
                }

                io.to(roomId).emit('notification', `${player.name.toUpperCase()} UPGRADED ${compToUpgrade.name.toUpperCase()} TO STAGE ${compToUpgrade.stage}`);
                io.to(roomId).emit('game_state_update', room);
              }
            }
          }
        }

        // Hard & Super Hard bots also leverage Workforce upgrades if they have cash & tokens
        if (difficulty === 'hard' || difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
          const maxTargetLvl = (difficulty === 'hard') ? 3 : 4;
          const cashBuffer = (difficulty === 'hard') ? 50 : 25;
          const compForWorkforce = player.ownedCompanies.find((c: any) => {
            const curLvl = Number(c.teamLevel || c.team) || 1;
            const nextLvl = curLvl + 1;
            return curLvl < maxTargetLvl && (room.teamTokenPool?.[nextLvl] || 0) > 0 && c.workforceUpgradedRound !== room.round;
          });

          if (compForWorkforce) {
            const curLvl = Number(compForWorkforce.teamLevel || compForWorkforce.team) || 1;
            const nextLvl = curLvl + 1;
            const TEAM_UPGRADE_COSTS: Record<number, number> = { 2: 50, 3: 100, 4: 200 };
            const wfCost = TEAM_UPGRADE_COSTS[nextLvl] || 50;

            if (player.cash >= (wfCost + cashBuffer) && (room.teamTokenPool?.[nextLvl] || 0) > 0) {
              player.cash -= wfCost;
              room.teamTokenPool[nextLvl] -= 1;
              room.teamTokenPoolModified = true;
              compForWorkforce.teamLevel = nextLvl;
              compForWorkforce.team = nextLvl;
              compForWorkforce.workforceUpgradedRound = room.round;
              player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

              io.to(roomId).emit('notification', `${player.name.toUpperCase()} UPGRADED WORKFORCE FOR ${compForWorkforce.name.toUpperCase()} TO LEVEL ${nextLvl}`);
              io.to(roomId).emit('game_state_update', room);
            }
          }
        }
      }
    } else {
      if (player.isDummy) {
        // Dummy investor takes no actions in Phase 2
      } else {
        let shouldBuyMentor = true;
        if (difficulty === 'easy') {
          shouldBuyMentor = Math.random() < 0.35;
        }

        if (shouldBuyMentor && player.boughtMentorRound !== room.round && player.cash >= 20) {
          player.cash -= 20;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
          player.boughtMentorRound = room.round;
          if (!room.mentorDeck || room.mentorDeck.length === 0) {
            room.mentorDeck = shuffle(generateMentorDeck());
          }
          const card = room.mentorDeck.shift();
          if (card) {
            if (card.type === 'PLAY NOW') {
              applyMentorCardEffect(player, room, card, '', '');
              io.to(roomId).emit('notification', `${player.name.toUpperCase()} PLAYED NOW: ${card.name.toUpperCase()}`);
            } else {
              player.mentorCards.push(card);
              io.to(roomId).emit('notification', `${player.name.toUpperCase()} BOUGHT AND STORED: ${card.name.toUpperCase()}`);
            }
          }
          io.to(roomId).emit('game_state_update', room);
        }

        // Hard & Super Hard bots play stored mentor cards if beneficial
        if (difficulty === 'hard' || difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
          if (player.mentorCards && player.mentorCards.length > 0) {
            const playableIdx = player.mentorCards.findIndex((c: any) => 
              c.effectType === 'add_multiplier' || c.effectType === 'add_multiplier_2' || c.effectType === 'free_stage_or_cash'
            );
            if (playableIdx !== -1) {
              const cardToPlay = player.mentorCards.splice(playableIdx, 1)[0];
              applyMentorCardEffect(player, room, cardToPlay, '', '');
              io.to(roomId).emit('notification', `${player.name.toUpperCase()} PLAYED: ${cardToPlay.name.toUpperCase()}`);
              io.to(roomId).emit('game_state_update', room);
            }
          }
        }
      }
    }

    player.isLocked = true;
    room.phase2TurnIndex = (room.phase2TurnIndex || 0) + 1;
    
    if (room.phase2TurnIndex >= room.players.length) {
       room.phase = 3;
       room.phase3TurnIndex = 0;
       room.players.forEach((p: any) => {
         p.isLocked = false;
         p.hasClaimedRevenue = false;
         p.currentPhase3Roll = null;
         if (p.loan > 0) {
            const interestRate = room.activeEvent?.effect === 'loan_interest_15' ? 0.15 : 0.10;
            const interest = Math.round(p.loan * interestRate);
            p.cash -= interest;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
            if (p.is_ai) {
               resolveAIBankruptcyIfNeeded(p, room, io, roomId);
            }
            io.to(p.id).emit('notification', `PHASE 3 START: Paid $${interest}K (${Math.round(interestRate * 100)}%) interest on your $${p.loan}K loan.`);
         }
         if (p.survivalLoan > 0) {
            const sInterest = Math.round(p.survivalLoan * 0.30);
            p.cash -= sInterest;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
            if (p.is_ai) {
               resolveAIBankruptcyIfNeeded(p, room, io, roomId);
            }
            io.to(p.id).emit('notification', `PHASE 3 START: Paid $${sInterest}K (30%) interest on your $${p.survivalLoan}K Survival Loan.`);
         }
         if (p.investorDebt > 0) {
            const agreements = (room.royaltyAgreements || []).filter((a: any) => 
              (a.founderId === p.id || a.founderName === p.name) && a.loan > 0 && !a.converted
            );
            agreements.forEach((agr: any) => {
              const invInterestRate = agr.interestRate || 0.10;
              const invInterest = Math.round(agr.loan * invInterestRate);
              if (invInterest > 0) {
                p.cash -= invInterest;
                const creditor = room.players.find((cp: any) => cp.id === agr.investorId || cp.name === agr.investorName);
                if (creditor) {
                  creditor.cash += invInterest;
                  creditor.capital = (creditor.cash / 1000) + creditor.valuation - (creditor.loan / 1000) - ((creditor.survivalLoan || 0) / 1000);
                  io.to(creditor.id).emit('notification', `LOAN INTEREST: Received ${invInterest}K interest from ${p.name}.`);
                }
                io.to(p.id).emit('notification', `PAID INVESTOR INTEREST: Paid $${invInterest}K to ${creditor ? creditor.name : 'Investor'}.`);
              }
            });
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
            if (p.is_ai) {
               resolveAIBankruptcyIfNeeded(p, room, io, roomId);
            }
         }
         if (!p.is_ai && p.cash < 0) {
            const shortfall = Math.abs(p.cash);
            io.to(p.id).emit('trigger_bankruptcy', { shortfall });
            io.to(roomId).emit('notification', `BANKRUPTCY ALERT: ${p.name} went bankrupt by -${shortfall}K due to interest payments!`);
         }
       });
       io.to(roomId).emit('notification', 'PHASE 3: REVENUE GENERATION PHASE. IT IS TIME TO ROLL THE DICE!');
    } else {
       const nextP = room.players[room.phase2TurnIndex];
       if (nextP) {
          io.to(roomId).emit('notification', `IT IS NOW ${nextP.name.toUpperCase()}'S TURN.`);
       }
    }
    io.to(roomId).emit('game_state_update', room);
    triggerAIIfNeeded(room, io, roomId);
  };

  const playAIPhase3 = (room: any, player: any, io: any, roomId: string) => {
    const difficulty = (room.difficulty || 'medium').toLowerCase();
    console.log(`[AI Phase 3] Running for ${player.name} (Difficulty: ${difficulty})`);

    let roll: number;
    if (difficulty === 'easy') {
      roll = Math.floor(Math.random() * 10) + 1;
    } else if (difficulty === 'medium') {
      roll = Math.floor(Math.random() * 10) + 1;
    } else if (difficulty === 'hard') {
      // Advantage: roll 2 dice, take higher
      const r1 = Math.floor(Math.random() * 10) + 1;
      const r2 = Math.floor(Math.random() * 10) + 1;
      roll = Math.max(r1, r2);
    } else {
      // Super Hard ('unfair' or other): Advantage with floor of 4
      const r1 = Math.floor(Math.random() * 10) + 1;
      const r2 = Math.floor(Math.random() * 10) + 1;
      roll = Math.max(r1, r2, 4);
    }

    player.currentPhase3Roll = roll;
    io.to(roomId).emit('notification', `${player.name.toUpperCase()} ROLLED A ${roll}!`);
    io.to(roomId).emit('initial_roll_result', { playerId: player.id, roll: roll });
    io.to(roomId).emit('game_state_update', room);

    // Lifeline Second Chance evaluation for AI
    let shouldUseLifeline = false;
    if (player.lifelines > 0) {
      if (difficulty === 'medium') {
        const estRevenue = computeTotalRevenue(player, room, roll);
        if (estRevenue < 0 && Math.random() < 0.5) {
          shouldUseLifeline = true;
        }
      } else if (difficulty === 'hard') {
        if (roll <= 3) {
          shouldUseLifeline = true;
        }
      } else if (difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
        if (roll <= 5) {
          shouldUseLifeline = true;
        }
      }
    }

    if (shouldUseLifeline && player.lifelines > 0) {
      player.lifelines -= 1;
      const oldRoll = roll;
      let newRoll = Math.floor(Math.random() * 10) + 1;
      if (difficulty === 'hard') {
        newRoll = Math.max(Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1);
      } else if (difficulty === 'unfair' || difficulty === 'expert' || difficulty === 'legendary') {
        newRoll = Math.max(Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1, 4);
      }

      const oldTotal = computeTotalRevenue(player, room, oldRoll);
      const newTotal = computeTotalRevenue(player, room, newRoll);
      const wasKept = newTotal > oldTotal || (newTotal === oldTotal && newRoll > oldRoll);
      if (wasKept) {
        roll = newRoll;
        player.currentPhase3Roll = roll;
      }

      io.to(roomId).emit('second_chance_result', {
        playerId: player.id,
        roll: player.currentPhase3Roll,
        remainingLifelines: player.lifelines,
        wasKept: wasKept,
        newRollTested: newRoll,
        previousRoll: oldRoll
      });
      io.to(roomId).emit('notification', `${player.name.toUpperCase()} USED SECOND CHANCE! NEW ROLL: ${newRoll} (${wasKept ? 'KEPT' : 'DISCARDED'}).`);
      io.to(roomId).emit('game_state_update', room);
    }

    setTimeout(() => {
       const currentRoom = rooms[roomId];
       if (!currentRoom) return;
       const currentPlayer = currentRoom.players.find((p: any) => p.id === player.id);
       if (!currentPlayer) return;

       const finalRoll = currentPlayer.currentPhase3Roll || roll;
       let totalActualRevenue = 0;
       if (currentPlayer.role?.toLowerCase() === 'founder') {
         (currentPlayer.ownedCompanies || []).forEach((pCompany: any) => {
           const res = calculateCompanyRevenue(pCompany, currentPlayer, currentRoom, finalRoll);
           totalActualRevenue += res.founderNetRevenue;

           // Settle investor royalty
           if (res.royaltyCut > 0 && res.royaltyInvestorId) {
             const investor = currentRoom.players.find((p: any) => p.id === res.royaltyInvestorId);
             if (investor) {
               investor.cash += res.royaltyCut;
               investor.capital = (investor.cash / 1000) + investor.valuation - (investor.loan / 1000) - ((investor.survivalLoan || 0) / 1000);
               io.to(roomId).emit('notification', `ROYALTY PAYMENT: ${investor.name} received $${res.royaltyCut}K royalty on ${currentPlayer.name}'s ${pCompany.name}.`);
             }
           }
         });
       }

       currentPlayer.lastRevenueClaimed = totalActualRevenue;
       currentPlayer.cash += totalActualRevenue;
       currentPlayer.capital = (currentPlayer.cash / 1000) + currentPlayer.valuation - (currentPlayer.loan / 1000) - ((currentPlayer.survivalLoan || 0) / 1000);
       currentPlayer.hasClaimedRevenue = true;
       currentPlayer.isLocked = true;
       currentRoom.phase3TurnIndex = (currentRoom.phase3TurnIndex || 0) + 1;

       io.to(roomId).emit('notification', `${currentPlayer.name.toUpperCase()} CLAIMED $${totalActualRevenue}K REVENUE ON DICE ROLL ${finalRoll}.`);
       resolveAIBankruptcyIfNeeded(currentPlayer, currentRoom, io, roomId);
       io.to(roomId).emit('game_state_update', currentRoom);

       const phase3Founders = currentRoom.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
       const allClaimed = phase3Founders.every((p: any) => p.hasClaimedRevenue);
       const hasBankrupt = currentRoom.players.some((p: any) => p.cash < 0);
       
       if (allClaimed && !hasBankrupt) {
          setTimeout(() => {
            if (!currentRoom.players.some((p: any) => p.cash < 0)) {
              advanceRoundOrEndGame(currentRoom, io, roomId);
            }
          }, 5000);
       } else if (!allClaimed) {
          io.to(roomId).emit('game_state_update', currentRoom);
          triggerAIIfNeeded(currentRoom, io, roomId);
       }
    }, 1500);
  };

  const triggerAIIfNeeded = (room: any, io: any, roomId: string) => {
    let activePlayer: any = null;
    if (room.phase === 1) {
      activePlayer = room.players[room.phase1TurnIndex || 0];
    } else if (room.phase === 2) {
      activePlayer = room.players[room.phase2TurnIndex || 0];
    } else if (room.phase === 3) {
      const phase3Founders = room.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
      activePlayer = phase3Founders[room.phase3TurnIndex || 0];
    }

    if (activePlayer && (activePlayer.is_ai || activePlayer.isDummy)) {
      if (activePlayer.isDummy) {
        if (room.phase === 1) playAIPhase1(room, activePlayer, io, roomId);
        else if (room.phase === 2) playAIPhase2(room, activePlayer, io, roomId);
        return;
      }
      setTimeout(() => {
        const currentRoom = rooms[roomId];
        if (!currentRoom) return;
        let currentActive: any = null;
        if (currentRoom.phase === 1) {
          currentActive = currentRoom.players[currentRoom.phase1TurnIndex || 0];
        } else if (currentRoom.phase === 2) {
          currentActive = currentRoom.players[currentRoom.phase2TurnIndex || 0];
        } else if (currentRoom.phase === 3) {
          const currentPhase3Founders = currentRoom.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
          currentActive = currentPhase3Founders[currentRoom.phase3TurnIndex || 0];
        }
        
        if (currentActive && currentActive.is_ai) {
          if (currentRoom.phase === 1 && !currentActive.isLocked) {
            playAIPhase1(currentRoom, currentActive, io, roomId);
          } else if (currentRoom.phase === 2 && !currentActive.isLocked) {
            playAIPhase2(currentRoom, currentActive, io, roomId);
          } else if (currentRoom.phase === 3 && !currentActive.hasClaimedRevenue) {
            playAIPhase3(currentRoom, currentActive, io, roomId);
          }
        }
      }, 2000);
    }
  };

  const advanceRoundOrEndGame = (room: any, io: any, roomId: string) => {
    const maxRounds = (room.mode === 'short' || room.mode === 'quick') ? 6 : 9;
    if (room.round >= maxRounds) {
      const { scores, winners } = calculateFinalScores(room);
      room.isFinished = true;
      room.finalScores = scores;
      room.winners = winners;
      io.to(roomId).emit('notification', `GAME OVER: Round ${maxRounds} Completed! Final Net Values Calculated.`);
      io.to(roomId).emit('game_state_update', room);
      io.to(roomId).emit('game_over', { scores, winners });
      return;
    }

    room.round += 1;
    room.phase = 1;
    room.actionCount = 0;
    room.dealCount = 0;
    room.phase1TurnIndex = 0;
    room.phase2TurnIndex = 0;
    room.phase3TurnIndex = 0;

    // Section J: In Standard Mode, sort Founder order by ascending Action Points for next round.
    // Tie-break: player who went earlier in previous round goes earlier.
    if (room.mode !== 'quick' && room.mode !== 'short') {
      const founders = (room.players || []).filter((p: any) => p.role?.toLowerCase() === 'founder');
      const realInvestors = (room.players || []).filter((p: any) => p.role?.toLowerCase() !== 'founder' && !p.isDummy);
      const dummyInvestors = (room.players || []).filter((p: any) => p.isDummy);
      
      founders.forEach((f: any, idx: number) => { f._prevOrder = idx; });
      founders.sort((a: any, b: any) => {
        const diff = (a.actionCount || 0) - (b.actionCount || 0);
        if (diff !== 0) return diff;
        return (a._prevOrder || 0) - (b._prevOrder || 0);
      });
      founders.forEach((f: any) => { delete f._prevOrder; });
      room.players = [...realInvestors, ...founders, ...dummyInvestors];
    }

    room.players.forEach((p: any) => {
      p.isLocked = false;
      p.hasClaimedRevenue = false;
      p.currentPhase3Roll = null;
      p.mentorMultiplier = 0;
      p.riskMultiplierActive = 0;
      p.extraActions = 0;
      p.actionCount = 0;
      p.roundActions = [];
      p.loansBlocked = false;
      p.loansBlockedRound = undefined;
      p.hasHalfCostStageUp = false;
      p.taxDiscountRound = undefined;
      p.freePRRound = undefined;
      p.freeWorkforceRound = undefined;
      p.halfCostAllStagesCompany = undefined;
      (p.ownedCompanies || []).forEach((c: any) => {
        c.freePRRound = undefined;
        c.freeWorkforceRound = undefined;
        c.stageUpBlockedRound = undefined;
        c.halfCostAllStagesRound = undefined;
        c.doubleRevenueRound = undefined;
        c.techBoostRound = undefined;
      });
    });

    const firstPlayer = room.players[0];
    io.to(roomId).emit('notification', `PHASE 1 BEGINS: It is ${firstPlayer ? firstPlayer.name : 'Unknown'}'s turn.`);

    if (room.round === 4 || (room.round === 7 && room.mode !== 'quick' && room.mode !== 'short')) {
      room.activeEvent = room.eventDeck.shift();
      if (room.activeEvent) {
        if (!room.revealedEvents) room.revealedEvents = {};
        room.revealedEvents[room.round] = room.activeEvent;
        io.to(roomId).emit('notification', `MARKET SHOCK (ROUND ${room.round} EVENT): ${room.activeEvent.name} — ${room.activeEvent.description}`);
        
        if (room.activeEvent.effect === 'immediate_stimulus_100') {
          room.players.forEach((p: any) => {
            const compCount = (p.ownedCompanies || []).length;
            if (compCount > 0) {
              const bonus = compCount * 100;
              p.cash += bonus;
              p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
              io.to(p.id).emit('notification', `ECONOMIC STIMULUS: Received ${bonus}K ($100K x ${compCount} companies)!`);
            }
          });
        } else if (room.activeEvent.effect === 'immediate_tax_50') {
          room.players.forEach((p: any) => {
            if (p.role?.toLowerCase() === 'founder' && !p.isDummy) {
              if (p.eventShieldActive) {
                p.eventShieldActive = false;
                io.to(p.id).emit('notification', `GUARDIAN SHIELD: Blocked Regulatory Audit $50K fee!`);
              } else {
                let tax = 50;
                if (p.taxDiscountRound === room.round) {
                  tax = 25;
                }
                p.cash -= tax;
                p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                io.to(p.id).emit('notification', `REGULATORY AUDIT: Paid ${tax}K compliance audit fee.`);
                if (!p.is_ai && p.cash < 0) {
                  io.to(p.id).emit('trigger_bankruptcy', { shortfall: Math.abs(p.cash) });
                }
              }
            }
          });
        }
      }
      
      const fundAmount = room.round === 4 ? 5000 : 10000;
      room.players.forEach((p: any) => {
         if (p.role?.toLowerCase() === 'investor' && !p.isDummy) {
            p.cash += fundAmount;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000);
            io.to(roomId).emit('notification', `INVESTOR FUNDING: ${p.name} received ${fundAmount}K!`);
         }
      });
    }
    io.to(roomId).emit('game_state_update', room);
    triggerAIIfNeeded(room, io, roomId);
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomId, username, role, avatarId, maxPlayers, isVsAi, mode, difficulty }) => {
      console.log(`Socket ${socket.id} is attempting to join room ${roomId} as username: "${username}" with role: "${role}" and avatarId: ${avatarId}`);
      if (!rooms[roomId]) {
        rooms[roomId] = createEmptyRoom(maxPlayers || 4, mode || 'standard', difficulty || 'medium');
      } else if (difficulty && (!rooms[roomId].difficulty || rooms[roomId].difficulty === 'medium')) {
        rooms[roomId].difficulty = difficulty;
      } else if (mode && !rooms[roomId].mode) {
        rooms[roomId].mode = mode;
      }
      
      socket.join(roomId);
      const roomState = rooms[roomId];
      if (maxPlayers && maxPlayers > 0) {
        roomState.maxPlayers = maxPlayers;
      }
      
      let finalRole = role ? (role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()) : 'Founder';
      if (finalRole === 'Investor') {
         const investorCount = roomState.players.filter((p: any) => p.role === 'Investor').length;
         if (investorCount >= 2) {
            finalRole = 'Founder';
            socket.emit('notification', 'Maximum 2 Investors reached. You have joined as a Founder.');
         }
      }
      
      const existingPlayer = username ? roomState.players.find((p: any) => p.name === username) : null;
      if (existingPlayer) {
        if (existingPlayer.id !== socket.id) {
          console.log(`Found existing player "${username}" with old socket ID ${existingPlayer.id}. Reconnecting to new socket ID ${socket.id}.`);
          const activeSocket = io.sockets.sockets.get(existingPlayer.id);
          if (activeSocket) {
            console.log(`Force-disconnecting old active socket ${existingPlayer.id} for "${username}".`);
            activeSocket.disconnect(true);
          }
          existingPlayer.id = socket.id;
          if (role && existingPlayer.role !== role) {
             existingPlayer.role = finalRole;
          }
        } else {
          console.log(`Socket ${socket.id} is already registered as "${username}".`);
        }
        if (avatarId) {
          existingPlayer.avatarId = avatarId;
          if (AVATAR_COLORS[avatarId]) {
            existingPlayer.color = AVATAR_COLORS[avatarId];
          }
        }
      } else {
        console.log(`Creating new player entry for "${username}" with socket ID ${socket.id} and avatarId ${avatarId}`);

        const startCash = finalRole === 'Investor' ? 5000 : 1000;
        const startCapital = startCash / 1000;
        const playerColors = ['#ef4444', '#55ffb0', '#d4af37', '#00e1ff', '#b06aff', '#ff7a2a'];
        const finalAvatarId = avatarId || (finalRole === 'Investor' ? 5 : 1);
        const playerColor = AVATAR_COLORS[finalAvatarId] || playerColors[roomState.players.length % playerColors.length];
        roomState.players.push({
          id: socket.id,
          name: username || `Player ${roomState.players.length + 1}`,
          color: playerColor,
          isLocked: false,
          ownedCompanies: [],
          capital: startCapital,
          loan: 0,
          survivalLoan: 0,
          lastRevenueClaimed: 0,
          cash: startCash,
          valuation: 0,
          actionCount: 0,
          avatarId: finalAvatarId,
          mentorCards: [],
          boughtMentorRound: 0,
          lifelines: 2,
          currentPhase3Roll: null,
          roundActions: [],
          role: finalRole,
          is_ai: false
        });
        
        // Singleplayer / VS AI mode only
        if (isVsAi) {
          roomState.isVsAi = true;
          if (roomState.players.filter((p: any) => p.is_ai).length === 0) {
            addAIPlayers(roomState);
          }
          roomState.isStarted = true;
          if (!roomState.teamTokenPoolModified) {
            roomState.teamTokenPool = getStartingTeamTokenPool(roomState.players.length);
          }
        }

        // Multiplayer: Start game automatically ONLY when all player slots are full
        if (!roomState.isStarted && roomState.players.length >= (roomState.maxPlayers || 4)) {
          roomState.isStarted = true;
          if (!roomState.teamTokenPoolModified) {
            roomState.teamTokenPool = getStartingTeamTokenPool(roomState.players.length);
          }
          io.to(roomId).emit('notification', 'All player slots are filled! The game is starting now!');
        }
      }

      io.to(roomId).emit('game_state_update', roomState);
      
      if (roomState.isStarted) {
        if (roomState.round === 1) {
          setTimeout(() => {
            socket.emit('notification', 'ROUND 1: SKIPPING INVESTMENT PHASE. START BUILDING YOUR EMPIRE!');
          }, 1000);
        }
        
        triggerAIIfNeeded(roomState, io, roomId);
      }
    });

    socket.on('start_game', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && !room.isStarted && room.players.length >= 2) {
        room.isStarted = true;
        const realPlayers = room.players.filter((p: any) => !p.isDummy);
        if (!room.teamTokenPoolModified) {
          room.teamTokenPool = getStartingTeamTokenPool(realPlayers.length);
        }
        
        // Dummy Investor setup for 2-3 player games without human investors
        const realInvestors = realPlayers.filter((p: any) => p.role?.toLowerCase() === 'investor');
        if (realPlayers.length <= 3 && realInvestors.length === 0) {
          const selected = DUMMY_INVESTORS[Math.floor(Math.random() * DUMMY_INVESTORS.length)];
          room.dummyInvestor = { ...selected };
          
          const dummyPlayer = {
            id: 'dummy_investor',
            name: `${selected.name} (Dummy)`,
            role: 'Investor',
            isDummy: true,
            cash: 10000,
            capital: 10,
            loan: 0,
            survivalLoan: 0,
            valuation: 0,
            ownedCompanies: [],
            color: '#00e1ff',
            avatarId: 5,
            isLocked: true
          };
          
          if (!room.players.some((p: any) => p.id === 'dummy_investor')) {
            room.players.push(dummyPlayer);
          }
          io.to(roomId).emit('notification', `DUMMY INVESTOR SETUP: ${selected.name} active for 2–3 player game.`);
        }

        // Section J.1 & K.3: Round 1 order is random in Standard Mode. In Quick Mode, players keep clockwise seating order.
        if (room.mode !== 'quick' && room.mode !== 'short') {
          shuffle(room.players);
        }
        io.to(roomId).emit('game_state_update', room);
        io.to(roomId).emit('notification', 'Game started by host!');
        if (room.round === 1) {
          setTimeout(() => {
            io.to(roomId).emit('notification', 'ROUND 1: SKIPPING INVESTMENT PHASE. START BUILDING YOUR EMPIRE!');
          }, 1000);
        }
        triggerAIIfNeeded(room, io, roomId);
      }
    });

    socket.on('take_loan', ({ roomId, amount, loanBreakdown, companiesString }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player && loanBreakdown && Array.isArray(loanBreakdown)) {
          if (player.loansBlocked || player.loansBlockedRound === room.round) {
             socket.emit('notification', 'ACTION REJECTED: You are blocked from taking loans this round.');
             return;
          }
          const activePlayer = room.players[room.phase1TurnIndex || 0];
          if (room.phase === 1 && (!activePlayer || activePlayer.id !== socket.id)) {
             socket.emit('notification', 'ACTION REJECTED: It is not your turn!');
             return;
          }

          let actualLoanGranted = 0;
          
          loanBreakdown.forEach((req: any) => {
             const companyName = req.companyName;
             const comp = player.ownedCompanies.find((c: any) => c.name === companyName);
             if (comp) {
               const dataRow = COMPANY_DATA_MAP[comp.name];
               const stageIdx = getStageIndex(comp.stage);
               const maxStageLoan = dataRow ? dataRow[stageIdx][3] : 0;
               const canBorrow = comp.loanTakenStage !== comp.stage || (comp.loan || 0) === 0;
               if (canBorrow) {
                 const reqAmount = Number(req.amount) || 0;
                 const grantAmount = Math.min(reqAmount, maxStageLoan);
                 if (grantAmount > 0) {
                   actualLoanGranted += grantAmount;
                   comp.loanTakenStage = comp.stage;
                   comp.loan = (comp.loan || 0) + grantAmount;
                 }
               }
             }
          });

          if (actualLoanGranted > 0) {
             player.cash += actualLoanGranted;
             player.loan = (player.loan || 0) + actualLoanGranted;
             player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
             
             // Rule D.1 & D.7: Bank loans do NOT consume Action Points!
             
             io.to(roomId).emit('game_state_update', room);
             io.to(roomId).emit('notification', `LOAN SUCCESS: ${player.name} borrowed $${actualLoanGranted}K against ${companiesString}.`);
          } else {
             socket.emit('notification', 'LOAN REJECTED: You have already taken loans for the current stages of these companies or invalid amount.');
          }
        }
      }
    });

    socket.on('repay_loan', ({ roomId, amount }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        const repayAmt = Number(amount) || 0;
        if (player && repayAmt > 0 && player.cash >= repayAmt) {
          let remainingRepayment = repayAmt;
          
          // 1. Repay Survival Loan first (highest interest: 30%)
          if (player.survivalLoan > 0) {
            const payToSurvival = Math.min(player.survivalLoan, remainingRepayment);
            player.survivalLoan -= payToSurvival;
            remainingRepayment -= payToSurvival;
          }
          
          // 2. Repay standard bank loan with remainder
          if (remainingRepayment > 0 && player.loan > 0) {
            const payToStandard = Math.min(player.loan, remainingRepayment);
            player.loan -= payToStandard;
            remainingRepayment -= payToStandard;

            // Reduce comp.loan proportionally across companies with active loans
            let compRepayRemaining = payToStandard;
            for (const comp of (player.ownedCompanies || [])) {
              if (comp.loan > 0 && compRepayRemaining > 0) {
                const compPay = Math.min(comp.loan, compRepayRemaining);
                comp.loan -= compPay;
                compRepayRemaining -= compPay;
              }
            }
          }

          // 3. Repay investor loan with remainder (if any)
          if (remainingRepayment > 0 && player.investorDebt > 0) {
            const payToInvestorDebt = Math.min(player.investorDebt, remainingRepayment);
            player.investorDebt -= payToInvestorDebt;
            remainingRepayment -= payToInvestorDebt;

            const loanAgr = (room.royaltyAgreements || []).find((a: any) => 
              (a.founderId === player.id || a.founderName === player.name) && a.loan > 0
            );
            if (loanAgr) {
              const creditor = room.players.find((p: any) => p.id === loanAgr.investorId || p.name === loanAgr.investorName);
              if (creditor) {
                creditor.cash += payToInvestorDebt;
                creditor.investorLoansGiven = Math.max(0, (creditor.investorLoansGiven || 0) - payToInvestorDebt);
                creditor.capital = (creditor.cash / 1000) + creditor.valuation - (creditor.loan / 1000) - ((creditor.survivalLoan || 0) / 1000);
              }
              loanAgr.loan = Math.max(0, loanAgr.loan - payToInvestorDebt);
            }
          }
          
          const totalRepaid = repayAmt - remainingRepayment;
          if (totalRepaid > 0) {
            player.cash -= totalRepaid;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            io.to(roomId).emit('notification', `${player.name} repaid $${totalRepaid}K in loans.`);
            io.to(roomId).emit('game_state_update', room);
          }
        } else {
          socket.emit('notification', 'ACTION REJECTED: Insufficient cash or invalid amount.');
        }
      }
    });

    socket.on('transfer_cash', ({ roomId, targetPlayerId, amount }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const sender = room.players.find((p: any) => p.id === socket.id);
        const receiver = room.players.find((p: any) => p.id === targetPlayerId);
        const transferAmt = Number(amount) || 0;
        if (sender && receiver && transferAmt > 0) {
           if (sender.cash < transferAmt) {
             socket.emit('notification', 'INSUFFICIENT FUNDS: Cannot transfer more cash than you have!');
             return;
           }
           sender.cash -= transferAmt;
           receiver.cash += transferAmt;
           
           sender.capital = (sender.cash / 1000) + sender.valuation - (sender.loan / 1000) - ((sender.survivalLoan || 0) / 1000) - ((sender.investorDebt || 0) / 1000);
           receiver.capital = (receiver.cash / 1000) + receiver.valuation - (receiver.loan / 1000) - ((receiver.survivalLoan || 0) / 1000) - ((receiver.investorDebt || 0) / 1000);
           
           io.to(roomId).emit('notification', `${sender.name} transferred $${transferAmt}K to ${receiver.name}.`);
           io.to(roomId).emit('game_state_update', room);
        }
      }
    });

    socket.on('force_next_phase', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const currentPhase = room.phase;
        room.phase = currentPhase < 3 ? currentPhase + 1 : 1;
        room.players.forEach((p: any) => p.isLocked = false);
        
        io.to(roomId).emit('notification', `ADMIN FORCED TRANSITION TO PHASE ${room.phase}`);
        io.to(roomId).emit('game_state_update', room);
        if (room.phase === 3) {
          triggerAIIfNeeded(room, io, roomId);
        } else {
          triggerAIIfNeeded(room, io, roomId);
        }
      }
    });

    const processAcceptedDeal = (room: any, proposalData: any, socket: any, io: any, roomId: string) => {
      if (!room || !proposalData) return;

      const proposer = room.players.find((p: any) => 
        (proposalData.proposerId && p.id === proposalData.proposerId) || 
        (proposalData.proposer && p.name?.toLowerCase() === proposalData.proposer.toLowerCase()) || 
        (proposalData.proposerName && p.name?.toLowerCase() === proposalData.proposerName.toLowerCase())
      );
      const partner = room.players.find((p: any) => 
        (proposalData.partnerId && p.id === proposalData.partnerId) || 
        (proposalData.targetPlayerId && p.id === proposalData.targetPlayerId) || 
        (proposalData.partner && p.name?.toLowerCase() === proposalData.partner.toLowerCase()) || 
        (proposalData.partnerName && p.name?.toLowerCase() === proposalData.partnerName.toLowerCase())
      );

      let founder: any;
      let investor: any;

      if (proposalData.founderId && proposalData.investorId) {
        founder = room.players.find((p: any) => p.id === proposalData.founderId);
        investor = room.players.find((p: any) => p.id === proposalData.investorId);
      } else if (proposer && partner) {
        if (proposer.role?.toLowerCase() === 'investor') {
          investor = proposer;
          founder = partner;
        } else if (partner.role?.toLowerCase() === 'investor') {
          investor = partner;
          founder = proposer;
        } else {
          founder = proposer;
          investor = partner;
        }
      }

      if (!founder || !investor) {
        socket.emit('notification', 'DEAL REJECTED: Parties to the deal could not be resolved.');
        return;
      }

      const rawCash = Number(proposalData.cash) || 0;
      const cashAmount = (rawCash > 0 && rawCash < 10) ? Math.round(rawCash * 1000) : Math.round(rawCash);

      const rawLoan = Number(proposalData.loan) || 0;
      const loanAmount = (rawLoan > 0 && rawLoan < 10) ? Math.round(rawLoan * 1000) : Math.round(rawLoan);

      const equityPct = Number(proposalData.equity) || 0;
      const royaltyPct = Number(proposalData.royalty || proposalData.percentage) || 0;
      const terms = String(proposalData.terms || '');
      let companyName = proposalData.companyName || '';

      let targetComp = (founder.ownedCompanies || []).find((c: any) => 
        companyName && c.name?.toUpperCase().trim() === companyName.toUpperCase().trim()
      );
      if (!targetComp && terms && founder.ownedCompanies?.length) {
        targetComp = founder.ownedCompanies.find((c: any) => 
          terms.toUpperCase().includes(c.name?.toUpperCase().trim())
        );
      }
      if (!targetComp && founder.ownedCompanies?.length === 1) {
        targetComp = founder.ownedCompanies[0];
      }
      if (targetComp) {
        companyName = targetComp.name;
      }

      // Equity limit check (Rule D.5)
      if (equityPct > 0) {
        if (!targetComp) {
          socket.emit('notification', 'DEAL REJECTED: Founder must have launched a company to sell equity.');
          return;
        }
        const currentEquityGiven = targetComp.equityGiven || 0;
        if (currentEquityGiven + equityPct > 100) {
          socket.emit('notification', `DEAL REJECTED: Equity limit exceeded! Only ${100 - currentEquityGiven}% remaining in ${targetComp.name}.`);
          return;
        }
      }

      // Cash check (Rule D.2)
      if (cashAmount > 0) {
        if (investor.cash < cashAmount) {
          socket.emit('notification', `INSUFFICIENT FUNDS: ${investor.name} does not have $${cashAmount}K to complete this deal!`);
          return;
        }
        investor.cash -= cashAmount;
        founder.cash += cashAmount;
      }

      // Apply equity transfer
      if (equityPct > 0 && targetComp) {
        targetComp.equityGiven = (targetComp.equityGiven || 0) + equityPct;
      }

      // Apply investor loan (Rule D.4.c, I.7)
      if (loanAmount > 0) {
        founder.investorDebt = (founder.investorDebt || 0) + loanAmount;
        investor.investorLoansGiven = (investor.investorLoansGiven || 0) + loanAmount;
      }

      // Convertible note check (Rule D.4.e)
      const isConvertible = terms.toLowerCase().includes('convert') || Boolean(proposalData.convertible);

      const agreementRecord = {
        id: `agreement_${Date.now()}`,
        dealId: proposalData.id || `deal_${Date.now()}`,
        founderId: founder.id,
        founderName: founder.name,
        investorId: investor.id,
        investorName: investor.name,
        companyName: companyName,
        equity: equityPct,
        royalty: royaltyPct,
        loan: loanAmount,
        interestRate: Number(proposalData.interestRate) || 0.10,
        terms: terms,
        convertible: isConvertible,
        converted: false,
        partnerSigned: true,
        roundAgreed: room.round
      };

      if (!room.royaltyAgreements) room.royaltyAgreements = [];
      room.royaltyAgreements.push(agreementRecord);

      if (room.deals) {
        const existingDeal = room.deals.find((d: any) => d.id === proposalData.id);
        if (existingDeal) {
          existingDeal.status = 'accepted';
        }
      }

      founder.capital = (founder.cash / 1000) + founder.valuation - (founder.loan / 1000) - ((founder.survivalLoan || 0) / 1000) - ((founder.investorDebt || 0) / 1000);
      investor.capital = (investor.cash / 1000) + investor.valuation - (investor.loan / 1000) - ((investor.survivalLoan || 0) / 1000);

      room.dealCount = (room.dealCount || 0) + 1;
      io.to(roomId).emit('game_state_update', room);
      io.to(roomId).emit('notification', `DEAL FORMALIZED: ${investor.name} & ${founder.name} closed deal on ${companyName || 'Portfolio'}!`);
    };

    const processRejectedDeal = (room: any, proposalData: any, socket: any, io: any, roomId: string) => {
      if (!room || !proposalData) return;
      const proposer = room.players.find((p: any) => 
        (proposalData.proposerId && p.id === proposalData.proposerId) || 
        (proposalData.proposer && p.name?.toLowerCase() === proposalData.proposer.toLowerCase()) || 
        (proposalData.proposerName && p.name?.toLowerCase() === proposalData.proposerName.toLowerCase())
      );
      if (room.deals) {
        const existingDeal = room.deals.find((d: any) => d.id === proposalData.id);
        if (existingDeal) {
          existingDeal.status = 'rejected';
        }
      }
      if (proposer) {
        io.to(proposer.id).emit('notification', `Proposal was rejected.`);
      }
      io.to(roomId).emit('game_state_update', room);
    };

    socket.on('offer_deal', ({ roomId, targetPlayer, cash, loan }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.id === socket.id);
        const partner = room.players.find((p: any) => p.name === targetPlayer);
        
        if (proposer && partner) {
           const newDeal = {
              id: `deal_${Date.now()}`,
              proposer: proposer.name,
              partner: partner.name,
              cash: Number(cash) || 0,
              loan: Number(loan) || 0,
              status: 'pending'
           };
           room.deals.push(newDeal);
           io.to(roomId).emit('game_state_update', room);
           io.to(roomId).emit('notification', `NEW DEAL SHEET: ${proposer.name} offered a deal to ${partner.name}.`);
        }
      }
    });

    socket.on('propose_royalty_deal', ({ roomId, proposerName, partnerName, cash, equity, loan, royalty, terms, companyName }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.name === proposerName);
        const partner = room.players.find((p: any) => p.name === partnerName);

        // Dummy Investor automated evaluation
        if (proposer && partner && partner.isDummy) {
           const activePeriod = getActiveDummyPeriod(room.round, room.dummyInvestor);
           if (!activePeriod) {
              socket.emit('notification', `DUMMY INVESTOR: No investment available in Round ${room.round}.`);
              return;
           }

           const requestedCash = Number(cash) || 0;
           const offeredEquity = Number(equity) || 0;

           if (requestedCash > activePeriod.maxFunding) {
              socket.emit('notification', `DUMMY INVESTOR REJECTED: Maximum funding for ${activePeriod.rounds} is ${activePeriod.maxFunding}K.`);
              return;
           }

           if (offeredEquity < activePeriod.equityRequired) {
              socket.emit('notification', `DUMMY INVESTOR REJECTED: ${partner.name} requires at least ${activePeriod.equityRequired}% equity for ${activePeriod.rounds}.`);
              return;
           }

           const targetComp = (proposer.ownedCompanies || []).find((c: any) => c.name?.toUpperCase().trim() === (companyName || '').toUpperCase().trim());
           if (targetComp && (targetComp.equityGiven || 0) + offeredEquity > 100) {
              socket.emit('notification', `ACTION REJECTED: Aggregate equity for ${targetComp.name} cannot exceed 100%.`);
              return;
           }

           const proposalId = `proposal_${Date.now()}`;
           const dummyProposal = {
              id: proposalId,
              proposerId: proposer.id,
              proposer: proposerName,
              proposerName: proposerName,
              partnerId: partner.id,
              partner: partnerName,
              partnerName: partnerName,
              founderId: proposer.id,
              investorId: partner.id,
              cash: requestedCash,
              equity: offeredEquity,
              loan: Number(loan) || 0,
              royalty: Number(royalty) || 0,
              terms: terms || '',
              companyName: companyName || '',
              proposerSigned: true,
              partnerSigned: true
           };
           processAcceptedDeal(room, dummyProposal, socket, io, roomId);
           io.to(roomId).emit('notification', `DUMMY INVESTOR ACCEPTED: ${partner.name} funded ${requestedCash}K in ${proposer.name}'s ${companyName} for ${offeredEquity}% equity!`);
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        if (proposer && partner) {
          const proposalId = `proposal_${Date.now()}`;
          const royaltyProposal = {
            id: proposalId,
            proposerId: proposer.id,
            proposer: proposerName,
            proposerName: proposerName,
            partnerId: partner.id,
            partner: partnerName,
            partnerName: partnerName,
            founderId: proposer.role?.toLowerCase() === 'founder' ? proposer.id : partner.id,
            investorId: proposer.role?.toLowerCase() === 'investor' ? proposer.id : partner.id,
            cash: Number(cash) || 0,
            equity: Number(equity) || 0,
            loan: Number(loan) || 0,
            royalty: Number(royalty) || 0,
            terms: terms || '',
            companyName: companyName || '',
            proposerSigned: true,
            partnerSigned: false
          };

          const newDeal = {
            id: proposalId,
            proposer: proposerName,
            partner: partnerName,
            cash: Number(cash) || 0,
            equity: Number(equity) || 0,
            loan: Number(loan) || 0,
            royalty: Number(royalty) || 0,
            terms: terms || '',
            companyName: companyName || '',
            status: 'pending'
          };
          room.deals.push(newDeal);

          io.to(partner.id).emit('royalty_proposal_received', royaltyProposal);
          io.to(roomId).emit('game_state_update', room);
          io.to(roomId).emit('notification', `NEW DEAL SHEET: ${proposer.name} offered a deal to ${partner.name}.`);

          if (partner.is_ai) {
            setTimeout(() => {
              const currentRoom = rooms[roomId];
              if (!currentRoom) return;
              const curProposer = currentRoom.players.find((p: any) => p.name === proposer.name);
              const curPartner = currentRoom.players.find((p: any) => p.name === partner.name);
              if (!curPartner) return;

              const cashReq = Number(royaltyProposal.cash) || 0;
              const eqOffered = Number(royaltyProposal.equity) || 0;
              const royOffered = Number(royaltyProposal.royalty) || 0;

              // AI accepts if they have enough cash and either get >= 5% equity or >= 5% royalty or loan with interest
              if (cashReq <= curPartner.cash && (eqOffered >= 5 || royOffered >= 5 || Number(royaltyProposal.loan) > 0)) {
                processAcceptedDeal(currentRoom, royaltyProposal, null, io, roomId);
                io.to(roomId).emit('notification', `DEAL ACCEPTED: ${curPartner.name} accepted the deal proposal from ${curProposer ? curProposer.name : 'Founder'}!`);
              } else {
                processRejectedDeal(currentRoom, royaltyProposal, null, io, roomId);
                io.to(roomId).emit('notification', `DEAL DECLINED: ${curPartner.name} declined the deal proposal from ${curProposer ? curProposer.name : 'Founder'}.`);
              }
            }, 1500);
          }
        }
      }
    });

    socket.on('accept_royalty_deal', ({ roomId, proposal }) => {
      if (rooms[roomId]) {
        processAcceptedDeal(rooms[roomId], proposal, socket, io, roomId);
      }
    });

    socket.on('reject_royalty_deal', ({ roomId, proposal }) => {
      if (rooms[roomId]) {
        processRejectedDeal(rooms[roomId], proposal, socket, io, roomId);
      }
    });

    socket.on('propose_royalty_agreement', ({ roomId, targetPlayerId, founderId, investorId, companyName, percentage }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.id === socket.id);
        const targetPlayer = room.players.find((p: any) => p.id === targetPlayerId);

        // Handle Dummy Investor automated deal evaluation
        if (targetPlayer && targetPlayer.isDummy) {
           const activePeriod = getActiveDummyPeriod(room.round, room.dummyInvestor);
           if (!activePeriod) {
              socket.emit('notification', `DUMMY INVESTOR: No investment available in Round ${room.round}.`);
              return;
           }

           const pct = Number(percentage) || 0;
           if (pct < activePeriod.equityRequired) {
              socket.emit('notification', `DUMMY INVESTOR REJECTED: ${targetPlayer.name} requires at least ${activePeriod.equityRequired}% for ${activePeriod.rounds}.`);
              return;
           }

           const founder = room.players.find((p: any) => p.id === founderId);
           const targetComp = (founder?.ownedCompanies || []).find((c: any) => c.name?.toUpperCase().trim() === companyName.toUpperCase().trim());
           if (targetComp && (targetComp.equityGiven || 0) + pct > 100) {
              socket.emit('notification', 'ACTION REJECTED: Aggregate equity cannot exceed 100%.');
              return;
           }

           const grantCash = activePeriod.maxFunding;
           if (!room.royaltyAgreements) room.royaltyAgreements = [];
           room.royaltyAgreements.push({
              id: `agr_${Date.now()}`,
              founderId: founderId,
              founderName: founder?.name || 'Founder',
              investorId: targetPlayer.id,
              investorName: targetPlayer.name,
              companyName: companyName,
              percentage: pct,
              equity: pct,
              cash: grantCash,
              loan: 0,
              royalty: 0,
              converted: false
           });
           if (targetComp) {
              targetComp.equityGiven = (targetComp.equityGiven || 0) + pct;
           }
           if (founder) {
              founder.cash += grantCash;
              founder.capital = (founder.cash / 1000) + founder.valuation - (founder.loan / 1000) - ((founder.survivalLoan || 0) / 1000) - ((founder.investorDebt || 0) / 1000);
           }
           io.to(roomId).emit('notification', `DUMMY INVESTOR DEAL COMPLETED: ${targetPlayer.name} granted ${grantCash}K to ${founder?.name} for ${pct}% equity in ${companyName}!`);
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        if (proposer && targetPlayer) {
           const proposalId = `proposal_${Date.now()}`;
           io.to(targetPlayerId).emit('royalty_proposal_received', {
             id: proposalId,
             proposerId: proposer.id,
             proposerName: proposer.name,
             founderId,
             investorId,
             companyName,
             percentage
           });
           socket.emit('notification', `Proposed ${percentage}% royalty deal to ${targetPlayer.name}`);
        }
      }
    });

    socket.on('accept_royalty_agreement', (req: any) => {
      const roomId = req?.roomId;
      if (roomId && rooms[roomId]) {
        processAcceptedDeal(rooms[roomId], req, socket, io, roomId);
      }
    });

    socket.on('reject_royalty_agreement', (req: any) => {
      const roomId = req?.roomId;
      if (roomId && rooms[roomId]) {
        processRejectedDeal(rooms[roomId], req, socket, io, roomId);
      }
    });

    socket.on('claim_revenue', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        
        if (player && !player.hasClaimedRevenue) {
           const currentRoll = player.currentPhase3Roll || 2;
           let totalActualRevenue = 0;

           (player.ownedCompanies || []).forEach((pCompany: any) => {
              const res = calculateCompanyRevenue(pCompany, player, room, currentRoll);
              totalActualRevenue += res.founderNetRevenue;

              // Settle investor royalty
              if (res.royaltyCut > 0 && res.royaltyInvestorId) {
                 const investor = room.players.find((p: any) => p.id === res.royaltyInvestorId);
                 if (investor) {
                    investor.cash += res.royaltyCut;
                    investor.capital = (investor.cash / 1000) + investor.valuation - (investor.loan / 1000) - ((investor.survivalLoan || 0) / 1000);
                    io.to(roomId).emit('notification', `ROYALTY: ${investor.name} received $${res.royaltyCut}K royalty on ${player.name}'s ${pCompany.name}.`);
                 }
              }
           });

           player.lastRevenueClaimed = totalActualRevenue;
           player.cash += totalActualRevenue;
           player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
           player.hasClaimedRevenue = true;
           player.isLocked = true;
           room.phase3TurnIndex = (room.phase3TurnIndex || 0) + 1;

           io.to(roomId).emit('game_state_update', room);
           io.to(roomId).emit('notification', `${player.name.toUpperCase()} CLAIMED $${totalActualRevenue}K REVENUE ON DICE ROLL ${currentRoll}.`);

           if (player.cash < 0) {
              const shortfall = Math.abs(player.cash);
              socket.emit('trigger_bankruptcy', { shortfall });
              io.to(roomId).emit('notification', `BANKRUPTCY ALERT: ${player.name} went bankrupt by -$${shortfall}K!`);
           }

           const phase3Founders = room.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
           const allClaimed = phase3Founders.every((p: any) => p.hasClaimedRevenue);
           const hasBankrupt = room.players.some((p: any) => p.cash < 0);
           
           if (allClaimed && !hasBankrupt) {
              setTimeout(() => {
                if (!room.players.some((p: any) => p.cash < 0)) {
                  advanceRoundOrEndGame(room, io, roomId);
                }
              }, 5000);
           } else if (!allClaimed) {
              triggerAIIfNeeded(room, io, roomId);
           }
        }
      }
    });

    socket.on('phase2_action', ({ roomId, actionType, companyName, cost, teamColor, targetPlayerId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        
        if (player) {
           const activePlayer = room.players[room.phase2TurnIndex || 0];
           if (!activePlayer || activePlayer.id !== socket.id) {
              socket.emit('notification', 'ACTION REJECTED: It is not your turn!');
              return;
           }

           if (actionType === 'launch') {
               const dataRow = COMPANY_DATA_MAP[companyName];
               if (dataRow) {
                  if ((player.ownedCompanies || []).length >= 4) {
                     socket.emit('notification', 'ACTION REJECTED: Maximum of 4 company launches allowed per Founder.');
                     return;
                  }
                  if (player.ownedCompanies.some((c: any) => c.name.toUpperCase() === companyName.toUpperCase())) {
                     socket.emit('notification', 'ACTION REJECTED: You already own this company.');
                     return;
                  }
                  const stage = 'L';
                  const invest = dataRow[0][0];
                  if (player.cash < invest) {
                     socket.emit('notification', 'ACTION REJECTED: Insufficient cash to launch company.');
                     return;
                  }
                  const revenue = dataRow[0][1];
                  const valuation = dataRow[0][2];
                  const loan = 0;

                  const icons: Record<string, string> = {
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

                  const newCompany = {
                    name: companyName,
                    icon: icons[companyName] || '🏢',
                    invest,
                    revenue,
                    valuation,
                    loan: 0,
                    stage,
                    team: 1,
                    teamLevel: 1,
                    equityGiven: 0
                  };
                  
                  player.ownedCompanies.push(newCompany);
                  player.valuation += (newCompany.valuation / 1000);
                  player.cash -= newCompany.invest;
                  player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
                  
                  if (!player.roundActions) player.roundActions = [];
                  player.roundActions.push({
                    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    type: 'launch',
                    companyName: newCompany.name,
                    text: `Launched ${newCompany.name}`,
                    cost: newCompany.invest,
                    round: room.round,
                    timestamp: Date.now()
                  });

                  room.actionCount += 1;
                  player.actionCount = (player.actionCount || 0) + 1;
                  
                  io.to(roomId).emit('game_state_update', room);
                  io.to(roomId).emit('notification', `${player.name.toUpperCase()} LAUNCHED ${newCompany.name.toUpperCase()} (STAGE ${stage})`);
               }
           } else if (actionType === 'stage_up') {
              const comp = player.ownedCompanies.find((c: any) => c.name === companyName);
              if (comp) {
                 if (comp.stageUpBlockedRound === room.round) {
                    socket.emit('notification', `ACTION REJECTED: ${comp.name} is blocked from staging up this round due to Toxic Mentor.`);
                    return;
                 }
                 if (comp.upgradedRound === room.round) {
                    socket.emit('notification', 'ACTION REJECTED: Company already staged up this round.');
                    return;
                 }
                 const currentIndex = getStageIndex(comp.stage);
                 if (currentIndex < 3) {
                    const dataRow = COMPANY_DATA_MAP[comp.name];
                    if (dataRow) {
                       const nextStageIndex = currentIndex + 1;
                       let stageUpCost = dataRow[nextStageIndex][0];
                       if (player.hasHalfCostStageUp || comp.halfCostAllStagesRound === room.round || player.halfCostAllStagesCompany === comp.name) {
                          stageUpCost = Math.round(stageUpCost / 2);
                          if (player.hasHalfCostStageUp) player.hasHalfCostStageUp = false;
                       }
                       if (player.cash < stageUpCost) {
                          socket.emit('notification', 'ACTION REJECTED: Insufficient cash to stage up company.');
                          return;
                       }
                       const nextValuation = dataRow[nextStageIndex][2];

                       player.cash -= stageUpCost;
                       
                       comp.stage = ['L', 'R', 'G', 'S'][nextStageIndex];
                       comp.upgradedRound = room.round;
                       
                       const oldValuation = comp.valuation || 0;
                       comp.valuation = nextValuation;

                       player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
                       player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

                       // Rule D.4.e: Check and trigger Convertible Note conversion on stage up
                       const unconvertedNotes = (room.royaltyAgreements || []).filter((a: any) => 
                         (a.founderId === player.id || a.founderName === player.name) &&
                         (!a.companyName || a.companyName.toUpperCase().trim() === comp.name.toUpperCase().trim()) &&
                         a.convertible && !a.converted
                       );
                       unconvertedNotes.forEach((note: any) => {
                         const equityGain = note.equity || 10;
                         note.converted = true;
                         player.investorDebt = Math.max(0, (player.investorDebt || 0) - (note.loan || 0));
                         const investor = room.players.find((p: any) => p.id === note.investorId || p.name === note.investorName);
                         if (investor) {
                           investor.investorLoansGiven = Math.max(0, (investor.investorLoansGiven || 0) - (note.loan || 0));
                           investor.capital = (investor.cash / 1000) + investor.valuation - (investor.loan / 1000);
                         }
                         comp.equityGiven = Math.min(100, (comp.equityGiven || 0) + equityGain);
                         io.to(roomId).emit('notification', `CONVERTIBLE NOTE: ${investor ? investor.name : 'Investor'}'s $${note.loan || 0}K loan converted into ${equityGain}% equity in ${comp.name}!`);
                       });

                       const stageName = ['Launch', 'Retain', 'Grow', 'Scale'][nextStageIndex] || 'Retain';
                       if (!player.roundActions) player.roundActions = [];
                       player.roundActions.push({
                         id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                         type: 'stage_up',
                         companyName: comp.name,
                         stageName: stageName,
                         text: `${comp.customName || comp.name} Upgraded to ${stageName} stage`,
                         cost: stageUpCost,
                         round: room.round,
                         timestamp: Date.now()
                       });

                       room.actionCount += 1;
                       player.actionCount = (player.actionCount || 0) + 1;

                       io.to(roomId).emit('game_state_update', room);
                       io.to(roomId).emit('notification', `${player.name.toUpperCase()} UPGRADED ${comp.name.toUpperCase()} TO STAGE ${comp.stage}`);
                    }
                 } else {
                    socket.emit('notification', 'MAX STAGE REACHED: Company is already at maximum level.');
                 }
              }
            } else if (actionType === 'buy_pr') {
               const comp = player.ownedCompanies.find((c: any) => c.name === companyName);
               if (comp) {
                  if (comp.prBoughtRound === room.round) {
                     socket.emit('notification', 'ACTION REJECTED: Max 1 PR Service per company per round.');
                     return;
                  }
                  const currentLvl = Math.min(4, Math.max(1, Number(comp.teamLevel || comp.team) || 1));
                  const prCosts = [100, 300, 500, 700];
                  let actualCost = prCosts[currentLvl - 1] || 100;
                  if (comp.freePRRound === room.round || player.freePRRound === room.round) {
                     actualCost = 0;
                  } else {
                     if (player.taxDiscountRound === room.round) {
                        actualCost = Math.round(actualCost / 2);
                     }
                     if (room.activeEvent?.effect === 'pr_discount_100') {
                        actualCost = Math.max(0, actualCost - 100);
                     }
                  }
                  if (player.cash < actualCost) {
                     socket.emit('notification', 'ACTION REJECTED: Insufficient cash to buy PR services.');
                     return;
                  }
                  
                  player.cash -= actualCost;
                  comp.prBoughtRound = room.round;
                  player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
                  
                  if (!player.roundActions) player.roundActions = [];
                  player.roundActions.push({
                    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    type: 'buy_pr',
                    companyName: comp.name,
                    text: `Bought PR Services for ${comp.customName || comp.name}`,
                    cost: actualCost,
                    round: room.round,
                    timestamp: Date.now()
                  });

                  room.actionCount += 1;
                  player.actionCount = (player.actionCount || 0) + 1;
                  
                  io.to(roomId).emit('game_state_update', room);
                  io.to(roomId).emit('notification', `${player.name.toUpperCase()} BOUGHT PR SERVICES FOR ${comp.name.toUpperCase()}`);
               }
            } else if (actionType === 'upgrade_workforce') {
               const comp = player.ownedCompanies.find((c: any) => c.name === companyName);
               if (comp) {
                  if (comp.workforceUpgradedRound === room.round) {
                     socket.emit('notification', 'ACTION REJECTED: Max 1 Workforce Upgrade per company per round.');
                     return;
                  }
                  const currentLvl = Math.min(4, Math.max(1, Number(comp.teamLevel || comp.team) || 1));
                  if (currentLvl >= 4) {
                     socket.emit('notification', 'ACTION REJECTED: Workforce is already at maximum level 4.');
                     return;
                  }
                  const nextLvl = currentLvl + 1;

                  // Rule E.3: Check shared Team Token pool availability
                  if (!room.teamTokenPool) {
                     room.teamTokenPool = { 2: 12, 3: 8, 4: 4 };
                  }
                  if ((room.teamTokenPool[nextLvl] || 0) <= 0) {
                     socket.emit('notification', `ACTION REJECTED: No Level ${nextLvl} Team Tokens remaining in the shared pool!`);
                     return;
                  }

                  // Authoritative upgrade costs from Founder Player Mat
                  const TEAM_UPGRADE_COSTS: Record<number, number> = {
                     2: 50,
                     3: 100,
                     4: 200
                  };
                  let actualCost = TEAM_UPGRADE_COSTS[nextLvl] || 50;
                  if (comp.freeWorkforceRound === room.round || player.freeWorkforceRound === room.round) {
                     actualCost = 0;
                  } else if (room.activeEvent?.effect === 'workforce_discount_half') {
                     actualCost = Math.round(actualCost / 2);
                  }

                  if (player.cash < actualCost) {
                     socket.emit('notification', 'ACTION REJECTED: Insufficient cash to upgrade workforce.');
                     return;
                  }
                  
                  player.cash -= actualCost;
                  // Deduct token from shared pool (Rule E.3: permanently consumed from pool)
                  room.teamTokenPool[nextLvl] -= 1;
                  room.teamTokenPoolModified = true;

                  comp.teamLevel = nextLvl;
                  comp.team = nextLvl;
                  comp.workforceUpgradedRound = room.round;
                  player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
                  
                  if (!player.roundActions) player.roundActions = [];
                  player.roundActions.push({
                    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    type: 'upgrade_workforce',
                    companyName: comp.name,
                    text: `Upgraded Workforce for ${comp.customName || comp.name} to Level ${nextLvl}`,
                    cost: actualCost,
                    targetLevel: nextLvl,
                    round: room.round,
                    timestamp: Date.now()
                  });

                  room.actionCount += 1;
                  player.actionCount = (player.actionCount || 0) + 1;
                  
                  io.to(roomId).emit('game_state_update', room);
                  io.to(roomId).emit('notification', `${player.name.toUpperCase()} UPGRADED WORKFORCE FOR ${comp.name.toUpperCase()} TO LEVEL ${nextLvl}`);
               }
            }
        }
      }
    });

    socket.on('lock_phase1', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        
        if (player) {
           player.isLocked = true;
           io.to(roomId).emit('game_state_update', room);
           io.to(roomId).emit('notification', `${player.name.toUpperCase()} FINISHED ACTIONS IN PHASE 1.`);

           const activePlayer = room.players[room.phase1TurnIndex || 0];
           if (activePlayer && activePlayer.id === socket.id) {
              room.phase1TurnIndex = (room.phase1TurnIndex || 0) + 1;
              
              if (room.phase1TurnIndex >= room.players.length) {
                 room.phase = 2;
                 room.phase2TurnIndex = 0;
                 
                 room.players.forEach((p: any) => {
                   p.isLocked = false;
                 });
                 
                 const firstP = room.players[0];
                 io.to(roomId).emit('notification', `PHASE 2 BEGINS: It is ${firstP ? firstP.name : 'Unknown'}'s turn.`);
              } else {
                 const nextP = room.players[room.phase1TurnIndex];
                 if (nextP) {
                    io.to(roomId).emit('notification', `IT IS NOW ${nextP.name.toUpperCase()}'S TURN.`);
                 }
              }
              io.to(roomId).emit('game_state_update', room);
              triggerAIIfNeeded(room, io, roomId);
           }
        }
      }
    });

    socket.on('end_phase2_turn', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        
        if (player) {
           player.isLocked = true;
           io.to(roomId).emit('game_state_update', room);

           const activePlayer = room.players[room.phase2TurnIndex || 0];
           if (activePlayer && activePlayer.id === socket.id) {
              room.phase2TurnIndex = (room.phase2TurnIndex || 0) + 1;
              
              if (room.phase2TurnIndex >= room.players.length) {
                 room.phase = 3;
                 room.phase3TurnIndex = 0;
                 
                 room.players.forEach((p: any) => {
                   p.isLocked = false;
                   p.hasClaimedRevenue = false;
                   p.currentPhase3Roll = null;
                   
                   if (p.loan > 0) {
                      const interestRate = room.activeEvent?.effect === 'loan_interest_15' ? 0.15 : 0.10;
                       const interest = Math.round(p.loan * interestRate);
                      p.cash -= interest;
                      p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                      if (p.is_ai) {
                         resolveAIBankruptcyIfNeeded(p, room, io, roomId);
                      }
                      io.to(p.id).emit('notification', `PHASE 3 START: Paid $${interest}K (${Math.round(interestRate * 100)}%) interest on your $${p.loan}K loan.`);
                   }
                   if (p.survivalLoan > 0) {
                      const sInterest = Math.round(p.survivalLoan * 0.30);
                      p.cash -= sInterest;
                      p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                      if (p.is_ai) {
                         resolveAIBankruptcyIfNeeded(p, room, io, roomId);
                      }
                      io.to(p.id).emit('notification', `PHASE 3 START: Paid $${sInterest}K (30%) interest on your $${p.survivalLoan}K Survival Loan.`);
                   }
                   if (p.investorDebt > 0) {
                      const agreements = (room.royaltyAgreements || []).filter((a: any) => 
                        (a.founderId === p.id || a.founderName === p.name) && a.loan > 0 && !a.converted
                      );
                      agreements.forEach((agr: any) => {
                        const invInterestRate = agr.interestRate || 0.10;
                        const invInterest = Math.round(agr.loan * invInterestRate);
                        if (invInterest > 0) {
                          p.cash -= invInterest;
                          const creditor = room.players.find((cp: any) => cp.id === agr.investorId || cp.name === agr.investorName);
                          if (creditor) {
                            creditor.cash += invInterest;
                            creditor.capital = (creditor.cash / 1000) + creditor.valuation - (creditor.loan / 1000) - ((creditor.survivalLoan || 0) / 1000);
                            io.to(creditor.id).emit('notification', `LOAN INTEREST: Received $${invInterest}K interest from ${p.name}.`);
                          }
                          io.to(p.id).emit('notification', `PAID INVESTOR INTEREST: Paid $${invInterest}K to ${creditor ? creditor.name : 'Investor'}.`);
                        }
                      });
                      p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                      if (p.is_ai) {
                         resolveAIBankruptcyIfNeeded(p, room, io, roomId);
                      }
                   }
                   if (!p.is_ai && p.cash < 0) {
                      const shortfall = Math.abs(p.cash);
                      io.to(p.id).emit('trigger_bankruptcy', { shortfall });
                      io.to(roomId).emit('notification', `BANKRUPTCY ALERT: ${p.name} went bankrupt by -${shortfall}K due to interest payments!`);
                   }
                 });
                 
                 io.to(roomId).emit('notification', 'PHASE 3: REVENUE GENERATION PHASE. IT IS TIME TO ROLL THE DICE!');
              } else {
                 const nextP = room.players[room.phase2TurnIndex];
                 if (nextP) {
                    io.to(roomId).emit('notification', `IT IS NOW ${nextP.name.toUpperCase()}'S TURN.`);
                 }
              }
              io.to(roomId).emit('game_state_update', room);
              triggerAIIfNeeded(room, io, roomId);
           }
        }
      }
    });

    socket.on('lock_turn', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
           player.isLocked = true;
           io.to(roomId).emit('game_state_update', room);
           
           const activePlayer = room.players[room.phase3TurnIndex || 0];
           if (activePlayer && activePlayer.id === socket.id) {
              room.phase3TurnIndex = (room.phase3TurnIndex || 0) + 1;
              
              if (room.phase3TurnIndex >= room.players.length) {
                 io.to(roomId).emit('notification', 'ROUND ENDED: Proceeding to next round.');
              }
              io.to(roomId).emit('game_state_update', room);
              triggerAIIfNeeded(room, io, roomId);
           }
        }
      }
    });

    socket.on('initial_roll', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
           const roll = Math.floor(Math.random() * 10) + 1;
           player.currentPhase3Roll = roll;

           io.to(roomId).emit('game_state_update', room);
           io.to(roomId).emit('initial_roll_result', { playerId: player.id, roll: roll });
           io.to(roomId).emit('notification', `${player.name.toUpperCase()} ROLLED A ${roll}!`);
        }
      }
    });

    socket.on('second_chance_roll', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (!player) return;

        if (player.role?.toLowerCase() !== 'founder') {
           socket.emit('notification', 'ACTION REJECTED: Second Chance is only available to Founders.');
           return;
        }

        if (player.hasClaimedRevenue) {
           socket.emit('notification', 'ACTION REJECTED: Revenue has already been claimed for this round.');
           return;
        }

        if (player.currentPhase3Roll === null || player.currentPhase3Roll === undefined) {
           socket.emit('notification', 'ACTION REJECTED: Must roll initial dice before using Second Chance.');
           return;
        }

        if (player.lifelines <= 0) {
           return;
        }

        player.lifelines -= 1;
        const oldRoll = player.currentPhase3Roll;
        const newRoll = Math.floor(Math.random() * 10) + 1;
        
        const oldTotal = computeTotalRevenue(player, room, oldRoll);
        const newTotal = computeTotalRevenue(player, room, newRoll);
        
        const wasKept = newTotal > oldTotal || (newTotal === oldTotal && newRoll > oldRoll);
        if (wasKept) {
           player.currentPhase3Roll = newRoll;
        }
        
        io.to(roomId).emit('game_state_update', room);
        io.to(roomId).emit('second_chance_result', { 
           playerId: player.id,
           roll: player.currentPhase3Roll, 
           remainingLifelines: player.lifelines,
           wasKept: wasKept,
           newRollTested: newRoll,
           previousRoll: oldRoll
        });
        io.to(roomId).emit('notification', `${player.name.toUpperCase()} USED SECOND CHANCE! NEW ROLL: ${newRoll} (${wasKept ? 'KEPT' : 'DISCARDED'}).`);
      }
    });

    socket.on('roll_dice', ({ roomId, playerRoll }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
           const finalRoll = player.currentPhase3Roll || playerRoll || Math.floor(Math.random() * 10) + 1;
           player.currentPhase3Roll = finalRoll;
           
           io.to(roomId).emit('game_state_update', room);
           io.to(roomId).emit('initial_roll_result', { playerId: player.id, roll: finalRoll });
           io.to(roomId).emit('notification', `${player.name.toUpperCase()} ROLLED A ${finalRoll}!`);
        }
      }
    });

    socket.on('buy_mentor_card', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
           if (player.boughtMentorRound === room.round) {
              socket.emit('notification', 'ACTION REJECTED: You can only buy 1 mentor card per round.');
              return;
           }

           player.cash -= 20;
           player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
           player.boughtMentorRound = room.round;

           const card = room.mentorDeck.shift();
           if (card) {
              if (card.type === 'PLAY NOW') {
                 // Instant Execution (Play Now Cards)
                 socket.emit('mentor_card_drawn', card);
                 applyMentorCardEffect(player, room, card, '', '', socket);
                 io.to(roomId).emit('notification', `${player.name.toUpperCase()} PLAYED NOW: ${card.name.toUpperCase()}`);
              } else {
                 // Storage & Deferred Execution (Play Anytime Cards)
                 player.mentorCards.push(card);
                 io.to(roomId).emit('notification', `${player.name.toUpperCase()} BOUGHT AND STORED: ${card.name.toUpperCase()}`);
              }
           }

           if (!player.roundActions) player.roundActions = [];
           player.roundActions.push({
             id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
             type: 'mentor',
             cardName: card?.name || 'Mentor Card',
             text: card?.name || 'Mentor Card',
             cost: 20,
             round: room.round,
             timestamp: Date.now(),
             cardId: card?.id
           });
           if (room.mode !== 'quick' && room.mode !== 'short') {
             room.actionCount = (room.actionCount || 0) + 1;
             player.actionCount = (player.actionCount || 0) + 1;
           }
           
           io.to(roomId).emit('game_state_update', room);
        }
      }
    });

    socket.on('play_mentor_card', ({ roomId, cardId, targetPlayerId, companyName }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player) {
           const cardIndex = player.mentorCards.findIndex((c: any) => c.id === cardId);
           if (cardIndex !== -1) {
              const card = player.mentorCards[cardIndex];
              const success = applyMentorCardEffect(player, room, card, targetPlayerId, companyName, socket);
              if (success) {
                 player.mentorCards.splice(cardIndex, 1);
                 io.to(roomId).emit('game_state_update', room);
                 io.to(roomId).emit('notification', `${player.name.toUpperCase()} PLAYED: ${card.name.toUpperCase()}`);
              }
           }
        }
      }
    });

    socket.on('undo_action', ({ roomId, actionId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (!player || !player.roundActions) return;

        const actIndex = player.roundActions.findIndex((a: any) => a.id === actionId);
        if (actIndex === -1) return;
        const action = player.roundActions[actIndex];

        if (action.type === 'launch') {
          const wasUpgraded = player.roundActions.some((a: any, i: number) => i > actIndex && a.companyName === action.companyName);
          if (wasUpgraded) {
            socket.emit('notification', 'CANNOT UNDO: Revert subsequent upgrades on this company first.');
            return;
          }
          const compIdx = player.ownedCompanies.findIndex((c: any) => c.name === action.companyName);
          if (compIdx !== -1) {
            const comp = player.ownedCompanies[compIdx];
            player.cash += comp.invest;
            player.valuation -= (comp.valuation / 1000);
            player.loan -= comp.loan;
            player.ownedCompanies.splice(compIdx, 1);
          }
        } else if (action.type === 'stage_up') {
          const comp = player.ownedCompanies.find((c: any) => c.name === action.companyName);
          if (comp) {
            const currentIndex = getStageIndex(comp.stage);
            if (currentIndex > 0) {
              const prevIndex = currentIndex - 1;
              const dataRow = COMPANY_DATA_MAP[comp.name];
              if (dataRow) {
                player.cash += action.cost;
                const oldValuation = comp.valuation || 0;
                const oldLoan = comp.loan || 0;
                comp.stage = ['L', 'R', 'G', 'S'][prevIndex];
                comp.upgradedRound = 0;
                comp.valuation = dataRow[prevIndex][2];
                comp.loan = dataRow[prevIndex][3];
                player.valuation = player.valuation - (oldValuation / 1000) + (comp.valuation / 1000);
                player.loan = player.loan - oldLoan + comp.loan;
              }
            }
          }
        } else if (action.type === 'buy_pr') {
          const comp = player.ownedCompanies.find((c: any) => c.name === action.companyName);
          if (comp) {
            comp.prBoughtRound = 0;
            player.cash += action.cost;
          }
        } else if (action.type === 'upgrade_workforce') {
          const comp = player.ownedCompanies.find((c: any) => c.name === action.companyName);
          if (comp) {
            const currentLvl = Number(comp.teamLevel || comp.team) || 2;
            const prevLvl = Math.max(1, currentLvl - 1);
            if (room.teamTokenPool && action.targetLevel) {
               room.teamTokenPool[action.targetLevel] = (room.teamTokenPool[action.targetLevel] || 0) + 1;
            } else if (room.teamTokenPool && currentLvl > 1) {
               room.teamTokenPool[currentLvl] = (room.teamTokenPool[currentLvl] || 0) + 1;
            }
            comp.teamLevel = prevLvl;
            comp.team = prevLvl;
            comp.workforceUpgradedRound = 0;
            player.cash += action.cost;
          }
        } else if (action.type === 'mentor') {
          player.cash += action.cost || 20;
          player.boughtMentorRound = 0;
          if (action.cardId) {
            const cIdx = player.mentorCards.findIndex((c: any) => c.id === action.cardId);
            if (cIdx !== -1) {
              player.mentorCards.splice(cIdx, 1);
            }
          }
        }

        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
        if (room.mode !== 'quick' && room.mode !== 'short') {
          player.actionCount = Math.max(0, (player.actionCount || 1) - 1);
          room.actionCount = Math.max(0, (room.actionCount || 1) - 1);
        }

        player.roundActions.splice(actIndex, 1);

        io.to(roomId).emit('game_state_update', room);
        io.to(roomId).emit('notification', `ACTION UNDONE: ${action.text}`);
      }
    });

    socket.on('resolve_bankruptcy', ({ roomId, option, companyName }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (!player) return;

        const opt = (option || '').toLowerCase().trim();

        const checkAdvanceIfAllResolved = () => {
          if (room.phase === 3) {
            const phase3Founders = room.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
            const allClaimed = phase3Founders.every((p: any) => p.hasClaimedRevenue);
            const anyBankrupt = room.players.some((p: any) => p.cash < 0);
            if (allClaimed && !anyBankrupt) {
              setTimeout(() => {
                if (!room.players.some((p: any) => p.cash < 0)) {
                  advanceRoundOrEndGame(room, io, roomId);
                }
              }, 2000);
            }
          }
        };

        // Option 1: Crack a Deal (Check Balance)
        if (opt === 'crack_deal') {
           if (player.cash >= 0) {
              socket.emit('bankruptcy_cleared');
              io.to(roomId).emit('notification', `BANKRUPTCY SOLVED: ${player.name} resolved their shortfall through a deal.`);
              checkAdvanceIfAllResolved();
           } else {
              socket.emit('notification', `CRACK A DEAL: Cash is still negative (${player.cash}K). Negotiate or transfer more funds first.`);
           }
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        // Option 3: Survival Bank Loan
        if (opt === 'survival_loan' || opt === 'loan') {
           if (player.cash < 0) {
              const shortfall = Math.abs(player.cash);
              player.cash += shortfall;
              player.survivalLoan = (player.survivalLoan || 0) + shortfall;
              player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

              io.to(roomId).emit('notification', `SURVIVAL LOAN: ${player.name} took a ${shortfall}K survival bank loan at 30% interest.`);
              socket.emit('bankruptcy_cleared');
              io.to(roomId).emit('notification', `BANKRUPTCY SOLVED: ${player.name} has resolved their shortfall.`);
              checkAdvanceIfAllResolved();
           } else {
              socket.emit('bankruptcy_cleared');
           }
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        // Option 4: Restart (wipe portfolio and reset cash to $500K)
        if (opt === 'restart') {
           player.ownedCompanies = [];
           player.valuation = 0;
           player.cash = 500;
           player.loan = 0;
           player.survivalLoan = 0;
           player.investorDebt = 0;
           player.capital = (player.cash / 1000) + player.valuation;

           socket.emit('bankruptcy_cleared');
           io.to(roomId).emit('notification', `RESTART: ${player.name} wiped their portfolio and restarted with $500K.`);
           io.to(roomId).emit('notification', `BANKRUPTCY SOLVED: ${player.name} has resolved their shortfall.`);
           checkAdvanceIfAllResolved();
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        // Option 2: Sell a Company
        if ((opt === 'sell_company' || opt === 'sell') && companyName) {
           const compIndex = (player.ownedCompanies || []).findIndex((c: any) => c.name?.toUpperCase().trim() === companyName.toUpperCase().trim());
           if (compIndex !== -1) {
              const comp = player.ownedCompanies[compIndex];
              const compStageIndex = getStageIndex(comp.stage);
              
              let totalInvested = 0;
              const dataRow = COMPANY_DATA_MAP[comp.name];
              if (dataRow) {
                 for (let stg = 0; stg <= compStageIndex; stg++) {
                    totalInvested += dataRow[stg][0];
                 }
              } else {
                 totalInvested = comp.invest || 0;
              }

              const activeLoan = comp.loan || 0;
              const netProceeds = Math.max(0, totalInvested - activeLoan);

              player.ownedCompanies.splice(compIndex, 1);
              player.cash += netProceeds;
              player.valuation = Math.max(0, player.valuation - (comp.valuation / 1000));
              player.loan = Math.max(0, player.loan - activeLoan);
              player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

              io.to(roomId).emit('notification', `ASSET LIQUIDATION: ${player.name} sold ${comp.name} for ${netProceeds}K net proceeds (Refund: ${totalInvested}K - Loan: ${activeLoan}K).`);

              if (player.cash >= 0) {
                 socket.emit('bankruptcy_cleared');
                 io.to(roomId).emit('notification', `BANKRUPTCY SOLVED: ${player.name} has resolved their shortfall.`);
                 checkAdvanceIfAllResolved();
              } else {
                 socket.emit('notification', `STILL IN DEBT: After selling ${comp.name}, you still owe ${Math.abs(player.cash)}K.`);
              }
           }
           io.to(roomId).emit('game_state_update', room);
           return;
        }
      }
    });

    socket.on('launch_company', ({ roomId, targetPlayerId }) => {
      if (rooms[roomId]) {
        const player = rooms[roomId].players.find((p: any) => p.id === targetPlayerId);
        if (player) {
          const COMPANY_TEMPLATES = [
            { name: "CONTRACT FARMING", icon: "/mat-icons/mat-icon-contract-farming.png", invest: 10, revenue: 100, valuation: 500, loan: 0 },
            { name: "AGRI IoT", icon: "/mat-icons/mat-icon-agri-iot.png", invest: 100, revenue: 10, valuation: 1000, loan: 0 },
            { name: "WALLET", icon: "/mat-icons/mat-icon-wallet.png", invest: 50, revenue: 10, valuation: 1000, loan: 0 },
            { name: "SNACKS", icon: "/mat-icons/mat-icon-snacks.png", invest: 10, revenue: 20, valuation: 1000, loan: 0 },
            { name: "QUICK COMMERCE", icon: "/mat-icons/mat-icon-quick-commerce.png", invest: 10, revenue: 30, valuation: 100, loan: 0 },
            { name: "SMART STORAGE", icon: "/mat-icons/mat-icon-smart-storage.png", invest: 200, revenue: 200, valuation: 2000, loan: 200 },
            { name: "RESTRO - CHAIN", icon: "/mat-icons/mat-icon-restro-chain.png", invest: 150, revenue: 300, valuation: 1000, loan: 200 },
            { name: "TRACEABILITY", icon: "/mat-icons/mat-icon-traceability.png", invest: 30, revenue: 30, valuation: 300, loan: 0 },
            { name: "ROBO - PACKAGING", icon: "/mat-icons/mat-icon-robo-packaging.png", invest: 100, revenue: 150, valuation: 1500, loan: 200 }
          ];

          if ((player.ownedCompanies || []).length >= 4) {
             socket.emit('notification', 'ACTION REJECTED: Maximum of 4 company launches allowed per Founder.');
             return;
          }
          const unownedTemplates = COMPANY_TEMPLATES.filter((t: any) => !player.ownedCompanies.some((c: any) => c.name === t.name));
          if (unownedTemplates.length === 0) {
             socket.emit('notification', 'ACTION REJECTED: No more companies available to launch.');
             return;
          }
          const template = unownedTemplates[0];
          if (player.cash < template.invest) {
             socket.emit('notification', 'ACTION REJECTED: Insufficient cash to launch company.');
             return;
          }

          const newCompany = {
            ...template,
            loan: 0,
            stage: 'L',
            team: 1,
            teamLevel: 1,
            equityGiven: 0
          };
          
          player.ownedCompanies.push(newCompany);
          player.valuation += (newCompany.valuation / 1000);
          player.cash -= newCompany.invest;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          
          if (rooms[roomId].mode !== 'quick' && rooms[roomId].mode !== 'short') {
            rooms[roomId].actionCount += 1;
            player.actionCount = (player.actionCount || 0) + 1;
          }
          
          io.to(roomId).emit('game_state_update', rooms[roomId]);
          io.to(roomId).emit('notification', `${player.name.toUpperCase()} LAUNCHED ${newCompany.name.toUpperCase()} (STAGE L)`);
        }
      }
    });

    socket.on('voice_signal', ({ roomId, to, signal, from }) => {
      if (to) {
        io.to(to).emit('voice_signal', { signal, from: socket.id, fromUsername: from });
      } else if (roomId) {
        socket.to(roomId).emit('voice_signal', { signal, from: socket.id, fromUsername: from });
      }
    });

    socket.on('voice_state', ({ roomId, username, isTalking }) => {
      if (roomId) {
        socket.to(roomId).emit('voice_state_update', { socketId: socket.id, username, isTalking });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const rId in rooms) {
        socket.to(rId).emit('voice_state_update', { socketId: socket.id, username: '', isTalking: false });
      }
    });
  });

  return io;
}

const INVESTMENT_COST_DATA: Record<string, number[]> = {
  'CONTRACT FARMING': [50, 100, 1000, 2000],
  'AGRI IoT': [60, 300, 1500, 8000],
  'WALLET': [75, 400, 2000, 10000],
  'SNACKS': [40, 200, 1100, 4000],
  'QUICK COMMERCE': [90, 400, 1200, 4000],
  'SMART STORAGE': [55, 1600, 5400, 7500],
  'RESTRO - CHAIN': [70, 400, 1400, 8000],
  'TRACEABILITY': [45, 200, 2000, 8000],
  'ROBO - PACKAGING': [80, 500, 2500, 9000]
};
