const fs = require('fs');
const path = require('path');

const socketPath = path.join(__dirname, '..', 'backend', 'src', 'socket.ts');
let content = fs.readFileSync(socketPath, 'utf8');

// 1. In playAIPhase3: guard advanceRoundOrEndGame with bankrupt check
const oldAIAdv = `       const phase3Founders = currentRoom.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
       const allClaimed = phase3Founders.every((p: any) => p.hasClaimedRevenue);
       
       if (allClaimed) {
          setTimeout(() => {
            advanceRoundOrEndGame(currentRoom, io, roomId);
          }, 5000);
       } else {
          io.to(roomId).emit('game_state_update', currentRoom);
          triggerAIIfNeeded(currentRoom, io, roomId);
       }`;

const newAIAdv = `       const phase3Founders = currentRoom.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
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
       }`;

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');

if (normalize(content).includes(normalize(oldAIAdv))) {
  content = content.replace(new RegExp(oldAIAdv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r\n|\n/g, '\\r?\\n')), newAIAdv.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'));
  console.log('[1/5] Successfully patched playAIPhase3');
} else {
  console.warn('[1/5] Could not find oldAIAdv pattern');
}

// 2. In claim_revenue: guard advanceRoundOrEndGame with bankrupt check
const oldClaimAdv = `           const phase3Founders = room.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
           const allClaimed = phase3Founders.every((p: any) => p.hasClaimedRevenue);
           
           if (allClaimed) {
              setTimeout(() => {
                advanceRoundOrEndGame(room, io, roomId);
              }, 5000);
           } else {
              triggerAIIfNeeded(room, io, roomId);
           }`;

const newClaimAdv = `           const phase3Founders = room.players.filter((p: any) => p.role?.toLowerCase() === 'founder');
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
           }`;

if (normalize(content).includes(normalize(oldClaimAdv))) {
  content = content.replace(new RegExp(oldClaimAdv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r\n|\n/g, '\\r?\\n')), newClaimAdv.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'));
  console.log('[2/5] Successfully patched claim_revenue');
} else {
  console.warn('[2/5] Could not find oldClaimAdv pattern');
}

// 3. In end_phase2_turn: emit trigger_bankruptcy if !p.is_ai && p.cash < 0
const oldEndP2Interest = `                      p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                      if (p.is_ai) {
                         resolveAIBankruptcyIfNeeded(p, room, io, roomId);
                      }
                   }
                 });`;

const newEndP2Interest = `                      p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
                      if (p.is_ai) {
                         resolveAIBankruptcyIfNeeded(p, room, io, roomId);
                      }
                   }
                   if (!p.is_ai && p.cash < 0) {
                      const shortfall = Math.abs(p.cash);
                      io.to(p.id).emit('trigger_bankruptcy', { shortfall });
                      io.to(roomId).emit('notification', \`BANKRUPTCY ALERT: \${p.name} went bankrupt by -\$\${shortfall}K due to interest payments!\`);
                   }
                 });`;

if (normalize(content).includes(normalize(oldEndP2Interest))) {
  content = content.replace(new RegExp(oldEndP2Interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r\n|\n/g, '\\r?\\n')), newEndP2Interest.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'));
  console.log('[3/5] Successfully patched end_phase2_turn');
} else {
  console.warn('[3/5] Could not find oldEndP2Interest pattern');
}

// 4. In second_chance_roll: add guards
const oldSecondChance = `    socket.on('second_chance_roll', ({ roomId }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        if (player && player.lifelines > 0) {
           player.lifelines -= 1;
           const oldRoll = player.currentPhase3Roll || 1;
           const newRoll = Math.floor(Math.random() * 10) + 1;
           
           const oldTotal = computeTotalRevenue(player, room, oldRoll);
           const newTotal = computeTotalRevenue(player, room, newRoll);
           
           if (newTotal > oldTotal) {
              player.currentPhase3Roll = newRoll;
           }
           
           io.to(roomId).emit('game_state_update', room);
           io.to(roomId).emit('second_chance_result', { 
              playerId: player.id,
              roll: player.currentPhase3Roll, 
              remainingLifelines: player.lifelines,
              wasKept: newTotal > oldTotal,
              newRollTested: newRoll
           });
           io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} USED SECOND CHANCE! NEW ROLL: \${newRoll} (\${newTotal > oldTotal ? 'KEPT' : 'DISCARDED'}).\`);
        }
      }
    });`;

const newSecondChance = `    socket.on('second_chance_roll', ({ roomId }) => {
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
           socket.emit('notification', 'ACTION REJECTED: No Second Chance lifelines remaining.');
           return;
        }

        player.lifelines -= 1;
        const oldRoll = player.currentPhase3Roll;
        const newRoll = Math.floor(Math.random() * 10) + 1;
        
        const oldTotal = computeTotalRevenue(player, room, oldRoll);
        const newTotal = computeTotalRevenue(player, room, newRoll);
        
        const wasKept = newTotal > oldTotal;
        if (wasKept) {
           player.currentPhase3Roll = newRoll;
        }
        
        io.to(roomId).emit('game_state_update', room);
        io.to(roomId).emit('second_chance_result', { 
           playerId: player.id,
           roll: player.currentPhase3Roll, 
           remainingLifelines: player.lifelines,
           wasKept: wasKept,
           newRollTested: newRoll
        });
        io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} USED SECOND CHANCE! NEW ROLL: \${newRoll} (\${wasKept ? 'KEPT' : 'DISCARDED'}).\`);
      }
    });`;

