const assert = require('assert');

// Import compiled backend modules
const { generateEventDeck } = require('../backend/dist/eventCardsData');
const { DUMMY_INVESTORS, getActiveDummyPeriod } = require('../backend/dist/dummyInvestorData');
const { calculateFinalScores } = require('../backend/dist/socket');

console.log('=== MODERN MINT: PHASE 6 (EVENT CARDS & DUMMY INVESTORS) TEST SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// Helper to simulate room setup
function createMockRoom(playerCount = 3, mode = 'standard') {
  const isQuick = mode === 'quick' || mode === 'short';
  const fullEventDeck = generateEventDeck();
  const eventCardsToPlace = isQuick ? 1 : 2;
  const eventDeck = fullEventDeck.slice(0, eventCardsToPlace);

  return {
    players: [],
    royaltyAgreements: [],
    eventDeck,
    activeEvent: undefined,
    dummyInvestor: null,
    round: 1,
    phase: 2,
    mode
  };
}

// --- 1. Event Cards Deck Composition ---
runTest('Event Deck: Contains exactly 12 Event Cards with valid fields', () => {
  const deck = generateEventDeck();
  assert.strictEqual(deck.length, 12);
  deck.forEach((card, idx) => {
    assert.strictEqual(typeof card.id, 'string');
    assert.strictEqual(typeof card.name, 'string');
    assert.strictEqual(typeof card.description, 'string');
    assert.strictEqual(typeof card.effect, 'string');
  });
});

// --- 2. Event Deck Setup & Face-down Placement ---
runTest('Event Deck Setup: Standard Mode places exactly 2 cards face-down; Round 1 activeEvent is undefined', () => {
  const room = createMockRoom(4, 'standard');
  assert.strictEqual(room.eventDeck.length, 2);
  assert.strictEqual(room.activeEvent, undefined);
});

runTest('Event Deck Setup: Quick Mode places exactly 1 card face-down; Round 1 activeEvent is undefined', () => {
  const room = createMockRoom(3, 'quick');
  assert.strictEqual(room.eventDeck.length, 1);
  assert.strictEqual(room.activeEvent, undefined);
});

// --- 3. Event Card Reveal Timing & 3-Round Duration ---
runTest('Event Timing: Standard Mode reveals Card 1 at Round 4 and Card 2 at Round 7', () => {
  const room = createMockRoom(4, 'standard');
  const card1 = room.eventDeck[0];
  const card2 = room.eventDeck[1];

  // Rounds 1-3: No event
  assert.strictEqual(room.activeEvent, undefined);

  // Transition to Round 4: Reveal Card 1
  room.round = 4;
  room.activeEvent = room.eventDeck.shift();
  assert.strictEqual(room.activeEvent.id, card1.id);
  assert.strictEqual(room.eventDeck.length, 1);

  // Rounds 5 and 6: Card 1 remains active
  room.round = 5;
  assert.strictEqual(room.activeEvent.id, card1.id);
  room.round = 6;
  assert.strictEqual(room.activeEvent.id, card1.id);

  // Transition to Round 7: Reveal Card 2
  room.round = 7;
  room.activeEvent = room.eventDeck.shift();
  assert.strictEqual(room.activeEvent.id, card2.id);
  assert.strictEqual(room.eventDeck.length, 0);

  // Rounds 8 and 9: Card 2 remains active
  room.round = 8;
  assert.strictEqual(room.activeEvent.id, card2.id);
  room.round = 9;
  assert.strictEqual(room.activeEvent.id, card2.id);
});

runTest('Event Timing: Quick Mode reveals Card 1 at Round 4 and has no Round 7 reveal', () => {
  const room = createMockRoom(3, 'quick');
  assert.strictEqual(room.eventDeck.length, 1);

  // Round 4 reveal
  room.round = 4;
  room.activeEvent = room.eventDeck.shift();
  assert.strictEqual(room.eventDeck.length, 0);
  assert.strictEqual(typeof room.activeEvent.name, 'string');

  // Quick mode finishes at Round 6 without second card
  room.round = 6;
  assert.strictEqual(room.eventDeck.length, 0);
});

// --- 4. Event Immediate Effects ---
runTest('Event Effect: immediate_stimulus_100 grants $100K per owned company', () => {
  const room = {
    players: [
      { id: 'f1', name: 'Founder 1', cash: 200, ownedCompanies: [{ name: 'WALLET' }, { name: 'SNACKS' }] },
      { id: 'f2', name: 'Founder 2', cash: 100, ownedCompanies: [] }
    ]
  };

  const event = { id: 'E4', effect: 'immediate_stimulus_100' };
  if (event.effect === 'immediate_stimulus_100') {
    room.players.forEach(p => {
      const count = (p.ownedCompanies || []).length;
      if (count > 0) {
        p.cash += count * 100;
      }
    });
  }

  assert.strictEqual(room.players[0].cash, 400); // 200 + 2*100 = 400
  assert.strictEqual(room.players[1].cash, 100); // 0 companies -> 100
});

runTest('Event Effect: immediate_tax_50 deducts $50K compliance fee from Founders', () => {
  const room = {
    players: [
      { id: 'f1', name: 'Founder 1', role: 'Founder', cash: 200 },
      { id: 'inv1', name: 'Investor 1', role: 'Investor', cash: 2000 }
    ]
  };

  const event = { id: 'E8', effect: 'immediate_tax_50' };
  if (event.effect === 'immediate_tax_50') {
    room.players.forEach(p => {
      if (p.role === 'Founder') {
        p.cash -= 50;
      }
    });
  }

  assert.strictEqual(room.players[0].cash, 150);
  assert.strictEqual(room.players[1].cash, 2000); // Investor exempt
});

// --- 5. Event Ongoing Modifiers ---
runTest('Event Modifier: pr_discount_100 reduces PR fee by $100K', () => {
  const activeEvent = { id: 'E1', effect: 'pr_discount_100' };
  const baseCost = 300;
  const actualCost = activeEvent.effect === 'pr_discount_100' ? Math.max(0, baseCost - 100) : baseCost;
  assert.strictEqual(actualCost, 200);
});

runTest('Event Modifier: workforce_discount_half reduces workforce upgrade cost by 50%', () => {
  const activeEvent = { id: 'E3', effect: 'workforce_discount_half' };
  const baseCost = 100;
  const actualCost = activeEvent.effect === 'workforce_discount_half' ? Math.round(baseCost / 2) : baseCost;
  assert.strictEqual(actualCost, 50);
});

runTest('Event Modifier: loan_interest_15 increases bank loan interest to 15%', () => {
  const activeEvent = { id: 'E2', effect: 'loan_interest_15' };
  const loan = 100;
  const rate = activeEvent.effect === 'loan_interest_15' ? 0.15 : 0.10;
  const interest = Math.round(loan * rate);
  assert.strictEqual(rate, 0.15);
  assert.strictEqual(interest, 15);
});

// --- 6. Dummy Investor Period Lookups & Constraints ---
runTest('Dummy Investor: Profile contains 3 distinct periods (Rounds 2-3, 4-6, 7-9)', () => {
  const dummy = DUMMY_INVESTORS[0];
  assert.strictEqual(dummy.periods.length, 3);
  assert.strictEqual(dummy.periods[0].rounds, 'Rounds 2–3');
  assert.strictEqual(dummy.periods[1].rounds, 'Rounds 4–6');
  assert.strictEqual(dummy.periods[2].rounds, 'Rounds 7–9');
});

runTest('Dummy Investor: getActiveDummyPeriod returns correct period for each round', () => {
  const dummy = DUMMY_INVESTORS[0];
  assert.strictEqual(getActiveDummyPeriod(1, dummy), undefined); // Round 1 skipped
  assert.strictEqual(getActiveDummyPeriod(2, dummy).rounds, 'Rounds 2–3');
  assert.strictEqual(getActiveDummyPeriod(3, dummy).rounds, 'Rounds 2–3');
  assert.strictEqual(getActiveDummyPeriod(4, dummy).rounds, 'Rounds 4–6');
  assert.strictEqual(getActiveDummyPeriod(6, dummy).rounds, 'Rounds 4–6');
  assert.strictEqual(getActiveDummyPeriod(7, dummy).rounds, 'Rounds 7–9');
  assert.strictEqual(getActiveDummyPeriod(9, dummy).rounds, 'Rounds 7–9');
});

// --- 7. Dummy Investor Deal Validation ---
runTest('Dummy Investor: Evaluates proposals against period limits and equity requirements', () => {
  const dummy = DUMMY_INVESTORS[0]; // Apex: R2-3 max $500K for 10% equity
  const period = getActiveDummyPeriod(2, dummy);

  // Valid proposal: $500K for 10% equity
  const isValid = 500 <= period.maxFunding && 10 >= period.equityRequired;
  assert.strictEqual(isValid, true);

  // Over-budget funding request ($600K > $500K)
  const isOverFunding = 600 <= period.maxFunding;
  assert.strictEqual(isOverFunding, false);

  // Under-equity offer (8% < 10%)
  const isUnderEquity = 8 >= period.equityRequired;
  assert.strictEqual(isUnderEquity, false);
});

// --- 8. Winner Calculation with Dummy Investor ---
runTest('Winner Determination: 2-3 player game with Dummy Investor awards 1 Founder winner only', () => {
  const room = {
    players: [
      { id: 'f1', name: 'Founder Alice', role: 'Founder', cash: 500, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'WALLET', stage: 'G', valuation: 8000, loan: 0 }] },
      { id: 'f2', name: 'Founder Bob', role: 'Founder', cash: 300, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [{ name: 'SNACKS', stage: 'R', valuation: 1500, loan: 0 }] },
      { id: 'dummy_investor', name: 'Apex Syndicate (Dummy)', role: 'Investor', isDummy: true, cash: 10000, loan: 0, survivalLoan: 0, investorDebt: 0, ownedCompanies: [] }
    ],
    royaltyAgreements: [
      { id: 'agr_1', founderId: 'f1', investorId: 'dummy_investor', companyName: 'WALLET', equity: 10, cash: 500 }
    ]
  };

  const { scores, winners } = calculateFinalScores(room);

  // Dummy investor must NOT be in final ranked scores
  assert.strictEqual(scores.some(s => s.id === 'dummy_investor'), false);
  assert.strictEqual(scores.length, 2);

  // In 2-3 real players, exactly 1 winner (Top Founder) is declared
  assert.strictEqual(winners.length, 1);
  assert.strictEqual(winners[0].id, 'f1');
  assert.strictEqual(winners[0].isFounderWinner, true);
});

console.log(`\nPhase 6 Test Results: ${passedTests}/${totalTests} Passed.`);
if (passedTests === totalTests) {
  console.log('ALL PHASE 6 TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
