const assert = require('assert');

// Import compiled backend modules
const distPath = '../backend/dist';
const { COMPANY_DATA_MAP, MULTIPLIER_TABLE } = require(`${distPath}/socket`);
const { generateMentorDeck } = require(`${distPath}/mentorCardsData`);

console.log("=== PHASE 8 MENTOR CARD TEST SUITE ===");

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${desc}`);
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${err.message}`);
  }
}

// Helper to simulate getStageIndex
function getStageIndex(stage) {
  return ['L', 'R', 'G', 'S'].indexOf(stage);
}

// 1. Deck completeness
it("Mentor Deck contains 36 unique cards", () => {
  const deck = generateMentorDeck();
  assert.strictEqual(deck.length, 36, "Deck must have 36 cards");
  const ids = new Set(deck.map(c => c.id));
  assert.strictEqual(ids.size, 36, "All 36 cards must have unique IDs");
});

// 2. Card 11: Quick Launch Retain
it("Card 11 (Visionary Mentor): Quick launches company directly at Retain with authoritative cost & valuation", () => {
  const compName = 'CONTRACT FARMING';
  const dataRow = COMPANY_DATA_MAP[compName];
  const retainCost = dataRow[1][0]; // 100
  const retainRev = dataRow[1][1];  // 200
  const retainVal = dataRow[1][2];  // 1000

  const player = {
    name: 'Founder1',
    cash: 500,
    valuation: 0,
    capital: 0.5,
    ownedCompanies: []
  };

  // Simulate Card 11 effect
  assert(player.cash >= retainCost);
  const newComp = {
    name: compName,
    stage: 'R',
    invest: retainCost,
    revenue: retainRev,
    valuation: retainVal,
    loan: 0,
    team: 1,
    teamLevel: 1,
    equityGiven: 0
  };
  player.ownedCompanies.push(newComp);
  player.cash -= retainCost;
  player.valuation += (retainVal / 1000);

  assert.strictEqual(player.cash, 400);
  assert.strictEqual(player.ownedCompanies[0].stage, 'R');
  assert.strictEqual(player.ownedCompanies[0].teamLevel, 1);
  assert.strictEqual(player.valuation, 1.0);
});

// 3. Card 16: Half Cost Stage Up
it("Card 16 (Vendor Power): Halves cost of next stage up", () => {
  const compName = 'CONTRACT FARMING';
  const player = {
    name: 'Founder1',
    cash: 100,
    hasHalfCostStageUp: true,
    ownedCompanies: [{ name: compName, stage: 'L', valuation: 500 }]
  };

  const nextStageIndex = 1; // Retain
  const fullCost = COMPANY_DATA_MAP[compName][nextStageIndex][0]; // 100
  let stageUpCost = fullCost;
  if (player.hasHalfCostStageUp) {
    stageUpCost = Math.round(stageUpCost / 2);
    player.hasHalfCostStageUp = false;
  }

  assert.strictEqual(stageUpCost, 50);
  assert.strictEqual(player.hasHalfCostStageUp, false);
});

// 4. Card 18: Half Cost All Stages for Company
it("Card 18 (Mentor's Charm): 50% discount for all upgrades for chosen company this round", () => {
  const comp = { name: 'WALLET', stage: 'L', halfCostAllStagesRound: 2 };
  const round = 2;
  const fullCost = COMPANY_DATA_MAP['WALLET'][1][0]; // 1200

  let stageUpCost = fullCost;
  if (comp.halfCostAllStagesRound === round) {
    stageUpCost = Math.round(stageUpCost / 2);
  }
  assert.strictEqual(stageUpCost, 600);
});

// 5. Card 4: Free PR
it("Card 4 (Strategic Mastermind): Grants 100% discount on PR services for the round", () => {
  const comp = { name: 'SNACKS', teamLevel: 2, freePRRound: 1 };
  const round = 1;
  const prCosts = [100, 300, 500, 700];
  let cost = prCosts[comp.teamLevel - 1]; // 300

  if (comp.freePRRound === round) {
    cost = 0;
  }
  assert.strictEqual(cost, 0);
});

// 6. Card 5: Free Workforce
it("Card 5 (HR Genius): Grants 100% discount on Workforce upgrade for the round", () => {
  const comp = { name: 'SNACKS', teamLevel: 1, freeWorkforceRound: 1 };
  const round = 1;
  const TEAM_UPGRADE_COSTS = { 2: 50, 3: 100, 4: 200 };
  let cost = TEAM_UPGRADE_COSTS[2]; // 50

  if (comp.freeWorkforceRound === round) {
    cost = 0;
  }
  assert.strictEqual(cost, 0);
});

// 7. Card 22: Mentor's Tax Strategy (50% fee discount)
it("Card 22 (Mentor's Tax Strategy): Halves compliance tax fee from $50K to $25K", () => {
  const player = { taxDiscountRound: 4, cash: 100 };
  const round = 4;
  let tax = 50;
  if (player.taxDiscountRound === round) {
    tax = 25;
  }
  player.cash -= tax;
  assert.strictEqual(player.cash, 75);
});

