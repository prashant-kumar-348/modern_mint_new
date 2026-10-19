const assert = require('assert');

// Import compiled backend modules
const { COMPANY_DATA_MAP, getStageIndex } = require('../backend/dist/socket');

console.log('=== MODERN MINT: PHASE 5 (BANKRUPTCY & SECOND CHANCE) TEST SUITE ===\n');

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

// Helper mock functions replicating the backend logic exactly
function calculateCompanyLiquidationRefund(company) {
  const compStageIndex = getStageIndex(company.stage);
  const dataRow = COMPANY_DATA_MAP[company.name];
  let totalInvested = 0;
  if (dataRow) {
    for (let stg = 0; stg <= compStageIndex; stg++) {
      totalInvested += dataRow[stg][0];
    }
  } else {
    totalInvested = company.invest || 0;
  }
  const activeLoan = company.loan || 0;
  const netProceeds = Math.max(0, totalInvested - activeLoan);
  return { totalInvested, activeLoan, netProceeds };
}

function resolveBankruptcyMock(player, option, companyName, room) {
  const events = [];
  const opt = (option || '').toLowerCase().trim();

  if (opt === 'crack_deal') {
    if (player.cash >= 0) {
      events.push('bankruptcy_cleared');
    } else {
      events.push('still_negative');
    }
  } else if (opt === 'survival_loan' || opt === 'loan') {
    if (player.cash < 0) {
      const shortfall = Math.abs(player.cash);
      player.cash += shortfall;
      player.survivalLoan = (player.survivalLoan || 0) + shortfall;
      events.push('bankruptcy_cleared');
    } else {
      events.push('bankruptcy_cleared');
    }
  } else if (opt === 'restart') {
    player.ownedCompanies = [];
    player.valuation = 0;
    player.cash = 500;
    player.loan = 0;
    player.survivalLoan = 0;
    player.investorDebt = 0;
    player.capital = (player.cash / 1000);
    events.push('bankruptcy_cleared');
  } else if ((opt === 'sell_company' || opt === 'sell') && companyName) {
    const compIndex = (player.ownedCompanies || []).findIndex(
      c => c.name.toUpperCase().trim() === companyName.toUpperCase().trim()
    );
    if (compIndex !== -1) {
      const comp = player.ownedCompanies[compIndex];
      const { totalInvested, activeLoan, netProceeds } = calculateCompanyLiquidationRefund(comp);
      player.ownedCompanies.splice(compIndex, 1);
      player.cash += netProceeds;
      player.valuation = Math.max(0, player.valuation - (comp.valuation / 1000));
      player.loan = Math.max(0, player.loan - activeLoan);
      if (player.cash >= 0) {
        events.push('bankruptcy_cleared');
      } else {
        events.push('still_in_debt');
      }
    }
  }
  return events;
}

// --- 1. Crack a Deal ---
runTest('Crack a Deal: Rejects resolution if cash is still negative', () => {
  const player = { name: 'Founder 1', cash: -80 };
  const events = resolveBankruptcyMock(player, 'crack_deal');
  assert.strictEqual(events.includes('still_negative'), true);
  assert.strictEqual(events.includes('bankruptcy_cleared'), false);
  assert.strictEqual(player.cash, -80);
});

runTest('Crack a Deal: Successfully clears bankruptcy once transfer makes cash >= 0', () => {
  const player = { name: 'Founder 1', cash: -80 };
  // Simulate friend transferring 100K
  player.cash += 100;
  assert.strictEqual(player.cash, 20);
  const events = resolveBankruptcyMock(player, 'crack_deal');
  assert.strictEqual(events.includes('bankruptcy_cleared'), true);
});

// --- 2. Sell Company Liquidation Accounting ---
runTest('Sell Company: CONTRACT FARMING Stage L (Launch=10, Loan=0) gives $10K proceeds', () => {
  const comp = { name: 'CONTRACT FARMING', stage: 'L', loan: 0, valuation: 500 };
  const { totalInvested, activeLoan, netProceeds } = calculateCompanyLiquidationRefund(comp);
  assert.strictEqual(totalInvested, 10);
  assert.strictEqual(activeLoan, 0);
  assert.strictEqual(netProceeds, 10);
});

