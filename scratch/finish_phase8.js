const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('backend/src/socket.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Toxic Mentor check in stage_up
const compCheck = "actionType === 'stage_up') {\n              const comp = player.ownedCompanies.find((c: any) => c.name === companyName);\n              if (comp) {";
const compReplacement = "actionType === 'stage_up') {\n              const comp = player.ownedCompanies.find((c: any) => c.name === companyName);\n              if (comp) {\n                 if (comp.stageUpBlockedRound === room.round) {\n                    socket.emit('notification', `ACTION REJECTED: ${comp.name} is blocked from staging up this round due to Toxic Mentor.`);\n                    return;\n                 }";

if (content.includes(compCheck)) {
  content = content.replace(compCheck, compReplacement);
  console.log("SUCCESS: Added Toxic Mentor check to stage_up");
} else {
  console.error("FAIL: Could not find compCheck");
}

// 2. halfCostAllStages in stage_up
const halfCostCheck = "if (player.hasHalfCostStageUp) {\n                          stageUpCost = Math.round(stageUpCost / 2);\n                          player.hasHalfCostStageUp = false;\n                       }";
const halfCostReplacement = "if (player.hasHalfCostStageUp || comp.halfCostAllStagesRound === room.round || player.halfCostAllStagesCompany === comp.name) {\n                          stageUpCost = Math.round(stageUpCost / 2);\n                          if (player.hasHalfCostStageUp) player.hasHalfCostStageUp = false;\n                       }";

if (content.includes(halfCostCheck)) {
  content = content.replace(halfCostCheck, halfCostReplacement);
  console.log("SUCCESS: Added halfCostAllStages to stage_up");
} else {
  console.error("FAIL: Could not find halfCostCheck");
}

// 3. Auto replenish deck in buy_mentor_card
const deckShift = "player.boughtMentorRound = room.round;\n         const card = room.mentorDeck.shift();";
const deckShiftReplacement = "player.boughtMentorRound = room.round;\n         if (!room.mentorDeck || room.mentorDeck.length === 0) {\n            room.mentorDeck = shuffle(generateMentorDeck());\n         }\n         const card = room.mentorDeck.shift();";

if (content.includes(deckShift)) {
  content = content.replace(deckShift, deckShiftReplacement);
  console.log("SUCCESS: Added deck auto-replenish to buy_mentor_card");
} else {
  console.error("FAIL: Could not find deckShift");
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log("finish_phase8 completed!");
