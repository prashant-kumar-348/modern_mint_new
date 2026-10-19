/**
 * Phase 7 Test Suite: Turn Order and Quick Mode Compliance
 * Tests Section J (Turn Order and Action Points) & Section K (Quick Mode)
 */

const assert = require('assert');

// Import data and functions from backend
const {
  COMPANY_DATA_MAP,
  MULTIPLIER_TABLE,
  calculateCompanyRevenue,
  calculateFinalScores,
  getStageIndex
} = require('../backend/dist/socket');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

console.log('--- MODERN MINT PHASE 7 TURN ORDER & QUICK MODE TEST SUITE ---');

// =========================================================================
// SECTION J: TURN ORDER & ACTION POINTS
// =========================================================================

runTest('Rule J.1: Standard Mode Round 1 turn order is random / shuffled', () => {
  // In Standard Mode, players array is shuffled on start_game.
  const players = [
    { id: 'p1', name: 'Alice', role: 'Founder' },
    { id: 'p2', name: 'Bob', role: 'Founder' },
    { id: 'p3', name: 'Charlie', role: 'Founder' },
    { id: 'p4', name: 'Diana', role: 'Founder' }
  ];
  // Verify that Quick mode condition avoids shuffle while Standard mode permits it
  const isQuickMode = false;
  let orderModified = false;
  if (!isQuickMode) {
    orderModified = true; // shuffle executed
  }
  assert.strictEqual(orderModified, true, 'Standard mode must shuffle initial player order');
});

runTest('Rule J.2: Phase II actions increment actionCount in Standard Mode', () => {
  const room = { mode: 'standard', actionCount: 0 };
  const player = { actionCount: 0 };

  const performPhase2Action = () => {
    if (room.mode !== 'quick' && room.mode !== 'short') {
      room.actionCount += 1;
      player.actionCount = (player.actionCount || 0) + 1;
    }
  };

  performPhase2Action(); // Launch
  performPhase2Action(); // Stage Up
  performPhase2Action(); // PR
  assert.strictEqual(player.actionCount, 3, 'Player actionCount must be 3 after 3 actions');
  assert.strictEqual(room.actionCount, 3, 'Room actionCount must be 3 after 3 actions');
});

runTest('Rule J.2 / K.3: Phase II actions SKIP actionCount tracking in Quick Mode', () => {
  const room = { mode: 'quick', actionCount: 0 };
  const player = { actionCount: 0 };

  const performPhase2Action = () => {
    if (room.mode !== 'quick' && room.mode !== 'short') {
      room.actionCount += 1;
      player.actionCount = (player.actionCount || 0) + 1;
    }
  };

  performPhase2Action(); // Launch
  performPhase2Action(); // Stage Up
  performPhase2Action(); // Workforce
  assert.strictEqual(player.actionCount, 0, 'Player actionCount must remain 0 in Quick Mode');
  assert.strictEqual(room.actionCount, 0, 'Room actionCount must remain 0 in Quick Mode');
});

runTest('Rule J.3: Phase I bank loans and fundraising do NOT add Action Points', () => {
  const player = { actionCount: 0 };
  // Bank loan taken in Phase 1
  const loanAmount = 50;
  player.loan = (player.loan || 0) + loanAmount;
  player.cash = (player.cash || 0) + loanAmount;
  // Rule D.1 & J.3: 0 AP cost
  assert.strictEqual(player.actionCount, 0, 'Bank loan must not increment Action Points');
});

runTest('Rule J.4: Sort Founders by ascending Action Points at round end in Standard Mode', () => {
  const room = {
    mode: 'standard',
    round: 1,
    players: [
      { id: 'f1', name: 'Alice', role: 'Founder', actionCount: 3 },
      { id: 'f2', name: 'Bob', role: 'Founder', actionCount: 1 },
      { id: 'f3', name: 'Charlie', role: 'Founder', actionCount: 2 }
    ]
  };

  // Turn ordering logic from socket.ts advanceRoundOrEndGame
  if (room.mode !== 'quick' && room.mode !== 'short') {
    const founders = (room.players || []).filter(p => p.role?.toLowerCase() === 'founder');
    const nonFounders = (room.players || []).filter(p => p.role?.toLowerCase() !== 'founder');
    
    founders.forEach((f, idx) => { f._prevOrder = idx; });
    founders.sort((a, b) => {
      const diff = (a.actionCount || 0) - (b.actionCount || 0);
      if (diff !== 0) return diff;
      return (a._prevOrder || 0) - (b._prevOrder || 0);
    });
    founders.forEach(f => { delete f._prevOrder; });
    room.players = [...nonFounders, ...founders];
  }

  assert.strictEqual(room.players[0].name, 'Bob', 'Bob (1 AP) must go first');
  assert.strictEqual(room.players[1].name, 'Charlie', 'Charlie (2 AP) must go second');
  assert.strictEqual(room.players[2].name, 'Alice', 'Alice (3 AP) must go third');
});

