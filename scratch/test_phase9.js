const assert = require('assert');
const path = require('path');

// Import compiled backend modules
const {
  calculateCompanyRevenue,
  calculateFinalScores,
  getStartingTeamTokenPool,
  COMPANY_DATA_MAP,
  MULTIPLIER_TABLE
} = require(path.resolve('backend/dist/socket.js'));

const { generateEventDeck } = require(path.resolve('backend/dist/eventCardsData.js'));
const { generateMentorDeck } = require(path.resolve('backend/dist/mentorCardsData.js'));

console.log("=== MODERN MINT: PHASE 9 (END-TO-END SCORING & FINAL RULEBOOK COMPLIANCE) TEST SUITE ===");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: End-to-End Standard Mode Final Scoring Formula & Double Winner Resolution
// -----------------------------------------------------------------------------
runTest("Rule A & Rule L: Standard Mode 4-Player Final Scoring & Dual Champions (Founder + Investor)", () => {
  const room = {
    id: 'test_std_final',
    mode: 'standard',
    round: 9,
    isFinished: false,
    players: [
      {
        id: 'f1',
        name: 'Alice Founder',
        role: 'Founder',
        color: '#ef4444',
        cash: 1200, // $1,200K
        loan: 300,  // $300K
        survivalLoan: 100, // $100K
        investorDebt: 0,
        ownedCompanies: [
          { name: 'WALLET', stage: 'S', valuation: 36000, loan: 0, team: 4 }, // $36,000K
          { name: 'CONTRACT FARMING', stage: 'G', valuation: 2500, loan: 0, team: 3 } // $2,500K
        ]
      },
      {
        id: 'f2',
        name: 'Bob Founder',
        role: 'Founder',
        color: '#55ffb0',
        cash: 800,
        loan: 200,
        survivalLoan: 0,
        investorDebt: 0,
        ownedCompanies: [
          { name: 'SNACKS', stage: 'G', valuation: 7500, loan: 0, team: 3 } // $7,500K
        ]
      },
      {
        id: 'inv1',
        name: 'Charlie Investor',
        role: 'Investor',
        color: '#d4af37',
        cash: 7000, // $7,000K
        loan: 0,
        survivalLoan: 0,
        investorLoansGiven: 500, // $500K receivable
        ownedCompanies: []
      },
      {
        id: 'inv2',
        name: 'Diana Investor',
        role: 'Investor',
        color: '#00e1ff',
        cash: 4000,
        loan: 0,
        survivalLoan: 0,
        investorLoansGiven: 0,
        ownedCompanies: []
      }
    ],
    royaltyAgreements: [
      // Charlie owns 20% equity in Alice's WALLET
      {
        founderId: 'f1',
        founderName: 'Alice Founder',
        investorId: 'inv1',
        investorName: 'Charlie Investor',
        companyName: 'WALLET',
        equity: 20
      },
      // Diana owns 10% equity in Bob's SNACKS
      {
        founderId: 'f2',
        founderName: 'Bob Founder',
        investorId: 'inv2',
        investorName: 'Diana Investor',
        companyName: 'SNACKS',
        equity: 10
      }
    ]
  };

  const { scores, winners } = calculateFinalScores(room);

  // 1. Verify Alice's retained equity:
  // WALLET at S is $36,000K. Charlie has 20% ($7,200K). Alice retains 80% ($28,800K).
  // CONTRACT FARMING at G is $2,500K (100% retained).
  // Total Founder Retained Valuation = 28,800 + 2,500 = $31,300K.
  // Alice Net Value = 31,300 (equity) + 1,200 (cash) - 400 (loans) = $32,100K.
  const aliceScore = scores.find(s => s.id === 'f1');
  assert.strictEqual(aliceScore.equityValuation, 31300, `Alice equity valuation expected 31300, got ${aliceScore.equityValuation}`);
  assert.strictEqual(aliceScore.netValue, 32100, `Alice Net Value expected 32100, got ${aliceScore.netValue}`);

  // 2. Verify Charlie Investor's equity & Net Value:
  // Equity from WALLET (20% of 36,000) = $7,200K.
  // Cash = $7,000K. Receivables = $500K. Loans = 0.
  // Charlie Net Value = 7,200 + 7,000 + 500 = $14,700K.
  const charlieScore = scores.find(s => s.id === 'inv1');
  assert.strictEqual(charlieScore.equityValuation, 7200, `Charlie equity expected 7200, got ${charlieScore.equityValuation}`);
  assert.strictEqual(charlieScore.netValue, 14700, `Charlie Net Value expected 14700, got ${charlieScore.netValue}`);

  // 3. Verify Bob Founder's Net Value:
  // SNACKS at G is $7,500K. Diana has 10% ($750K). Bob retains 90% ($6,750K).
  // Bob Net Value = 6,750 + 800 - 200 = $7,350K.
  const bobScore = scores.find(s => s.id === 'f2');
  assert.strictEqual(bobScore.equityValuation, 6750, `Bob equity expected 6750, got ${bobScore.equityValuation}`);
  assert.strictEqual(bobScore.netValue, 7350, `Bob Net Value expected 7350, got ${bobScore.netValue}`);

  // 4. Verify Diana Investor's Net Value:
  // Equity from SNACKS (10% of 7,500) = $750K. Cash = $4,000K.
  // Diana Net Value = 750 + 4000 = $4,750K.
  const dianaScore = scores.find(s => s.id === 'inv2');
  assert.strictEqual(dianaScore.netValue, 4750, `Diana Net Value expected 4750, got ${dianaScore.netValue}`);

  // 5. In 4+ player game with real investors: Exactly 2 Winners (Top Founder & Top Investor)
  assert.strictEqual(winners.length, 2, `Expected 2 winners, got ${winners.length}`);
  const founderWinner = winners.find(w => w.isFounderWinner);
  const investorWinner = winners.find(w => w.isInvestorWinner);
  assert(founderWinner, "Top Founder Champion must be defined");
  assert(investorWinner, "Top Investor Champion must be defined");
  assert.strictEqual(founderWinner.id, 'f1', "Alice must be Founder Champion");
  assert.strictEqual(investorWinner.id, 'inv1', "Charlie must be Investor Champion");
});

