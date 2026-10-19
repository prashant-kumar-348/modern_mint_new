const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('backend/src/socket.ts');
let content = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

// 1. In advanceRoundOrEndGame: add cleanup of mentor flags
const roundResetSearch = `    room.players.forEach((p: any) => {
      p.isLocked = false;
      p.hasClaimedRevenue = false;
      p.currentPhase3Roll = null;
      p.mentorMultiplier = 0;
      p.riskMultiplierActive = 0;
      p.extraActions = 0;
      p.actionCount = 0;
      p.roundActions = [];
    });`;

const roundResetReplacement = `    room.players.forEach((p: any) => {
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
      });
    });`;

if (content.includes(roundResetSearch)) {
  content = content.replace(roundResetSearch, roundResetReplacement);
  console.log("SUCCESS: Replaced roundReset in advanceRoundOrEndGame");
} else {
  console.error("FAIL: Could not find roundResetSearch");
}

// 2. In immediate_tax_50: add guardian shield check and taxDiscount check
const taxEventSearch = `        } else if (room.activeEvent.effect === 'immediate_tax_50') {
          room.players.forEach((p: any) => {
            if (p.role?.toLowerCase() === 'founder' && !p.isDummy) {
              p.cash -= 50;
              p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
              io.to(p.id).emit('notification', \`REGULATORY AUDIT: Paid $50K compliance audit fee.\`);
              if (!p.is_ai && p.cash < 0) {
                io.to(p.id).emit('trigger_bankruptcy', { shortfall: Math.abs(p.cash) });
              }
            }
          });
        }`;

const taxEventReplacement = `        } else if (room.activeEvent.effect === 'immediate_tax_50') {
          room.players.forEach((p: any) => {
            if (p.role?.toLowerCase() === 'founder' && !p.isDummy) {
              if (p.eventShieldActive) {
                p.eventShieldActive = false;
                io.to(p.id).emit('notification', \`GUARDIAN SHIELD: Blocked Regulatory Audit $50K fee!\`);
              } else {
                let tax = 50;
                if (p.taxDiscountRound === room.round) {
                  tax = 25;
                }
                p.cash -= tax;
                p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                io.to(p.id).emit('notification', \`REGULATORY AUDIT: Paid $\${tax}K compliance audit fee.\`);
                if (!p.is_ai && p.cash < 0) {
                  io.to(p.id).emit('trigger_bankruptcy', { shortfall: Math.abs(p.cash) });
                }
              }
            }
          });
        }`;

if (content.includes(taxEventSearch)) {
  content = content.replace(taxEventSearch, taxEventReplacement);
  console.log("SUCCESS: Replaced taxEvent in advanceRoundOrEndGame");
} else {
  console.error("FAIL: Could not find taxEventSearch");
}

// 3. In take_loan: check player.loansBlocked
const takeLoanSearch = `        if (player && loanBreakdown && Array.isArray(loanBreakdown)) {
          const activePlayer = room.players[room.phase1TurnIndex || 0];`;

const takeLoanReplacement = `        if (player && loanBreakdown && Array.isArray(loanBreakdown)) {
          if (player.loansBlocked || player.loansBlockedRound === room.round) {
             socket.emit('notification', 'ACTION REJECTED: You are blocked from taking loans this round.');
             return;
          }
          const activePlayer = room.players[room.phase1TurnIndex || 0];`;

if (content.includes(takeLoanSearch)) {
  content = content.replace(takeLoanSearch, takeLoanReplacement);
  console.log("SUCCESS: Added loansBlocked check in take_loan");
} else {
  console.error("FAIL: Could not find takeLoanSearch");
}

// 4. In stage_up: check stageUpBlockedRound and halfCostAllStagesRound
const stageUpSearch = `            } else if (actionType === 'stage_up') {
              const comp = player.ownedCompanies.find((c: any) => c.name === companyName);
              if (comp) {
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
                       if (player.hasHalfCostStageUp) {
                          stageUpCost = Math.round(stageUpCost / 2);
                          player.hasHalfCostStageUp = false;
                       }
                       if (player.cash < stageUpCost) {
                          socket.emit('notification', 'ACTION REJECTED: Insufficient cash to stage up company.');
                          return;
                       }`;