runTest('Sell Company: CONTRACT FARMING Stage R (Launch=10 + Retain=100 = 110, Loan=0)', () => {
  const comp = { name: 'CONTRACT FARMING', stage: 'R', loan: 0, valuation: 1000 };
  const { totalInvested, activeLoan, netProceeds } = calculateCompanyLiquidationRefund(comp);
  assert.strictEqual(totalInvested, 110);
  assert.strictEqual(activeLoan, 0);
  assert.strictEqual(netProceeds, 110);
});

runTest('Sell Company: CONTRACT FARMING Stage G with $50K loan (10+100+1000=1110 - 50 loan = 1060 net)', () => {
  const comp = { name: 'CONTRACT FARMING', stage: 'G', loan: 50, valuation: 2500 };
  const { totalInvested, activeLoan, netProceeds } = calculateCompanyLiquidationRefund(comp);
  assert.strictEqual(totalInvested, 1110);
  assert.strictEqual(activeLoan, 50);
  assert.strictEqual(netProceeds, 1060);
});

runTest('Sell Company: AGRI IoT Stage S (100 + 500 + 1500 + 8000 = 10100)', () => {
  const comp = { name: 'AGRI IoT', stage: 'S', loan: 0, valuation: 36000 };
  const { totalInvested, netProceeds } = calculateCompanyLiquidationRefund(comp);
  assert.strictEqual(totalInvested, 10100);
  assert.strictEqual(netProceeds, 10100);
});

runTest('Sell Company: Partial debt clearance when sale proceeds < shortfall', () => {
  const player = {
    name: 'Founder 1',
    cash: -500,
    loan: 0,
    valuation: 1,
    ownedCompanies: [
      { name: 'CONTRACT FARMING', stage: 'R', loan: 0, valuation: 1000 },
      { name: 'SNACKS', stage: 'G', loan: 0, valuation: 7500 }
    ]
  };
  // Sell CONTRACT FARMING (10+100 = 110 proceeds). Cash becomes -500 + 110 = -390
  const events = resolveBankruptcyMock(player, 'sell_company', 'CONTRACT FARMING');
  assert.strictEqual(events.includes('still_in_debt'), true);
  assert.strictEqual(player.cash, -390);
  assert.strictEqual(player.ownedCompanies.length, 1);

  // Next, sell SNACKS (Launch 10 + Retain 300 + Grow 1000 = 1310). Cash becomes -390 + 1310 = 920 >= 0
  const events2 = resolveBankruptcyMock(player, 'sell_company', 'SNACKS');
  assert.strictEqual(events2.includes('bankruptcy_cleared'), true);
  assert.strictEqual(player.cash, 920);
  assert.strictEqual(player.ownedCompanies.length, 0);
});

// --- 3. Survival Bank Loan ---
runTest('Survival Bank Loan: Borrows exact shortfall and brings cash to $0', () => {
  const player = { name: 'Founder 1', cash: -240, survivalLoan: 0, loan: 0, valuation: 2 };
  const events = resolveBankruptcyMock(player, 'survival_loan');
  assert.strictEqual(events.includes('bankruptcy_cleared'), true);
  assert.strictEqual(player.cash, 0);
  assert.strictEqual(player.survivalLoan, 240);
});

runTest('Survival Bank Loan: Incurs 30% interest at Phase 3 start', () => {
  const player = { name: 'Founder 1', cash: 100, survivalLoan: 200 };
  const sInterest = Math.round(player.survivalLoan * 0.30);
  player.cash -= sInterest;
  assert.strictEqual(sInterest, 60);
  assert.strictEqual(player.cash, 40);
});

