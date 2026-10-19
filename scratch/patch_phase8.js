const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('backend/src/socket.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Replace applyMentorCardEffect implementation
const startTag = '  const applyMentorCardEffect = (player: any, room: any, card: MentorCard, targetPlayerId: string, companyName: string, socket?: Socket) => {';
const endTag = '  const resolveAIBankruptcyIfNeeded = (player: any, room: any, io: any, roomId: string) => {';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end tag for applyMentorCardEffect");
  process.exit(1);
}

const newApplyMentorCardEffect = `  const applyMentorCardEffect = (player: any, room: any, card: MentorCard, targetPlayerId: string, companyName: string, socket?: Socket) => {
    const effect = card.effectType;
    let success = true;

    switch (effect) {
      case 'free_stage_up': {
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
      }
      case 'add_multiplier': {
        player.mentorMultiplier = (player.mentorMultiplier || 0) + 1;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} gets +1 on company multiplier next roll!\`);
        break;
      }
      case 'add_multiplier_2': {
        player.mentorMultiplier = (player.mentorMultiplier || 0) + 2;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} gets +2 on company multiplier next roll!\`);
        break;
      }
      case 'free_stage_or_cash': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) {
          comp = player.ownedCompanies.find((c: any) => getStageIndex(c.stage) < 3);
        }
        if (comp && getStageIndex(comp.stage) < 3) {
          const currentIndex = getStageIndex(comp.stage);
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
          player.cash += 10;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} claimed $10K cash option!\`);
        }
        break;
      }
      case 'free_pr': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (comp) {
          comp.freePRRound = room.round;
        } else {
          player.freePRRound = room.round;
        }
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} gets free PR \${comp ? 'for ' + comp.name : ''} this round!\`);
        break;
      }
      case 'free_workforce': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (comp) {
          comp.freeWorkforceRound = room.round;
        } else {
          player.freeWorkforceRound = room.round;
        }
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} gets free workforce upgrade \${comp ? 'for ' + comp.name : ''} this round!\`);
        break;
      }
      case 'shield_event': {
        player.eventShieldActive = true;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} gained an Event Shield!\`);
        break;
      }
      case 'peek_events': {
        const topTwo = (room.eventDeck || []).slice(0, 2);
        if (socket) {
          socket.emit('notification', \`PEEK EVENTS: Next is \${topTwo.map((e: any) => e.name).join(' & ') || 'None'}\`);
        }
        break;
      }
      case 'peek_event_1': {
        const topOne = (room.eventDeck || [])[0];
        if (socket) {
          socket.emit('notification', \`PEEK EVENT: Next is \${topOne ? topOne.name : 'None'}\`);
        }
        break;
      }
      case 'draw_two_cards': {
        if (!room.mentorDeck || room.mentorDeck.length < 2) {
          room.mentorDeck = [...(room.mentorDeck || []), ...shuffle(generateMentorDeck())];
        }
        const cardsDrawn = [room.mentorDeck.shift(), room.mentorDeck.shift()].filter(Boolean);
        player.mentorCards.push(...cardsDrawn);
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} drew 2 Mentor cards!\`);
        break;
      }
      case 'risk_multiplier': {
        player.riskMultiplierActive = room.round;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} activated Risk Multiplier for this round!\`);
        break;
      }
      case 'quick_launch_retain': {
        if ((player.ownedCompanies || []).length >= 4) {
          if (socket) socket.emit('notification', 'ACTION REJECTED: Maximum of 4 company launches allowed per Founder.');
          success = false;
          break;
        }
        let targetName = companyName;
        if (!targetName || !COMPANY_DATA_MAP[targetName] || player.ownedCompanies.some((c: any) => c.name.toUpperCase() === targetName.toUpperCase())) {
          const unowned = Object.keys(COMPANY_DATA_MAP).find(name => !player.ownedCompanies.some((c: any) => c.name.toUpperCase() === name.toUpperCase()));
          if (unowned) targetName = unowned;
        }
        if (!targetName || !COMPANY_DATA_MAP[targetName]) {
          if (socket) socket.emit('notification', 'ACTION REJECTED: No available company to launch.');
          success = false;
          break;
        }
        const dataRow = COMPANY_DATA_MAP[targetName];
        const retainCost = dataRow[1][0];
        if (player.cash < retainCost) {
          if (socket) socket.emit('notification', \`ACTION REJECTED: Insufficient cash ($\${retainCost}K needed) to launch at Retain.\`);
          success = false;
          break;
        }
        const retainValuation = dataRow[1][2];
        const retainRevenue = dataRow[1][1];

        const icons: Record<string, string> = {
          'CONTRACT FARMING': '/mat-icons/mat-icon-contract-farming.png',
          'AGRI IoT': '/mat-icons/mat-icon-agri-iot.png',
          'WALLET': '/mat-icons/mat-icon-wallet.png',
          'SNACKS': '/mat-icons/mat-icon-snacks.png',
          'QUICK COMMERCE': '/mat-icons/mat-icon-quick-commerce.png',
          'SMART STORAGE': '/mat-icons/mat-icon-smart-storage.png',
          'RESTRO - CHAIN': '/mat-icons/mat-icon-restro-chain.png',
          'TRACEABILITY': '/mat-icons/mat-icon-traceability.png',
          'ROBO - PACKAGING': '/mat-icons/mat-icon-robo-packaging.png'
        };

        const newComp = {
          name: targetName,
          icon: icons[targetName] || '🏢',
          invest: retainCost,
          revenue: retainRevenue,
          valuation: retainValuation,
          loan: 0,
          stage: 'R',
          team: 1,
          teamLevel: 1,
          equityGiven: 0
        };
        player.ownedCompanies.push(newComp);
        player.cash -= retainCost;
        player.valuation += (retainValuation / 1000);
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} quick-launched \${newComp.name} directly at Retain (Stage R)!\`);
        break;
      }
      case 'extra_loan': {
        player.cash += 50;
        player.loan = (player.loan || 0) + 50;
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} borrowed extra $50K from the bank.\`);
        break;
      }
      case 'extra_actions': {
        player.extraActions = 2;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} has 2 extra actions this round!\`);
        break;
      }
      case 'force_dice_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} locked roll to 6!\`);
        break;
      }
      case 'steal_cash': {
        room.players.forEach((p: any) => {
          if (p.id !== player.id) {
            const cut = Math.min(5, p.cash);
            p.cash -= cut;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
            player.cash += cut;
          }
        });
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} collected cash from players!\`);
        break;
      }
      case 'half_cost_stage_up': {
        player.hasHalfCostStageUp = true;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} will pay half cost on next stage up!\`);
        break;
      }
      case 'double_revenue': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          comp.doubleRevenueRound = room.round;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Double revenue set on \${comp.name}!\`);
        } else {
          success = false;
        }
        break;
      }
      case 'half_cost_all_stages': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (comp) {
          comp.halfCostAllStagesRound = room.round;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Half stage upgrade cost set for \${comp.name}!\`);
        } else {
          player.halfCostAllStagesCompany = companyName || (player.ownedCompanies[0]?.name);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Half stage upgrade cost set for \${player.name}!\`);
        }
        break;
      }
      case 'tech_revenue_boost': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) {
          const techNames = ['WALLET', 'AGRI IoT', 'TRACEABILITY', 'ROBO - PACKAGING', 'SMART STORAGE', 'QUICK COMMERCE'];
          comp = player.ownedCompanies.find((c: any) => techNames.includes(c.name.toUpperCase())) || player.ownedCompanies[0];
        }
        if (comp) {
          comp.techBoostRound = room.round;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Tech boost +$50K set on \${comp.name}!\`);
        } else {
          success = false;
        }
        break;
      }
      case 'discard_all_mentors': {
        room.players.forEach((p: any) => {
          p.mentorCards = [];
        });
        io.to(room.id).emit('notification', \`MENTOR EFFECT: ALL PLAYERS DISCARDED MENTOR CARDS!\`);
        break;
      }
      case 'skip_rival_turn': {
        const target = room.players.find((p: any) => p.id === targetPlayerId);
        if (target) {
          target.isLocked = true;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: \${target.name}'s turn was skipped!\`);
        } else {
          success = false;
        }
        break;
      }
      case 'reduce_tax': {
        player.taxDiscountRound = room.round;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: Tax and fees reduced by 50% for \${player.name} this round!\`);
        break;
      }
      case 'free_tech_invest': {
        const techCompanies = ['WALLET', 'AGRI IoT', 'TRACEABILITY', 'ROBO - PACKAGING', 'SMART STORAGE', 'QUICK COMMERCE'];
        let techComp = (player.ownedCompanies || []).find((c: any) => techCompanies.includes(c.name.toUpperCase()) && getStageIndex(c.stage) < 3);
        if (techComp) {
          const currentIndex = getStageIndex(techComp.stage);
          const nextStageIndex = currentIndex + 1;
          const dataRow = COMPANY_DATA_MAP[techComp.name];
          const nextValuation = dataRow ? dataRow[nextStageIndex][2] : techComp.valuation;
          const oldValuation = techComp.valuation || 0;
          techComp.stage = ['L', 'R', 'G', 'S'][nextStageIndex];
          techComp.valuation = nextValuation;
          player.valuation = player.valuation - (oldValuation / 1000) + (nextValuation / 1000);
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Tech Unicorn advanced \${techComp.name} to Stage \${techComp.stage} for free!\`);
        } else if ((player.ownedCompanies || []).length < 4) {
          const unownedTech = techCompanies.find(name => !player.ownedCompanies.some((c: any) => c.name.toUpperCase() === name.toUpperCase()));
          if (unownedTech && COMPANY_DATA_MAP[unownedTech]) {
            const dataRow = COMPANY_DATA_MAP[unownedTech];
            const icons: Record<string, string> = {
              'CONTRACT FARMING': '/mat-icons/mat-icon-contract-farming.png',
              'AGRI IoT': '/mat-icons/mat-icon-agri-iot.png',
              'WALLET': '/mat-icons/mat-icon-wallet.png',
              'SNACKS': '/mat-icons/mat-icon-snacks.png',
              'QUICK COMMERCE': '/mat-icons/mat-icon-quick-commerce.png',
              'SMART STORAGE': '/mat-icons/mat-icon-smart-storage.png',
              'RESTRO - CHAIN': '/mat-icons/mat-icon-restro-chain.png',
              'TRACEABILITY': '/mat-icons/mat-icon-traceability.png',
              'ROBO - PACKAGING': '/mat-icons/mat-icon-robo-packaging.png'
            };
            const newTechComp = {
              name: unownedTech,
              icon: icons[unownedTech] || '🏢',
              invest: 0,
              revenue: dataRow[0][1],
              valuation: dataRow[0][2],
              loan: 0,
              stage: 'L',
              team: 1,
              teamLevel: 1,
              equityGiven: 0
            };
            player.ownedCompanies.push(newTechComp);
            player.valuation += (newTechComp.valuation / 1000);
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            io.to(room.id).emit('notification', \`MENTOR EFFECT: Tech Unicorn launched \${newTechComp.name} for free!\`);
          } else {
            player.cash += 50;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
            io.to(room.id).emit('notification', \`MENTOR EFFECT: Tech Unicorn granted $50K dividend!\`);
          }
        } else {
          player.cash += 50;
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Tech Unicorn granted $50K dividend!\`);
        }
        break;
      }
      case 'mutual_draw': {
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
      }
      case 'halve_rival_cash': {
        const target = room.players.find((p: any) => p.id === targetPlayerId);
        if (target) {
          target.cash = Math.floor(target.cash / 2);
          target.capital = (target.cash / 1000) + target.valuation - (target.loan / 1000) - ((target.survivalLoan || 0) / 1000) - ((target.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: \${target.name}'s cash was halved!\`);
        } else {
          success = false;
        }
        break;
      }
      case 'auto_roll_6': {
        player.currentPhase3Roll = 6;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: Roll auto-set to 6!\`);
        break;
      }
      case 'cash_from_total_loans': {
        let totalLoans = 0;
        room.players.forEach((p: any) => {
          totalLoans += (p.loan || 0);
        });
        const bonus = Math.round(totalLoans * 0.20);
        player.cash += bonus;
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} received $\${bonus}K from total loan volume!\`);
        break;
      }
      case 'end_game_valuation_boost': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) {
          comp = player.ownedCompanies[0];
        }
        if (comp) {
          comp.endGameValuationBoost = true;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Valuation boost (+20%) locked in for \${comp.name} at game end!\`);
        } else {
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Valuation boost set for \${companyName || 'company'} at game end!\`);
        }
        break;
      }
      case 'sell_company_half_price': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          player.ownedCompanies = player.ownedCompanies.filter((c: any) => c.name !== comp.name);
          const refund = Math.floor((comp.valuation || 0) / 2);
          player.cash += refund;
          player.valuation -= ((comp.valuation || 0) / 1000);
          player.loan = Math.max(0, (player.loan || 0) - (comp.loan || 0));
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Sold \${comp.name} for $\${refund}K.\`);
        } else {
          success = false;
        }
        break;
      }
      case 'block_loans': {
        player.loansBlocked = true;
        player.loansBlockedRound = room.round;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: Loans blocked for \${player.name} this round!\`);
        break;
      }
      case 'lose_cash_20k': {
        player.cash -= 20;
        player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} lost $20K cash.\`);
        if (player.cash < 0) {
          const shortfall = Math.abs(player.cash);
          if (socket) socket.emit('trigger_bankruptcy', { shortfall });
          io.to(room.id).emit('notification', \`BANKRUPTCY ALERT: \${player.name} went bankrupt by -$\${shortfall}K!\`);
        }
        break;
      }
      case 'block_stage_up': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          comp.stageUpBlockedRound = room.round;
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Stage upgrades blocked for \${comp.name} this round!\`);
        } else {
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Upgrades blocked for \${companyName || 'company'}!\`);
        }
        break;
      }
      case 'forced_sale': {
        let comp = player.ownedCompanies.find((c: any) => c.name.toUpperCase() === companyName?.toUpperCase());
        if (!comp && player.ownedCompanies.length > 0) comp = player.ownedCompanies[0];
        if (comp) {
          player.ownedCompanies = player.ownedCompanies.filter((c: any) => c.name !== comp.name);
          const refund = Math.floor((comp.valuation || 0) / 2);
          player.cash += refund;
          player.valuation -= ((comp.valuation || 0) / 1000);
          player.loan = Math.max(0, (player.loan || 0) - (comp.loan || 0));
          player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000) - ((player.investorDebt || 0) / 1000);
          io.to(room.id).emit('notification', \`MENTOR EFFECT: Forced sale of \${comp.name} completed.\`);
        } else {
          success = false;
        }
        break;
      }
      case 'lose_action': {
        player.actionCount = (player.actionCount || 0) + 1;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} lost 1 action point!\`);
        break;
      }
      case 'miss_turn': {
        player.isLocked = true;
        io.to(room.id).emit('notification', \`MENTOR EFFECT: \${player.name} missed their turn!\`);
        break;
      }
      default: {
        success = false;
        break;
      }
    }

    return success;
  };

`;