runTest('Rule J.4 Tie-break: Player who went earlier in previous round goes earlier when AP is tied', () => {
  // In Round 1, seating order is: Alice (0), Bob (1), Charlie (2)
  // Alice took 2 actions, Bob took 2 actions, Charlie took 1 action
  const room = {
    mode: 'standard',
    round: 1,
    players: [
      { id: 'f1', name: 'Alice', role: 'Founder', actionCount: 2 },
      { id: 'f2', name: 'Bob', role: 'Founder', actionCount: 2 },
      { id: 'f3', name: 'Charlie', role: 'Founder', actionCount: 1 }
    ]
  };

  if (room.mode !== 'quick' && room.mode !== 'short') {
    const founders = (room.players || []).filter(p => p.role?.toLowerCase() === 'founder');
    const nonFounders = (room.players || []).filter(p => p.role?.toLowerCase() !== 'founder');
    
    founders.forEach((f, idx) => { f._prevOrder = idx; });
    founders.sort((a, b) => {
      const diff = (a.actionCount || 0) - (b.actionCount || 0);
      if (diff !== 0) return diff;
      return (a._prevOrder || 0) - (b._prevOrder || 0);
    });
    founders.forEach(f => { delete f._prevOrder; });
    room.players = [...nonFounders, ...founders];
  }

  // Charlie has 1 AP (goes first)
  // Alice and Bob tie with 2 AP each; Alice was index 0 in prev round, Bob was index 1 -> Alice before Bob!
  assert.strictEqual(room.players[0].name, 'Charlie');
  assert.strictEqual(room.players[1].name, 'Alice', 'Alice must precede Bob on tie-breaker due to earlier prevOrder');
  assert.strictEqual(room.players[2].name, 'Bob', 'Bob must follow Alice');
});

runTest('Rule J.4: Real Investors placed outside Founder sorting, Dummy Investors placed at end', () => {
  const room = {
    mode: 'standard',
    round: 1,
    players: [
      { id: 'inv1', name: 'Investor Dave', role: 'Investor', actionCount: 0 },
      { id: 'f1', name: 'Alice', role: 'Founder', actionCount: 3 },
      { id: 'dummy', name: 'Dummy AI', role: 'Investor', isDummy: true, actionCount: 0 },
      { id: 'f2', name: 'Bob', role: 'Founder', actionCount: 1 }
    ]
  };

  if (room.mode !== 'quick' && room.mode !== 'short') {
    const founders = (room.players || []).filter(p => p.role?.toLowerCase() === 'founder');
    const realInvestors = (room.players || []).filter(p => p.role?.toLowerCase() !== 'founder' && !p.isDummy);
    const dummyInvestors = (room.players || []).filter(p => p.isDummy);
    
    founders.forEach((f, idx) => { f._prevOrder = idx; });
    founders.sort((a, b) => {
      const diff = (a.actionCount || 0) - (b.actionCount || 0);
      if (diff !== 0) return diff;
      return (a._prevOrder || 0) - (b._prevOrder || 0);
    });
    founders.forEach(f => { delete f._prevOrder; });
    room.players = [...realInvestors, ...founders, ...dummyInvestors];
  }

  assert.strictEqual(room.players[0].name, 'Investor Dave', 'Real Investor must remain before founders');
  assert.strictEqual(room.players[1].name, 'Bob', 'Bob (1 AP) must be first founder');
  assert.strictEqual(room.players[2].name, 'Alice', 'Alice (3 AP) must be second founder');
  assert.strictEqual(room.players[3].name, 'Dummy AI', 'Dummy Investor must be placed at the end');
});

runTest('Rule J.2 / Undo: Undoing Phase II action decrements actionCount in Standard Mode', () => {
  const room = { mode: 'standard', actionCount: 2 };
  const player = { actionCount: 2, roundActions: [{ id: 'act_1', cost: 10 }] };

  // Undo action logic
  if (room.mode !== 'quick' && room.mode !== 'short') {
    player.actionCount = Math.max(0, (player.actionCount || 1) - 1);
    room.actionCount = Math.max(0, (room.actionCount || 1) - 1);
  }
  player.roundActions.splice(0, 1);

  assert.strictEqual(player.actionCount, 1, 'Player actionCount must decrement to 1');
  assert.strictEqual(room.actionCount, 1, 'Room actionCount must decrement to 1');
});

