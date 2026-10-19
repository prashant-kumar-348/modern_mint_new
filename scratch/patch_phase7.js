const fs = require('fs');
const path = require('path');

const socketPath = path.join(__dirname, '../backend/src/socket.ts');
let content = fs.readFileSync(socketPath, 'utf8');

function replaceFlex(orig, replacement) {
  // Try exact
  if (content.includes(orig)) {
    content = content.replace(orig, replacement);
    return true;
  }
  // Try CRLF
  const origCRLF = orig.replace(/\r?\n/g, '\r\n');
  const replCRLF = replacement.replace(/\r?\n/g, '\r\n');
  if (content.includes(origCRLF)) {
    content = content.replace(origCRLF, replCRLF);
    return true;
  }
  // Try LF
  const origLF = orig.replace(/\r?\n/g, '\n');
  const replLF = replacement.replace(/\r?\n/g, '\n');
  if (content.includes(origLF)) {
    content = content.replace(origLF, replLF);
    return true;
  }
  return false;
}

// 1. In playAIPhase1: dummy investor fast advance
const oldAIPhase1 = `    player.isLocked = true;
    io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} FINISHED ACTIONS IN PHASE 1.\`);`;

const newAIPhase1 = `    if (player.isDummy) {
      player.isLocked = true;
      room.phase1TurnIndex = (room.phase1TurnIndex || 0) + 1;
      if (room.phase1TurnIndex >= room.players.length) {
         room.phase = 2;
         room.phase2TurnIndex = 0;
         room.players.forEach((p: any) => { p.isLocked = false; });
         const firstP = room.players[0];
         io.to(roomId).emit('notification', \`PHASE 2 BEGINS: It is \${firstP ? firstP.name : 'Unknown'}'s turn.\`);
      } else {
         const nextP = room.players[room.phase1TurnIndex];
         if (nextP) {
            io.to(roomId).emit('notification', \`IT IS NOW \${nextP.name.toUpperCase()}'S TURN.\`);
         }
      }
      io.to(roomId).emit('game_state_update', room);
      triggerAIIfNeeded(room, io, roomId);
      return;
    }

    player.isLocked = true;
    io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} FINISHED ACTIONS IN PHASE 1.\`);`;

if (replaceFlex(oldAIPhase1, newAIPhase1)) {
  console.log('✓ Patched playAIPhase1 dummy investor handling');
} else {
  console.log('✗ Could not find oldAIPhase1');
}

// 2. In playAIPhase2: skip AP tracking if quick mode, and do not buy mentor if dummy
const oldAIPhase2Launch = `            player.ownedCompanies.push(newCompany);
            player.valuation += (newCompany.valuation / 1000);
            player.cash -= newCompany.invest;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            
            room.actionCount += 1;
            player.actionCount = (player.actionCount || 0) + 1;`;

const newAIPhase2Launch = `            player.ownedCompanies.push(newCompany);
            player.valuation += (newCompany.valuation / 1000);
            player.cash -= newCompany.invest;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            
            if (room.mode !== 'quick' && room.mode !== 'short') {
              room.actionCount += 1;
              player.actionCount = (player.actionCount || 0) + 1;
            }`;

if (replaceFlex(oldAIPhase2Launch, newAIPhase2Launch)) {
  console.log('✓ Patched playAIPhase2 launch actionCount');
} else {
  console.log('✗ Could not find oldAIPhase2Launch');
}

const oldAIPhase2Upgrade = `            player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

            room.actionCount += 1;
            player.actionCount = (player.actionCount || 0) + 1;`;

const newAIPhase2Upgrade = `            player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);

            if (room.mode !== 'quick' && room.mode !== 'short') {
              room.actionCount += 1;
              player.actionCount = (player.actionCount || 0) + 1;
            }`;

if (replaceFlex(oldAIPhase2Upgrade, newAIPhase2Upgrade)) {
  console.log('✓ Patched playAIPhase2 stage upgrade actionCount');
} else {
  console.log('✗ Could not find oldAIPhase2Upgrade');
}

// In playAIPhase2: mentor card check for dummy
const oldAIPhase2Mentor = `    } else {
      if (player.boughtMentorRound !== room.round) {`;
const newAIPhase2Mentor = `    } else {
      if (player.isDummy) {
        // Dummy investor takes no actions in Phase 2
      } else if (player.boughtMentorRound !== room.round) {`;