if (normalize(content).includes(normalize(oldSecondChance))) {
  content = content.replace(new RegExp(oldSecondChance.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r\n|\n/g, '\\r?\\n')), newSecondChance.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'));
  console.log('[4/5] Successfully patched second_chance_roll');
} else {
  console.warn('[4/5] Could not find oldSecondChance pattern');
}

// 5. In resolve_bankruptcy: support crack_deal, sell_company/sell, survival_loan/loan, restart
const oldResolveBankruptcy = `    socket.on('resolve_bankruptcy', ({ roomId, option, companyName }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const player = room.players.find((p: any) => p.id === socket.id);
        
        if (player && player.cash < 0) {
           if (option === 'loan') {
              // Survival Loan: $50K cash for 10% lifetime fee
              player.cash += 50;
              player.survivalLoan = (player.survivalLoan || 0) + 50;
              player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - (player.survivalLoan / 1000);
              
              io.to(roomId).emit('notification', \`SURVIVAL LOAN: \${player.name} accepted a $50K survival loan.\`);
           } else if (option === 'sell' && companyName) {
              const compIndex = player.ownedCompanies.findIndex((c: any) => c.name === companyName);
              if (compIndex !== -1) {
                 const comp = player.ownedCompanies[compIndex];
                 
                 // Refund calculation: Launch Cost + Upgrade Costs
                 let totalInvested = 0;
                 const compStageIndex = getStageIndex(comp.stage);
                 
                 if (INVESTMENT_COST_DATA[comp.name]) {
                    for (let stg = 0; stg <= compStageIndex; stg++) {
                       totalInvested += INVESTMENT_COST_DATA[comp.name][stg];
                    }
                 } else {
                    totalInvested = comp.invest;
                 }

                 player.ownedCompanies.splice(compIndex, 1);
                 player.cash += totalInvested;
                 player.valuation -= (comp.valuation / 1000);
                 player.loan = Math.max(0, player.loan - comp.loan);
                 player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);

                 io.to(roomId).emit('notification', \`ASSET LIQUIDATION: \${player.name} sold \${comp.name} for $\${totalInvested}K.\`);
              }
           }

           if (player.cash >= 0) {
              socket.emit('bankruptcy_cleared');
              io.to(roomId).emit('notification', \`BANKRUPTCY SOLVED: \${player.name} has resolved their shortfall.\`);
           }
           io.to(roomId).emit('game_state_update', room);
        }
      }
    });`;

const newResolveBankruptcy = `    socket.on('resolve_bankruptcy', ({ roomId, option, companyName }) => {
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
              io.to(roomId).emit('notification', \`BANKRUPTCY SOLVED: \${player.name} resolved their shortfall through a deal.\`);
              checkAdvanceIfAllResolved();
           } else {
              socket.emit('notification', \`CRACK A DEAL: Cash is still negative ($\${player.cash}K). Negotiate or transfer more funds first.\`);
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

              io.to(roomId).emit('notification', \`SURVIVAL LOAN: \${player.name} took a $\${shortfall}K survival bank loan at 30% interest.\`);
              socket.emit('bankruptcy_cleared');
              io.to(roomId).emit('notification', \`BANKRUPTCY SOLVED: \${player.name} has resolved their shortfall.\`);
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
           io.to(roomId).emit('notification', \`RESTART: \${player.name} wiped their portfolio and restarted with $500K.\`);
           io.to(roomId).emit('notification', \`BANKRUPTCY SOLVED: \${player.name} has resolved their shortfall.\`);
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

              io.to(roomId).emit('notification', \`ASSET LIQUIDATION: \${player.name} sold \${comp.name} for $\${netProceeds}K net proceeds (Refund: $\${totalInvested}K - Loan: $\${activeLoan}K).\`);

              if (player.cash >= 0) {
                 socket.emit('bankruptcy_cleared');
                 io.to(roomId).emit('notification', \`BANKRUPTCY SOLVED: \${player.name} has resolved their shortfall.\`);
                 checkAdvanceIfAllResolved();
              } else {
                 socket.emit('notification', \`STILL IN DEBT: After selling \${comp.name}, you still owe $\${Math.abs(player.cash)}K.\`);
              }
           }
           io.to(roomId).emit('game_state_update', room);
           return;
        }
      }
    });`;

if (normalize(content).includes(normalize(oldResolveBankruptcy))) {
  content = content.replace(new RegExp(oldResolveBankruptcy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\r\n|\n/g, '\\r?\\n')), newResolveBankruptcy.replace(/\n/g, content.includes('\r\n') ? '\r\n' : '\n'));
  console.log('[5/5] Successfully patched resolve_bankruptcy');
} else {
  console.warn('[5/5] Could not find oldResolveBankruptcy pattern');
}

fs.writeFileSync(socketPath, content, 'utf8');
console.log('Finished updating backend/src/socket.ts');