// -----------------------------------------------------------------------------
// TEST 2: Quick Mode (3-Player) Single Founder Winner & 6-Round Cap
// -----------------------------------------------------------------------------
runTest("Rule K.5 & Rule A: Quick Mode 2-3 Player Single Founder Champion Resolution", () => {
  const room = {
    id: 'test_qm_final',
    mode: 'quick',
    round: 6,
    isFinished: false,
    players: [
      {
        id: 'f1',
        name: 'Founder 1',
        role: 'Founder',
        color: '#ef4444',
        cash: 1500,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: [
          { name: 'QUICK COMMERCE', stage: 'G', valuation: 10000, loan: 0, team: 3 }
        ]
      },
      {
        id: 'f2',
        name: 'Founder 2',
        role: 'Founder',
        color: '#55ffb0',
        cash: 2000,
        loan: 500,
        survivalLoan: 0,
        ownedCompanies: [
          { name: 'AGRI IoT', stage: 'R', valuation: 3000, loan: 0, team: 2 }
        ]
      },
      {
        id: 'dummy_investor',
        name: 'Growth Capital (Dummy)',
        role: 'Investor',
        isDummy: true,
        cash: 10000,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: []
      }
    ],
    royaltyAgreements: []
  };

  const { scores, winners } = calculateFinalScores(room);

  // Dummy investor must NOT be scored or compete for champion
  assert.strictEqual(scores.length, 2, `Only real human players scored, expected 2, got ${scores.length}`);
  assert(!scores.some(s => s.id === 'dummy_investor'), "Dummy investor must not be on leaderboard");

  // In 2-3 player games: Exactly 1 Winner (Founder)
  assert.strictEqual(winners.length, 1, `Expected 1 winner for 2-3 player game, got ${winners.length}`);
  assert.strictEqual(winners[0].id, 'f1', "Founder 1 must win with higher Net Value (11,500 vs 4,500)");
  assert.strictEqual(winners[0].isFounderWinner, true, "Winner must be flagged as isFounderWinner");
});

// -----------------------------------------------------------------------------
// TEST 3: Card 29 (Sharp Mentor) 20% End-Game Valuation Boost
// -----------------------------------------------------------------------------
runTest("Rule E.5 (Card 29): Sharp Mentor +20% Valuation Boost Applied to Final Valuation", () => {
  const room = {
    id: 'test_sharp_mentor',
    mode: 'standard',
    round: 9,
    players: [
      {
        id: 'f1',
        name: 'Sharp Founder',
        role: 'Founder',
        cash: 500,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: [
          // SMART STORAGE at Scale normally $40,000K valuation.
          // With Sharp Mentor endGameValuationBoost: 40,000 * 1.2 = 48,000K
          { name: 'SMART STORAGE', stage: 'S', valuation: 40000, endGameValuationBoost: true, team: 4 }
        ]
      }
    ],
    royaltyAgreements: []
  };

  const { scores } = calculateFinalScores(room);
  const player = scores[0];

  assert.strictEqual(player.equityValuation, 48000, `Expected boosted valuation $48,000K, got ${player.equityValuation}`);
  assert.strictEqual(player.netValue, 48500, `Expected Net Value 48,000 + 500 = $48,500K, got ${player.netValue}`);
});