if (replaceFlex(oldAIPhase2Mentor, newAIPhase2Mentor)) {
  console.log('✓ Patched playAIPhase2 dummy investor mentor skip');
} else {
  console.log('✗ Could not find oldAIPhase2Mentor');
}

// 3. In triggerAIIfNeeded: fast trigger for dummy investor without delay
const oldTriggerAI = `    if (activePlayer && activePlayer.is_ai) {
      setTimeout(() => {`;
const newTriggerAI = `    if (activePlayer && (activePlayer.is_ai || activePlayer.isDummy)) {
      if (activePlayer.isDummy) {
        if (room.phase === 1) playAIPhase1(room, activePlayer, io, roomId);
        else if (room.phase === 2) playAIPhase2(room, activePlayer, io, roomId);
        return;
      }
      setTimeout(() => {`;

if (replaceFlex(oldTriggerAI, newTriggerAI)) {
  console.log('✓ Patched triggerAIIfNeeded dummy investor handling');
} else {
  console.log('✗ Could not find oldTriggerAI');
}

// 4. In advanceRoundOrEndGame: sorting founders by AP with dummy investors kept at the end
const oldSortFounders = `    if (room.mode !== 'quick' && room.mode !== 'short') {
      const founders = (room.players || []).filter((p: any) => p.role?.toLowerCase() === 'founder');
      const nonFounders = (room.players || []).filter((p: any) => p.role?.toLowerCase() !== 'founder');
      
      founders.forEach((f: any, idx: number) => { f._prevOrder = idx; });
      founders.sort((a: any, b: any) => {
        const diff = (a.actionCount || 0) - (b.actionCount || 0);
        if (diff !== 0) return diff;
        return (a._prevOrder || 0) - (b._prevOrder || 0);
      });
      founders.forEach((f: any) => { delete f._prevOrder; });
      room.players = [...nonFounders, ...founders];
    }`;

const newSortFounders = `    if (room.mode !== 'quick' && room.mode !== 'short') {
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
    }`;

if (replaceFlex(oldSortFounders, newSortFounders)) {
  console.log('✓ Patched advanceRoundOrEndGame founder sorting with dummy at end');
} else {
  console.log('✗ Could not find oldSortFounders');
}

// 5. In start_game: shuffle players only in Standard Mode, maintain clockwise seating order in Quick Mode
const oldStartGameShuffle = `        shuffle(room.players);
        io.to(roomId).emit('game_state_update', room);`;

const newStartGameShuffle = `        // Section J.1 & K.3: Round 1 order is random in Standard Mode. In Quick Mode, players keep clockwise seating order.
        if (room.mode !== 'quick' && room.mode !== 'short') {
          shuffle(room.players);
        }
        io.to(roomId).emit('game_state_update', room);`;

if (replaceFlex(oldStartGameShuffle, newStartGameShuffle)) {
  console.log('✓ Patched start_game shuffle mode condition');
} else {
  console.log('✗ Could not find oldStartGameShuffle');
}

// 6. In phase2_action: launch, stage_up, buy_pr, upgrade_workforce actionCount checks
// Launch
const oldPhase2LaunchAP = `                   room.actionCount += 1;
                   player.actionCount = (player.actionCount || 0) + 1;
                   
                   io.to(roomId).emit('game_state_update', room);
                   io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} LAUNCHED \${newCompany.name.toUpperCase()} (STAGE \${stage})\`);`;

const newPhase2LaunchAP = `                   if (room.mode !== 'quick' && room.mode !== 'short') {
                     room.actionCount += 1;
                     player.actionCount = (player.actionCount || 0) + 1;
                   }
                   
                   io.to(roomId).emit('game_state_update', room);
                   io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} LAUNCHED \${newCompany.name.toUpperCase()} (STAGE \${stage})\`);`;

if (replaceFlex(oldPhase2LaunchAP, newPhase2LaunchAP)) {
  console.log('✓ Patched phase2_action launch actionCount');
} else {
  console.log('✗ Could not find oldPhase2LaunchAP');
}

// Stage up
const oldPhase2StageUpAP = `                        room.actionCount += 1;
                        player.actionCount = (player.actionCount || 0) + 1;

                        io.to(roomId).emit('game_state_update', room);`;

const newPhase2StageUpAP = `                        if (room.mode !== 'quick' && room.mode !== 'short') {
                          room.actionCount += 1;
                          player.actionCount = (player.actionCount || 0) + 1;
                        }

                        io.to(roomId).emit('game_state_update', room);`;

