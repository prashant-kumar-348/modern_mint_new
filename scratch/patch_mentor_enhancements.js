const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('backend/src/socket.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. In initial_roll, preserve player.currentPhase3Roll if set by Sure Shot or Strategic Mentor
const rollSearch = `           const finalRoll = playerRoll || Math.floor(Math.random() * 10) + 1;
           player.currentPhase3Roll = finalRoll;`;

const rollReplacement = `           const finalRoll = player.currentPhase3Roll || playerRoll || Math.floor(Math.random() * 10) + 1;
           player.currentPhase3Roll = finalRoll;`;

if (content.includes(rollSearch)) {
  content = content.replace(rollSearch, rollReplacement);
  console.log("SUCCESS: Updated initial_roll to preserve currentPhase3Roll");
} else {
  console.error("FAIL: Could not find rollSearch");
}

// 2. Update free_stage_up fallback to save card in inventory if no company owned yet
const freeStageUpSearch = `      case 'free_stage_up': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
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
            io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name}'s \${comp.name} advanced to Stage \${comp.stage} for free!\`);
          } else {
            success = false;
            if (socket) socket.emit('notification', 'Company is already at maximum stage.');
          }
        } else {
          success = false;
          if (socket) socket.emit('notification', 'Company not found.');
        }
        break;
      }`;

const freeStageUpReplacement = `      case 'free_stage_up': {
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
            io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name}'s \${comp.name} advanced to Stage \${comp.stage} for free!\`);
          } else {
            success = false;
            if (socket) socket.emit('notification', 'Company is already at maximum stage.');
          }
        } else {
          if (!player.mentorCards.some((c: any) => c.id === card.id)) {
            player.mentorCards.push(card);
            io.to(room.id).emit('notification', \`MENTOR EFFECT: \${card.name} stored in inventory (activate once you own an upgradable company).\`);
          }
        }
        break;
      }`;

if (content.includes(freeStageUpSearch)) {
  content = content.replace(freeStageUpSearch, freeStageUpReplacement);
  console.log("SUCCESS: Updated free_stage_up");
} else {
  console.error("FAIL: Could not find freeStageUpSearch");
}

// 3. Update skip_rival_turn, halve_rival_cash, mutual_draw to auto-target rival if targetPlayerId is empty
const skipTurnSearch = `      case 'skip_rival_turn': {
        const target = room.players.find((p: any) => p.id === targetPlayerId);
        if (target) {
          target.isLocked = true;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: \${target.name}'s turn was skipped!\`);
        } else {
          success = false;
        }
        break;
      }`;

const skipTurnReplacement = `      case 'skip_rival_turn': {
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
          io.to(room.id).emit('notification', \`MENTOR EFFECT: \${target.name}'s turn was skipped by Boardroom Shark!\`);
        } else {
          success = false;
        }
        break;
      }`;

if (content.includes(skipTurnSearch)) {
  content = content.replace(skipTurnSearch, skipTurnReplacement);
  console.log("SUCCESS: Updated skip_rival_turn");
} else {
  console.error("FAIL: Could not find skipTurnSearch");
}

const halveCashSearch = `      case 'halve_rival_cash': {
        const target = room.players.find((p: any) => p.id === targetPlayerId);
        if (target) {
          target.cash = Math.floor(target.cash / 2);
          target.capital = (target.cash / 1000) + target.valuation - (target.loan / 1000) - ((target.survivalLoan || 0) / 1000) - ((target.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: \${target.name}'s cash was halved!\`);
        } else {
          success = false;
        }
        break;
      }`;

const halveCashReplacement = `      case 'halve_rival_cash': {
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
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Disruptor halved \${target.name}'s cash (-$\${lost}K)!\`);
        } else {
          success = false;
        }
        break;
      }`;

if (content.includes(halveCashSearch)) {
  content = content.replace(halveCashSearch, halveCashReplacement);
  console.log("SUCCESS: Updated halve_rival_cash");
} else {
  console.error("FAIL: Could not find halveCashSearch");
}

const mutualDrawSearch = `      case 'mutual_draw': {
        const target = room.players.find((p: any) => p.id === targetPlayerId);
        if (target) {
          if (!room.mentorDeck || room.mentorDeck.length < 2) {
            room.mentorDeck = [...(room.mentorDeck || []), ...shuffle(generateMentorDeck())];
          }
          const card1 = room.mentorDeck.shift();
          const card2 = room.mentorDeck.shift();
          if (card1) player.mentorCards.push(card1);
          if (card2) target.mentorCards.push(card2);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Both \${player.name} & \${target.name} drew 1 card!\`);
        } else {
          success = false;
        }
        break;
      }`;

const mutualDrawReplacement = `      case 'mutual_draw': {
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
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Both \${player.name} & \${target.name} drew 1 card!\`);
        } else {
          success = false;
        }
        break;
      }`;

if (content.includes(mutualDrawSearch)) {
  content = content.replace(mutualDrawSearch, mutualDrawReplacement);
  console.log("SUCCESS: Updated mutual_draw");
} else {
  console.error("FAIL: Could not find mutualDrawSearch");
}

// 4. Update force_dice_6 and auto_roll_6 to emit initial_roll_result
const forceRollSearch = `      case 'force_dice_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} locked roll to 6!\`);
        break;
      }`;

const forceRollReplacement = `      case 'force_dice_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('initial_roll_result', { playerId: player.id, roll: 6 });
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} locked roll to 6!\`);
        break;
      }`;

if (content.includes(forceRollSearch)) {
  content = content.replace(forceRollSearch, forceRollReplacement);
  console.log("SUCCESS: Updated force_dice_6");
} else {
  console.error("FAIL: Could not find forceRollSearch");
}

const autoRollSearch = `      case 'auto_roll_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: Roll auto-set to 6!\`);
        break;
      }`;

const autoRollReplacement = `      case 'auto_roll_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('initial_roll_result', { playerId: player.id, roll: 6 });
        io.to(room.id).emit('notification', \`MENTOR EFFECT: Roll auto-set to 6!\`);
        break;
      }`;

if (content.includes(autoRollSearch)) {
  content = content.replace(autoRollSearch, autoRollReplacement);
  console.log("SUCCESS: Updated auto_roll_6");
} else {
  console.error("FAIL: Could not find autoRollSearch");
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Completed patch_mentor_enhancements.js!");