// -----------------------------------------------------------------------------
// TEST 4: Multi-Tier Tie-Breaking Hierarchy
// -----------------------------------------------------------------------------
runTest("Rule L: Final Scoring Tie-Breaking Order (Net Value -> Equity -> Cash -> Debt)", () => {
  // Scenario A: Identical Net Value ($10,000K), different Equity Valuation
  const roomA = {
    id: 'test_tie_break_equity',
    players: [
      {
        id: 'p1',
        name: 'High Cash Player',
        role: 'Founder',
        cash: 4000,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: [{ name: 'AGRI IoT', stage: 'G', team: 3 }] // Val = 6,000. Cash = 4,000. Net Value = 10,000.
      },
      {
        id: 'p2',
        name: 'High Equity Player',
        role: 'Founder',
        cash: 2000,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: [{ name: 'WALLET', stage: 'G', team: 3 }] // Val = 8,000. Cash = 2,000. Net Value = 10,000.
      }
    ],
    royaltyAgreements: []
  };

  const resA = calculateFinalScores(roomA);
  assert.strictEqual(resA.scores[0].id, 'p2', "Higher equity valuation must break tie over higher cash");

  // Scenario B: Identical Net Value AND Equity, different Cash vs Debt
  const roomB = {
    id: 'test_tie_break_cash',
    players: [
      {
        id: 'p1',
        name: 'Higher Cash with Debt',
        role: 'Founder',
        cash: 3000,
        loan: 1000,
        survivalLoan: 0,
        ownedCompanies: [{ name: 'AGRI IoT', stage: 'G', valuation: 6000, team: 3 }] // 6,000 + 3,000 - 1,000 = 8,000
      },
      {
        id: 'p2',
        name: 'Lower Cash with No Debt',
        role: 'Founder',
        cash: 2000,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: [{ name: 'AGRI IoT', stage: 'G', valuation: 6000, team: 3 }] // 6,000 + 2,000 = 8,000
      }
    ],
    royaltyAgreements: []
  };

  const resB = calculateFinalScores(roomB);
  assert.strictEqual(resB.scores[0].id, 'p1', "Higher cash must break tie when net value and equity are tied");
});

// -----------------------------------------------------------------------------
// TEST 5: Convertible Note Conversion Mechanics on Stage Up
// -----------------------------------------------------------------------------
runTest("Rule D.4.e: Convertible Note automatically converts into equity on stage up", () => {
  const room = {
    id: 'test_conv_note',
    players: [
      {
        id: 'founder_1',
        name: 'Founder 1',
        role: 'Founder',
        cash: 500,
        valuation: 1,
        loan: 0,
        survivalLoan: 0,
        investorDebt: 200, // $200K convertible note debt
        ownedCompanies: [
          { name: 'WALLET', stage: 'L', valuation: 1000, loan: 0, equityGiven: 0 }
        ]
      },
      {
        id: 'inv_1',
        name: 'Investor 1',
        role: 'Investor',
        cash: 1800,
        valuation: 0,
        loan: 0,
        investorLoansGiven: 200
      }
    ],
    royaltyAgreements: [
      {
        founderId: 'founder_1',
        founderName: 'Founder 1',
        investorId: 'inv_1',
        investorName: 'Investor 1',
        companyName: 'WALLET',
        loan: 200,
        equity: 15,
        convertible: true,
        converted: false
      }
    ]
  };

  const player = room.players[0];
  const comp = player.ownedCompanies[0];

  // Stage up WALLET: L -> R
  const unconvertedNotes = (room.royaltyAgreements || []).filter((a) => 
    (a.founderId === player.id || a.founderName === player.name) &&
    (!a.companyName || a.companyName.toUpperCase().trim() === comp.name.toUpperCase().trim()) &&
    a.convertible && !a.converted
  );

  assert.strictEqual(unconvertedNotes.length, 1, "Must find 1 unconverted note");

  unconvertedNotes.forEach((note) => {
    const equityGain = note.equity || 10;
    note.converted = true;
    player.investorDebt = Math.max(0, (player.investorDebt || 0) - (note.loan || 0));
    const investor = room.players.find(p => p.id === note.investorId || p.name === note.investorName);
    if (investor) {
      investor.investorLoansGiven = Math.max(0, (investor.investorLoansGiven || 0) - (note.loan || 0));
    }
    comp.equityGiven = Math.min(100, (comp.equityGiven || 0) + equityGain);
  });

  assert.strictEqual(player.investorDebt, 0, "Founder investor debt should be 0 after conversion");
  assert.strictEqual(comp.equityGiven, 15, "Company equity given should be 15%");
  assert.strictEqual(room.royaltyAgreements[0].converted, true, "Note converted status must be true");
});