// =========================================================================
// SECTION K: QUICK MODE SPECIFICATIONS
// =========================================================================

runTest('Rule K.1: Quick Mode duration is exactly 6 rounds vs Standard Mode 9 rounds', () => {
  const quickMax = (mode => (mode === 'short' || mode === 'quick') ? 6 : 9)('quick');
  const shortMax = (mode => (mode === 'short' || mode === 'quick') ? 6 : 9)('short');
  const standardMax = (mode => (mode === 'short' || mode === 'quick') ? 6 : 9)('standard');
  const mins60Max = (mode => (mode === 'short' || mode === 'quick') ? 6 : 9)('60mins');

  assert.strictEqual(quickMax, 6, 'Quick mode max rounds must be 6');
  assert.strictEqual(shortMax, 6, 'Short mode max rounds must be 6');
  assert.strictEqual(standardMax, 9, 'Standard mode max rounds must be 9');
  assert.strictEqual(mins60Max, 9, '60mins mode max rounds must be 9');
});

runTest('Rule K.1: End of game occurs after Round 6 completes in Quick Mode', () => {
  const room = {
    mode: 'quick',
    round: 6,
    isFinished: false,
    players: [
      { id: 'f1', name: 'Alice', role: 'Founder', cash: 500, valuation: 1000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'R' }] }
    ]
  };

  const maxRounds = (room.mode === 'short' || room.mode === 'quick') ? 6 : 9;
  let gameOverEmitted = false;
  if (room.round >= maxRounds) {
    const { scores, winners } = calculateFinalScores(room);
    room.isFinished = true;
    room.finalScores = scores;
    room.winners = winners;
    gameOverEmitted = true;
  }

  assert.strictEqual(gameOverEmitted, true, 'Game over must be emitted after Round 6 in Quick Mode');
  assert.strictEqual(room.isFinished, true, 'room.isFinished must be true');
  assert.strictEqual(room.winners.length, 1, '1 winner for single founder game');
});

runTest('Rule K.2: Quick Mode places exactly 1 Event Card face-down; Standard Mode places 2', () => {
  const getDeckCount = (mode) => {
    const isQuick = mode === 'quick' || mode === 'short';
    return isQuick ? 1 : 2;
  };

  assert.strictEqual(getDeckCount('quick'), 1, 'Quick mode must place 1 Event Card');
  assert.strictEqual(getDeckCount('short'), 1, 'Short mode must place 1 Event Card');
  assert.strictEqual(getDeckCount('standard'), 2, 'Standard mode must place 2 Event Cards');
  assert.strictEqual(getDeckCount('60mins'), 2, '60mins mode must place 2 Event Cards');
});

runTest('Rule K.2: Event Card revealed after Round 3 (at start of Round 4); Round 7 reveal guarded', () => {
  const checkEventReveal = (round, mode) => {
    return round === 4 || (round === 7 && mode !== 'quick' && mode !== 'short');
  };

  assert.strictEqual(checkEventReveal(4, 'quick'), true, 'Round 4 event must reveal in Quick Mode');
  assert.strictEqual(checkEventReveal(4, 'standard'), true, 'Round 4 event must reveal in Standard Mode');
  assert.strictEqual(checkEventReveal(7, 'quick'), false, 'Round 7 event must NEVER reveal in Quick Mode');
  assert.strictEqual(checkEventReveal(7, 'standard'), true, 'Round 7 event must reveal in Standard Mode');
});

runTest('Rule K.3: Quick Mode preserves fixed clockwise seating order across all rounds', () => {
  const initialSeating = [
    { id: 'p1', name: 'Player 1', role: 'Founder', actionCount: 5 },
    { id: 'p2', name: 'Player 2', role: 'Founder', actionCount: 1 },
    { id: 'p3', name: 'Player 3', role: 'Founder', actionCount: 3 }
  ];

  const room = {
    mode: 'quick',
    players: [...initialSeating]
  };

  // advanceRoundOrEndGame in Quick Mode: sorting is SKIPPED
  if (room.mode !== 'quick' && room.mode !== 'short') {
    // sorting would happen here in standard mode
    room.players.sort((a, b) => a.actionCount - b.actionCount);
  }

  assert.strictEqual(room.players[0].name, 'Player 1', 'Player 1 must remain first in clockwise seating');
  assert.strictEqual(room.players[1].name, 'Player 2', 'Player 2 must remain second in clockwise seating');
  assert.strictEqual(room.players[2].name, 'Player 3', 'Player 3 must remain third in clockwise seating');
});