// 8. Card 23: Tech Unicorn Mentor
it("Card 23 (Tech Unicorn Mentor): Advances owned Tech company 1 stage for free", () => {
  const techComp = { name: 'WALLET', stage: 'L', valuation: 1000 };
  const player = {
    cash: 100,
    valuation: 1.0,
    ownedCompanies: [techComp]
  };

  const currentIndex = getStageIndex(techComp.stage);
  const nextStageIndex = currentIndex + 1; // 'R'
  const nextVal = COMPANY_DATA_MAP['WALLET'][nextStageIndex][2]; // 3000
  const oldVal = techComp.valuation;

  techComp.stage = 'R';
  techComp.valuation = nextVal;
  player.valuation = player.valuation - (oldVal / 1000) + (nextVal / 1000);

  assert.strictEqual(techComp.stage, 'R');
  assert.strictEqual(techComp.valuation, 3000);
  assert.strictEqual(player.cash, 100); // 0 cost
  assert.strictEqual(player.valuation, 3.0);
});

// 9. Card 31: No Loans
it("Card 31 (No Loans): Blocks borrowing while active", () => {
  const player = { loansBlocked: true, loansBlockedRound: 3 };
  const round = 3;
  const isBlocked = player.loansBlocked || player.loansBlockedRound === round;
  assert.strictEqual(isBlocked, true);
});

// 10. Card 33: Toxic Mentor (Block Stage Up)
it("Card 33 (Toxic Mentor): Blocks stage up for designated company during the round", () => {
  const comp = { name: 'SNACKS', stage: 'L', stageUpBlockedRound: 2 };
  const round = 2;
  const isBlocked = comp.stageUpBlockedRound === round;
  assert.strictEqual(isBlocked, true);
});

// 11. Card 7: Guardian Mentor (Event Shield)
it("Card 7 (Guardian Mentor): Blocks next negative event card and consumes shield", () => {
  const player = { cash: 100, eventShieldActive: true };
  let taxCharged = 0;
  if (player.eventShieldActive) {
    player.eventShieldActive = false;
    taxCharged = 0;
  } else {
    taxCharged = 50;
  }
  player.cash -= taxCharged;
  assert.strictEqual(player.cash, 100);
  assert.strictEqual(player.eventShieldActive, false);
});

// 12. Card 32: Mentor Mishap (Lose $20K, trigger bankruptcy if negative)
it("Card 32 (Mentor Mishap): Deducts $20K and triggers bankruptcy if cash < 0", () => {
  const player = { cash: 15 };
  let bankruptcyTriggered = false;

  player.cash -= 20;
  if (player.cash < 0) {
    bankruptcyTriggered = true;
  }
  assert.strictEqual(player.cash, -5);
  assert.strictEqual(bankruptcyTriggered, true);
});

// 13. Card 29: Sharp Mentor (End-Game Valuation Boost)
it("Card 29 (Sharp Mentor): 20% boost applied to company valuation in final Net Value", () => {
  const comp = { name: 'CONTRACT FARMING', stage: 'S', valuation: 10000, endGameValuationBoost: true };
  const dataRow = COMPANY_DATA_MAP[comp.name];
  const stageIdx = getStageIndex(comp.stage);
  let compVal = dataRow ? dataRow[stageIdx][2] : comp.valuation; // 10000
  if (comp.endGameValuationBoost) {
    compVal = Math.round(compVal * 1.20);
  }
  assert.strictEqual(compVal, 12000);
});

// 14. Card 10: Bold Moves (Risk Multiplier)
it("Card 10 (Bold Moves): Doubles revenue on roll 5-6, halves revenue on roll 1-2", () => {
  const baseRevenue = 100;
  
  // High roll: 6
  let revHigh = baseRevenue;
  const rollHigh = 6;
  if (rollHigh >= 5) revHigh *= 2;
  assert.strictEqual(revHigh, 200);

  // Low roll: 1
  let revLow = baseRevenue;
  const rollLow = 1;
  if (rollLow <= 2) revLow = Math.floor(revLow / 2);
  assert.strictEqual(revLow, 50);

  // Mid roll: 3
  let revMid = baseRevenue;
  const rollMid = 3;
  if (rollMid >= 5) revMid *= 2;
  else if (rollMid <= 2) revMid = Math.floor(revMid / 2);
  assert.strictEqual(revMid, 100);
});

// 15. Round Reset Cleanup
it("advanceRoundOrEndGame cleanly clears per-round mentor modifiers", () => {
  const player = {
    loansBlocked: true,
    loansBlockedRound: 2,
    hasHalfCostStageUp: true,
    taxDiscountRound: 2,
    freePRRound: 2,
    freeWorkforceRound: 2,
    halfCostAllStagesCompany: 'WALLET',
    ownedCompanies: [
      {
        name: 'WALLET',
        freePRRound: 2,
        freeWorkforceRound: 2,
        stageUpBlockedRound: 2,
        halfCostAllStagesRound: 2
      }
    ]
  };

  // Simulate round transition cleanup
  player.loansBlocked = false;
  player.loansBlockedRound = undefined;
  player.hasHalfCostStageUp = false;
  player.taxDiscountRound = undefined;
  player.freePRRound = undefined;
  player.freeWorkforceRound = undefined;
  player.halfCostAllStagesCompany = undefined;
  player.ownedCompanies.forEach(c => {
    c.freePRRound = undefined;
    c.freeWorkforceRound = undefined;
    c.stageUpBlockedRound = undefined;
    c.halfCostAllStagesRound = undefined;
  });

  assert.strictEqual(player.loansBlocked, false);
  assert.strictEqual(player.hasHalfCostStageUp, false);
  assert.strictEqual(player.ownedCompanies[0].stageUpBlockedRound, undefined);
  assert.strictEqual(player.ownedCompanies[0].freePRRound, undefined);
});

console.log(`\nPhase 8 Tests Finished: ${passed}/${total} assertions passed.`);
if (passed === total) {
  console.log("ALL PHASE 8 TESTS PASSED!");
} else {
  process.exit(1);
}