const stageUpReplacement = `            } else if (actionType === 'stage_up') {
              const comp = player.ownedCompanies.find((c: any) => c.name === companyName);
              if (comp) {
                 if (comp.stageUpBlockedRound === room.round) {
                    socket.emit('notification', \`ACTION REJECTED: \${comp.name} is blocked from staging up this round due to Toxic Mentor.\`);
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
                       }`;

if (content.includes(stageUpSearch)) {
  content = content.replace(stageUpSearch, stageUpReplacement);
  console.log("SUCCESS: Updated stage_up with Toxic Mentor check and halfCostAllStages");
} else {
  console.error("FAIL: Could not find stageUpSearch");
}

// 5. In buy_pr: check freePRRound and taxDiscountRound
const buyPrSearch = `                  const currentLvl = Math.min(4, Math.max(1, Number(comp.teamLevel || comp.team) || 1));
                  const prCosts = [100, 300, 500, 700];
                  let actualCost = prCosts[currentLvl - 1] || 100;
                  if (room.activeEvent?.effect === 'pr_discount_100') {
                     actualCost = Math.max(0, actualCost - 100);
                  }
                  if (player.cash < actualCost) {
                     socket.emit('notification', 'ACTION REJECTED: Insufficient cash to buy PR services.');
                     return;
                  }`;

const buyPrReplacement = `                  const currentLvl = Math.min(4, Math.max(1, Number(comp.teamLevel || comp.team) || 1));
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
                  }`;

if (content.includes(buyPrSearch)) {
  content = content.replace(buyPrSearch, buyPrReplacement);
  console.log("SUCCESS: Updated buy_pr with freePRRound and taxDiscountRound");
} else {
  console.error("FAIL: Could not find buyPrSearch");
}

// 6. In upgrade_workforce: check freeWorkforceRound
const upgradeWorkforceSearch = `                  let actualCost = TEAM_UPGRADE_COSTS[nextLvl] || 50;
                  if (room.activeEvent?.effect === 'workforce_discount_half') {
                     actualCost = Math.round(actualCost / 2);
                  }

                  if (player.cash < actualCost) {
                     socket.emit('notification', 'ACTION REJECTED: Insufficient cash to upgrade workforce.');
                     return;
                  }`;

const upgradeWorkforceReplacement = `                  let actualCost = TEAM_UPGRADE_COSTS[nextLvl] || 50;
                  if (comp.freeWorkforceRound === room.round || player.freeWorkforceRound === room.round) {
                     actualCost = 0;
                  } else if (room.activeEvent?.effect === 'workforce_discount_half') {
                     actualCost = Math.round(actualCost / 2);
                  }

                  if (player.cash < actualCost) {
                     socket.emit('notification', 'ACTION REJECTED: Insufficient cash to upgrade workforce.');
                     return;
                  }`;

if (content.includes(upgradeWorkforceSearch)) {
  content = content.replace(upgradeWorkforceSearch, upgradeWorkforceReplacement);
  console.log("SUCCESS: Updated upgrade_workforce with freeWorkforceRound");
} else {
  console.error("FAIL: Could not find upgradeWorkforceSearch");
}

// 7. In buy_mentor_card: ensure mentorDeck replenishes if empty
const buyMentorSearch = `            player.cash -= 20;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
            player.boughtMentorRound = room.round;

            const card = room.mentorDeck.shift();`;

const buyMentorReplacement = `            player.cash -= 20;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
            player.boughtMentorRound = room.round;

            if (!room.mentorDeck || room.mentorDeck.length === 0) {
               room.mentorDeck = shuffle(generateMentorDeck());
            }
            const card = room.mentorDeck.shift();`;

if (content.includes(buyMentorSearch)) {
  content = content.replace(buyMentorSearch, buyMentorReplacement);
  console.log("SUCCESS: Updated buy_mentor_card with deck auto-replenish");
} else {
  console.error("FAIL: Could not find buyMentorSearch");
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log("All hooks written successfully!");