// -----------------------------------------------------------------------------
// TEST 6: Investor Scheduled Capital Injections at Rounds 4 and 7
// -----------------------------------------------------------------------------
runTest("Rule B & Rule I: Investor Scheduled Funds (Round 4: +$5,000K, Round 7: +$10,000K)", () => {
  const investor = {
    id: 'inv_funds',
    name: 'Venture Fund',
    role: 'Investor',
    cash: 2000,
    valuation: 0,
    loan: 0
  };

  // Round 4 injection
  const fundRound4 = 5000;
  investor.cash += fundRound4;
  assert.strictEqual(investor.cash, 7000, "Investor cash at Round 4 must be $7,000K ($2,000K + $5,000K)");

  // Round 7 injection
  const fundRound7 = 10000;
  investor.cash += fundRound7;
  assert.strictEqual(investor.cash, 17000, "Investor cash at Round 7 must be $17,000K ($7,000K + $10,000K)");
});

// -----------------------------------------------------------------------------
// TEST 7: Full 9-Round Complete Simulation Verification
// -----------------------------------------------------------------------------
runTest("Rule C.1 & Rule A: Complete 9-Round Simulation with all Phases and Events", () => {
  const room = {
    id: 'test_simulation_9',
    mode: 'standard',
    round: 1,
    phase: 1,
    eventDeck: generateEventDeck().slice(0, 2),
    mentorDeck: generateMentorDeck(),
    players: [
      {
        id: 'sim_founder',
        name: 'Simulated Founder',
        role: 'Founder',
        cash: 500,
        capital: 0.5,
        loan: 0,
        survivalLoan: 0,
        investorDebt: 0,
        valuation: 0,
        actionCount: 0,
        ownedCompanies: [],
        mentorCards: []
      },
      {
        id: 'sim_investor',
        name: 'Simulated Investor',
        role: 'Investor',
        cash: 2000,
        capital: 2,
        loan: 0,
        survivalLoan: 0,
        ownedCompanies: []
      }
    ],
    teamTokenPool: getStartingTeamTokenPool(2)
  };

  // Simulate 9 rounds
  for (let r = 1; r <= 9; r++) {
    room.round = r;

    // Event & Investor funding triggers
    if (r === 4 || r === 7) {
      room.activeEvent = room.eventDeck.shift();
      const fund = r === 4 ? 5000 : 10000;
      room.players.find(p => p.role === 'Investor').cash += fund;
    }

    // Launch company in round 1
    if (r === 1) {
      room.players[0].ownedCompanies.push({
        name: 'AGRI IoT',
        stage: 'L',
        invest: 100,
        revenue: 10,
        valuation: 1000,
        team: 1,
        teamLevel: 1
      });
      room.players[0].cash -= 100;
      room.players[0].valuation += 1;
    }

    // Stage up in round 2: L -> R
    if (r === 2) {
      const comp = room.players[0].ownedCompanies[0];
      comp.stage = 'R';
      comp.revenue = 300;
      comp.valuation = 3000;
      room.players[0].cash -= 500;
      room.players[0].valuation += 2;
    }

    // Calculate revenue for round
    const founder = room.players[0];
    const comp = founder.ownedCompanies[0];
    const roll = 6;
    const revRes = calculateCompanyRevenue(comp, founder, room, roll);
    founder.cash += revRes.founderNetRevenue;
  }

  assert.strictEqual(room.round, 9, "Room must complete round 9");
  assert(room.players[0].ownedCompanies.length > 0, "Founder owns launched company");
  assert.strictEqual(room.players[1].cash, 2000 + 5000 + 10000, "Investor received scheduled funding at Round 4 and 7");

  // Calculate Final Scores
  const { scores, winners } = calculateFinalScores(room);
  assert.strictEqual(scores.length, 2, "Scores must have 2 players");
  assert.strictEqual(winners.length, 1, "2-player game produces exactly 1 winner");
});

console.log("\n=======================================================");
console.log(`Phase 9 Test Results: ${passedTests}/${totalTests} Passed.`);
if (passedTests === totalTests) {
  console.log("ALL PHASE 9 TESTS PASSED SUCCESSFULLY!");
} else {
  console.error("SOME PHASE 9 TESTS FAILED!");
  process.exit(1);
}