content = content.substring(0, startIndex) + newApplyMentorCardEffect + content.substring(endIndex);

// 2. In advanceRoundOrEndGame: add cleanup of mentor flags and guardian shield check for immediate_tax_50
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
  console.log("Replaced roundReset in advanceRoundOrEndGame");
} else {
  console.error("Could not find roundResetSearch");
}

// 3. In immediate_tax_50: add guardian shield check and taxDiscount check
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
  console.log("Replaced taxEvent in advanceRoundOrEndGame");
} else {
  console.error("Could not find taxEventSearch");
}

// 4. In take_loan: check player.loansBlocked
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
  console.log("Added loansBlocked check in take_loan");
} else {
  console.error("Could not find takeLoanSearch");
}

// 5. In stage_up: check stageUpBlockedRound and halfCostAllStagesRound
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
  console.log("Updated stage_up with Toxic Mentor check and halfCostAllStages");
} else {
  console.error("Could not find stageUpSearch");
}

// 6. In buy_pr: check freePRRound and taxDiscountRound
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
  console.log("Updated buy_pr with freePRRound and taxDiscountRound");
} else {
  console.error("Could not find buyPrSearch");
}

// 7. In upgrade_workforce: check freeWorkforceRound
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
  console.log("Updated upgrade_workforce with freeWorkforceRound");
} else {
  console.error("Could not find upgradeWorkforceSearch");
}

// 8. In draw_mentor_card: ensure mentorDeck replenishes if empty
const drawMentorSearch = `            player.cash -= 20;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
            player.boughtMentorRound = room.round;

            const card = room.mentorDeck.shift();`;

const drawMentorReplacement = `            player.cash -= 20;
            player.capital = (player.cash / 1000) + player.valuation - (player.loan / 1000) - ((player.survivalLoan || 0) / 1000);
            player.boughtMentorRound = room.round;

            if (!room.mentorDeck || room.mentorDeck.length === 0) {
               room.mentorDeck = shuffle(generateMentorDeck());
            }
            const card = room.mentorDeck.shift();`;

if (content.includes(drawMentorSearch)) {
  content = content.replace(drawMentorSearch, drawMentorReplacement);
  console.log("Updated draw_mentor_card with deck auto-replenish");
} else {
  console.error("Could not find drawMentorSearch");
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Phase 8 patch completed successfully!");