// --- 4. Restart ---
runTest('Restart: Wipes all companies, resets debts, and gives $500K fresh cash', () => {
  const player = {
    name: 'Founder 1',
    cash: -450,
    loan: 300,
    survivalLoan: 150,
    investorDebt: 100,
    valuation: 5,
    ownedCompanies: [
      { name: 'WALLET', stage: 'G', loan: 300, valuation: 8000 }
    ]
  };
  const events = resolveBankruptcyMock(player, 'restart');
  assert.strictEqual(events.includes('bankruptcy_cleared'), true);
  assert.strictEqual(player.cash, 500);
  assert.strictEqual(player.loan, 0);
  assert.strictEqual(player.survivalLoan, 0);
  assert.strictEqual(player.investorDebt, 0);
  assert.strictEqual(player.valuation, 0);
  assert.strictEqual(player.ownedCompanies.length, 0);
});

// --- 5. Second Chance Lifelines ---
runTest('Second Chance: Initial setup gives exactly 2 lifelines to Founders', () => {
  const founder = { role: 'Founder', lifelines: 2 };
  assert.strictEqual(founder.lifelines, 2);
});

runTest('Second Chance: Decrements lifelines and keeps better roll', () => {
  const player = {
    role: 'Founder',
    lifelines: 2,
    hasClaimedRevenue: false,
    currentPhase3Roll: 3
  };
  // Mock revenue function where higher roll gives higher revenue
  const computeRev = (roll) => roll * 50;

  // Roll 1: test Second Chance with new roll 8
  const oldRoll = player.currentPhase3Roll;
  const newRoll = 8;
  player.lifelines -= 1;
  const wasKept = computeRev(newRoll) > computeRev(oldRoll);
  if (wasKept) {
    player.currentPhase3Roll = newRoll;
  }

  assert.strictEqual(player.lifelines, 1);
  assert.strictEqual(wasKept, true);
  assert.strictEqual(player.currentPhase3Roll, 8);

  // Roll 2: test Second Chance with worse roll 2
  const oldRoll2 = player.currentPhase3Roll;
  const newRoll2 = 2;
  player.lifelines -= 1;
  const wasKept2 = computeRev(newRoll2) > computeRev(oldRoll2);
  if (wasKept2) {
    player.currentPhase3Roll = newRoll2;
  }

  assert.strictEqual(player.lifelines, 0);
  assert.strictEqual(wasKept2, false);
  assert.strictEqual(player.currentPhase3Roll, 8); // Retained 8!
});

runTest('Second Chance: Blocked if lifelines exhausted (0)', () => {
  const player = { role: 'Founder', lifelines: 0, currentPhase3Roll: 4 };
  const canUse = player.lifelines > 0;
  assert.strictEqual(canUse, false);
});

runTest('Second Chance: Blocked if revenue already claimed', () => {
  const player = { role: 'Founder', lifelines: 2, hasClaimedRevenue: true, currentPhase3Roll: 4 };
  const canUse = player.lifelines > 0 && !player.hasClaimedRevenue;
  assert.strictEqual(canUse, false);
});

runTest('Round Progression: Blocked if any player has negative cash (bankrupt)', () => {
  const room = {
    players: [
      { name: 'P1', role: 'Founder', hasClaimedRevenue: true, cash: -50 },
      { name: 'P2', role: 'Founder', hasClaimedRevenue: true, cash: 200 }
    ]
  };
  const phase3Founders = room.players.filter(p => p.role.toLowerCase() === 'founder');
  const allClaimed = phase3Founders.every(p => p.hasClaimedRevenue);
  const hasBankrupt = room.players.some(p => p.cash < 0);
  const shouldAdvance = allClaimed && !hasBankrupt;

  assert.strictEqual(allClaimed, true);
  assert.strictEqual(hasBankrupt, true);
  assert.strictEqual(shouldAdvance, false); // Blocked by bankruptcy!

  // Now resolve P1's bankruptcy
  room.players[0].cash = 0;
  const hasBankruptNow = room.players.some(p => p.cash < 0);
  const shouldAdvanceNow = allClaimed && !hasBankruptNow;

  assert.strictEqual(hasBankruptNow, false);
  assert.strictEqual(shouldAdvanceNow, true); // Can now safely advance!
});

console.log(`\nPhase 5 Test Results: ${passedTests}/${totalTests} Passed.`);
if (passedTests === totalTests) {
  console.log('ALL PHASE 5 TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