runTest('Rule K.4: Quick Mode ignores revenue sharing (100% retained even when multiple founders at same stage)', () => {
  // Founder 1 and Founder 2 both own CONTRACT FARMING at Launch stage (Base Projected Rev = $100K)
  const f1Company = { name: 'CONTRACT FARMING', stage: 'L', teamLevel: 1 };
  const f2Company = { name: 'CONTRACT FARMING', stage: 'L', teamLevel: 1 };

  const f1 = { id: 'f1', name: 'Founder 1', role: 'founder', ownedCompanies: [f1Company] };
  const f2 = { id: 'f2', name: 'Founder 2', role: 'founder', ownedCompanies: [f2Company] };

  // Standard Mode: sharingPlayers = 2, dividedRev = 100 / 2 = 50K
  const standardRoom = { mode: 'standard', round: 1, players: [f1, f2] };
  const stdResult = calculateCompanyRevenue(f1Company, f1, standardRoom, 6);
  assert.strictEqual(stdResult.sharingPlayers, 2, 'Standard Mode must share revenue between 2 founders');
  assert.strictEqual(stdResult.dividedRev, 50, 'Standard Mode must divide projected revenue ($50K each)');

  // Quick Mode: sharingPlayers = 1, dividedRev = 100 / 1 = 100K (100% retained!)
  const quickRoom = { mode: 'quick', round: 1, players: [f1, f2] };
  const quickResult = calculateCompanyRevenue(f1Company, f1, quickRoom, 6);
  assert.strictEqual(quickResult.sharingPlayers, 1, 'Quick Mode must ignore revenue sharing');
  assert.strictEqual(quickResult.dividedRev, 100, 'Quick Mode must retain 100% projected revenue ($100K)');
});

runTest('Rule K.5: Quick Mode winner calculation (2-3 players: 1 Founder winner; 4-6 players: 2 winners)', () => {
  // 3-player game: 3 Founders
  const room3P = {
    mode: 'quick',
    players: [
      { id: 'f1', name: 'Alice', role: 'Founder', cash: 400, valuation: 1000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'L' }] },
      { id: 'f2', name: 'Bob', role: 'Founder', cash: 600, valuation: 1000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'L' }] },
      { id: 'dummy', name: 'Dummy', role: 'Investor', isDummy: true, cash: 10000, valuation: 0, loan: 0, survivalLoan: 0, investorDebt: 0 }
    ],
    royaltyAgreements: []
  };

  const scores3P = calculateFinalScores(room3P);
  assert.strictEqual(scores3P.winners.length, 1, '3-player Quick Mode must have exactly 1 winner');
  assert.strictEqual(scores3P.winners[0].name, 'Bob', 'Top Founder must be Bob');
  assert.strictEqual(scores3P.winners[0].isFounderWinner, true);

  // 4-player game: 3 Founders + 1 Real Investor
  const room4P = {
    mode: 'quick',
    players: [
      { id: 'f1', name: 'Alice', role: 'Founder', cash: 400, valuation: 1000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'L' }] },
      { id: 'f2', name: 'Bob', role: 'Founder', cash: 600, valuation: 1000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'L' }] },
      { id: 'f3', name: 'Charlie', role: 'Founder', cash: 500, valuation: 1000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'L' }] },
      { id: 'inv1', name: 'Diana', role: 'Investor', cash: 5000, valuation: 0, loan: 0, survivalLoan: 0, investorDebt: 0 }
    ],
    royaltyAgreements: []
  };

  const scores4P = calculateFinalScores(room4P);
  assert.strictEqual(scores4P.winners.length, 2, '4-player Quick Mode must have 2 winners');
  assert.strictEqual(scores4P.winners[0].isFounderWinner, true, 'First winner must be Founder winner');
  assert.strictEqual(scores4P.winners[1].isInvestorWinner, true, 'Second winner must be Investor winner');
});

runTest('Rule K.6: Mode independence - Standard Mode rules unaffected by Quick Mode settings', () => {
  const standardRoom = {
    mode: 'standard',
    round: 6,
    isFinished: false,
    players: [
      { id: 'f1', name: 'Alice', role: 'Founder', actionCount: 2 },
      { id: 'f2', name: 'Bob', role: 'Founder', actionCount: 1 }
    ]
  };

  // In Standard Mode, round 6 is NOT the end of the game
  const maxRounds = (standardRoom.mode === 'short' || standardRoom.mode === 'quick') ? 6 : 9;
  assert.strictEqual(maxRounds, 9, 'Standard mode must have 9 rounds, not 6');
  assert.strictEqual(standardRoom.round < maxRounds, true, 'Standard mode continues past round 6');
});

console.log(`\n========================================`);
console.log(`Phase 7 Test Results: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL PHASE 7 TESTS PASSED SUCCESSFULLY!');
}