if (replaceFlex(oldPhase2StageUpAP, newPhase2StageUpAP)) {
  console.log('✓ Patched phase2_action stage_up actionCount');
} else {
  console.log('✗ Could not find oldPhase2StageUpAP');
}

// Buy PR
const oldPhase2BuyPRAP = `                   room.actionCount += 1;
                   player.actionCount = (player.actionCount || 0) + 1;
                   
                   io.to(roomId).emit('game_state_update', room);
                   io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} BOUGHT PR SERVICES FOR \${comp.name.toUpperCase()}\`);`;

const newPhase2BuyPRAP = `                   if (room.mode !== 'quick' && room.mode !== 'short') {
                     room.actionCount += 1;
                     player.actionCount = (player.actionCount || 0) + 1;
                   }
                   
                   io.to(roomId).emit('game_state_update', room);
                   io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} BOUGHT PR SERVICES FOR \${comp.name.toUpperCase()}\`);`;

if (replaceFlex(oldPhase2BuyPRAP, newPhase2BuyPRAP)) {
  console.log('✓ Patched phase2_action buy_pr actionCount');
} else {
  console.log('✗ Could not find oldPhase2BuyPRAP');
}

// Upgrade workforce
const oldPhase2WorkforceAP = `                   room.actionCount += 1;
                   player.actionCount = (player.actionCount || 0) + 1;
                   
                   io.to(roomId).emit('game_state_update', room);
                   io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} UPGRADED WORKFORCE FOR \${comp.name.toUpperCase()} TO LEVEL \${nextLvl}\`);`;

const newPhase2WorkforceAP = `                   if (room.mode !== 'quick' && room.mode !== 'short') {
                     room.actionCount += 1;
                     player.actionCount = (player.actionCount || 0) + 1;
                   }
                   
                   io.to(roomId).emit('game_state_update', room);
                   io.to(roomId).emit('notification', \`\${player.name.toUpperCase()} UPGRADED WORKFORCE FOR \${comp.name.toUpperCase()} TO LEVEL \${nextLvl}\`);`;

if (replaceFlex(oldPhase2WorkforceAP, newPhase2WorkforceAP)) {
  console.log('✓ Patched phase2_action upgrade_workforce actionCount');
} else {
  console.log('✗ Could not find oldPhase2WorkforceAP');
}

// 7. In buy_mentor_card:
const oldBuyMentorAP = `            room.actionCount = (room.actionCount || 0) + 1;
            player.actionCount = (player.actionCount || 0) + 1;
            
            io.to(roomId).emit('game_state_update', room);`;

const newBuyMentorAP = `            if (room.mode !== 'quick' && room.mode !== 'short') {
              room.actionCount = (room.actionCount || 0) + 1;
              player.actionCount = (player.actionCount || 0) + 1;
            }
            
            io.to(roomId).emit('game_state_update', room);`;

if (replaceFlex(oldBuyMentorAP, newBuyMentorAP)) {
  console.log('✓ Patched buy_mentor_card actionCount');
} else {
  console.log('✗ Could not find oldBuyMentorAP');
}

// 8. In undo_action:
const oldUndoAP = `        player.actionCount = Math.max(0, (player.actionCount || 1) - 1);
        room.actionCount = Math.max(0, (room.actionCount || 1) - 1);`;

const newUndoAP = `        if (room.mode !== 'quick' && room.mode !== 'short') {
          player.actionCount = Math.max(0, (player.actionCount || 1) - 1);
          room.actionCount = Math.max(0, (room.actionCount || 1) - 1);
        }`;

if (replaceFlex(oldUndoAP, newUndoAP)) {
  console.log('✓ Patched undo_action actionCount');
} else {
  console.log('✗ Could not find oldUndoAP');
}

// 9. In legacy launch_company:
const oldLegacyLaunchAP = `          rooms[roomId].actionCount += 1;
          player.actionCount = (player.actionCount || 0) + 1;`;

const newLegacyLaunchAP = `          if (rooms[roomId].mode !== 'quick' && rooms[roomId].mode !== 'short') {
            rooms[roomId].actionCount += 1;
            player.actionCount = (player.actionCount || 0) + 1;
          }`;

if (replaceFlex(oldLegacyLaunchAP, newLegacyLaunchAP)) {
  console.log('✓ Patched legacy launch_company actionCount');
} else {
  console.log('✗ Could not find oldLegacyLaunchAP');
}

fs.writeFileSync(socketPath, content, 'utf8');
console.log('Done applying Phase 7 patches to socket.ts');
