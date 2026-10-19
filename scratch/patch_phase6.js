const fs = require('fs');
const path = require('path');

const socketPath = path.join(__dirname, '..', 'backend', 'src', 'socket.ts');
let content = fs.readFileSync(socketPath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');

function safeReplace(fileContent, oldSnippet, newSnippet, label) {
  const normFile = normalize(fileContent);
  const normOld = normalize(oldSnippet);
  const normNew = normalize(newSnippet);

  if (normFile.includes(normOld)) {
    const escapedOld = normOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\r?\\n');
    const actualNew = isCRLF ? normNew.replace(/\n/g, '\r\n') : normNew;
    fileContent = fileContent.replace(new RegExp(escapedOld), actualNew);
    console.log('[SUCCESS]', label);
    return fileContent;
  } else {
    console.warn('[FAILED to find snippet]', label);
    return fileContent;
  }
}

// 1. dummyInvestorData import
if (!content.includes('dummyInvestorData')) {
  content = safeReplace(
    content,
    'import { generateEventDeck, EventCard } from "./eventCardsData";',
    'import { generateEventDeck, EventCard } from "./eventCardsData";\nimport { DUMMY_INVESTORS, getActiveDummyPeriod, DummyInvestorProfile } from "./dummyInvestorData";',
    'import dummyInvestorData'
  );
}

// 2. calculateFinalScores loop to ignore dummy
content = safeReplace(
  content,
  `  players.forEach((player: any) => {
    const isInvestor = player.role?.toLowerCase() === 'investor';`,
  `  players.forEach((player: any) => {
    if (player.isDummy) return;
    const isInvestor = player.role?.toLowerCase() === 'investor';`,
  'calculateFinalScores loop ignore dummy'
);

// 3. calculateFinalScores winner logic for real players count
content = safeReplace(
  content,
  `  if (players.length >= 4 && topInvestor) {
    if (topFounder) {
      topFounder.isFounderWinner = true;
      winners.push(topFounder);
    }
    topInvestor.isInvestorWinner = true;
    winners.push(topInvestor);
  } else if (topFounder) {
    topFounder.isFounderWinner = true;
    winners.push(topFounder);
  }`,
  `  const realPlayers = players.filter((p: any) => !p.isDummy);
  const realInvestors = investors.filter((i: any) => !i.isDummy);

  if (realPlayers.length >= 4 && topInvestor && !topInvestor.isDummy) {
    if (topFounder) {
      topFounder.isFounderWinner = true;
      winners.push(topFounder);
    }
    topInvestor.isInvestorWinner = true;
    winners.push(topInvestor);
  } else if (topFounder) {
    topFounder.isFounderWinner = true;
    winners.push(topFounder);
  }`,
  'winner logic for real players count'
);

// 4. createEmptyRoom: do not reveal card at R1, setup correct card count
content = safeReplace(
  content,
  `const createEmptyRoom = (maxPlayers = 4, mode = 'standard') => {
  const eventDeck = shuffle(generateEventDeck());
  return {
    players: [] as any[],
    deals: [] as any[],
    royaltyAgreements: [] as any[],
    mentorDeck: shuffle(generateMentorDeck()),
    eventDeck: eventDeck,
    activeEvent: eventDeck.shift() as EventCard | undefined,`,
  `const createEmptyRoom = (maxPlayers = 4, mode = 'standard') => {
  const isQuick = mode === 'quick' || mode === 'short';
  const fullEventDeck = shuffle(generateEventDeck());
  const eventCardsToPlace = isQuick ? 1 : 2;
  const eventDeck = fullEventDeck.slice(0, eventCardsToPlace);
  return {
    players: [] as any[],
    deals: [] as any[],
    royaltyAgreements: [] as any[],
    mentorDeck: shuffle(generateMentorDeck()),
    eventDeck: eventDeck,
    activeEvent: undefined as EventCard | undefined,
    dummyInvestor: null as any,`,
  'createEmptyRoom event cards and dummy'
);

// 5. advanceRoundOrEndGame event reveal logic and immediate effects
content = safeReplace(
  content,
  `    if (room.round === 4 || room.round === 7) {
      room.activeEvent = room.eventDeck.shift();
      if (room.activeEvent) {
        io.to(roomId).emit('notification', \`NEW EVENT CARD: \${room.activeEvent.name}\`);
      }
      
      const fundAmount = room.round === 4 ? 5000 : 10000;
      room.players.forEach((p: any) => {
         if (p.role === 'Investor') {
            p.cash += fundAmount;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000);
            io.to(roomId).emit('notification', \`INVESTOR FUNDING: \${p.name} received $\${fundAmount}K!\`);
         }
      });
    }`,
  `    if (room.round === 4 || (room.round === 7 && room.mode !== 'quick' && room.mode !== 'short')) {
      room.activeEvent = room.eventDeck.shift();
      if (room.activeEvent) {
        io.to(roomId).emit('notification', \`MARKET SHOCK (ROUND \${room.round} EVENT): \${room.activeEvent.name} — \${room.activeEvent.description}\`);
        
        if (room.activeEvent.effect === 'immediate_stimulus_100') {
          room.players.forEach((p: any) => {
            const compCount = (p.ownedCompanies || []).length;
            if (compCount > 0) {
              const bonus = compCount * 100;
              p.cash += bonus;
              p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000) - ((p.survivalLoan || 0) / 1000) - ((p.investorDebt || 0) / 1000);
              io.to(p.id).emit('notification', \`ECONOMIC STIMULUS: Received $\${bonus}K ($100K x \${compCount} companies)!\`);
            }
          });
        } else if (room.activeEvent.effect === 'immediate_tax_50') {
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
        }
      }
      
      const fundAmount = room.round === 4 ? 5000 : 10000;
      room.players.forEach((p: any) => {
         if (p.role === 'Investor' && !p.isDummy) {
            p.cash += fundAmount;
            p.capital = (p.cash / 1000) + p.valuation - (p.loan / 1000);
            io.to(roomId).emit('notification', \`INVESTOR FUNDING: \${p.name} received $\${fundAmount}K!\`);
         }
      });
    }`,
  'advanceRoundOrEndGame event reveal and immediate effects'
);

// 6. start_game Dummy Investor setup
content = safeReplace(
  content,
  `    socket.on('start_game', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && !room.isStarted && room.players.length >= 2) {
        room.isStarted = true;
        if (!room.teamTokenPoolModified) {
          room.teamTokenPool = getStartingTeamTokenPool(room.players.length);
        }
        shuffle(room.players);`,
  `    socket.on('start_game', ({ roomId }) => {
      const room = rooms[roomId];
      if (room && !room.isStarted && room.players.length >= 2) {
        room.isStarted = true;
        const realPlayers = room.players.filter((p: any) => !p.isDummy);
        if (!room.teamTokenPoolModified) {
          room.teamTokenPool = getStartingTeamTokenPool(realPlayers.length);
        }
        
        // Dummy Investor setup for 2-3 player games without human investors
        const realInvestors = realPlayers.filter((p: any) => p.role?.toLowerCase() === 'investor');
        if (realPlayers.length <= 3 && realInvestors.length === 0) {
          const selected = DUMMY_INVESTORS[Math.floor(Math.random() * DUMMY_INVESTORS.length)];
          room.dummyInvestor = { ...selected };
          
          const dummyPlayer = {
            id: 'dummy_investor',
            name: \`\${selected.name} (Dummy)\`,
            role: 'Investor',
            isDummy: true,
            cash: 10000,
            capital: 10,
            loan: 0,
            survivalLoan: 0,
            valuation: 0,
            ownedCompanies: [],
            color: '#00e1ff',
            avatarId: 5,
            isLocked: true
          };
          
          if (!room.players.some((p: any) => p.id === 'dummy_investor')) {
            room.players.push(dummyPlayer);
          }
          io.to(roomId).emit('notification', \`DUMMY INVESTOR SETUP: \${selected.name} active for 2–3 player game.\`);
        }

        shuffle(room.players);`,
  'start_game Dummy Investor setup'
);

// 7. propose_royalty_agreement Dummy Investor handling
content = safeReplace(
  content,
  `    socket.on('propose_royalty_agreement', ({ roomId, targetPlayerId, founderId, investorId, companyName, percentage }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.id === socket.id);
        const targetPlayer = room.players.find((p: any) => p.id === targetPlayerId);
        if (proposer && targetPlayer) {`,
  `    socket.on('propose_royalty_agreement', ({ roomId, targetPlayerId, founderId, investorId, companyName, percentage }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.id === socket.id);
        const targetPlayer = room.players.find((p: any) => p.id === targetPlayerId);

        // Handle Dummy Investor automated deal evaluation
        if (targetPlayer && targetPlayer.isDummy) {
           const activePeriod = getActiveDummyPeriod(room.round, room.dummyInvestor);
           if (!activePeriod) {
              socket.emit('notification', \`DUMMY INVESTOR: No investment available in Round \${room.round}.\`);
              return;
           }

           const pct = Number(percentage) || 0;
           if (pct < activePeriod.equityRequired) {
              socket.emit('notification', \`DUMMY INVESTOR REJECTED: \${targetPlayer.name} requires at least \${activePeriod.equityRequired}% for \${activePeriod.rounds}.\`);
              return;
           }

           const founder = room.players.find((p: any) => p.id === founderId);
           const targetComp = (founder?.ownedCompanies || []).find((c: any) => c.name?.toUpperCase().trim() === companyName.toUpperCase().trim());
           if (targetComp && (targetComp.equityGiven || 0) + pct > 100) {
              socket.emit('notification', 'ACTION REJECTED: Aggregate equity cannot exceed 100%.');
              return;
           }

           const grantCash = activePeriod.maxFunding;
           if (!room.royaltyAgreements) room.royaltyAgreements = [];
           room.royaltyAgreements.push({
              id: \`agr_\${Date.now()}\`,
              founderId: founderId,
              founderName: founder?.name || 'Founder',
              investorId: targetPlayer.id,
              investorName: targetPlayer.name,
              companyName: companyName,
              percentage: pct,
              equity: pct,
              cash: grantCash,
              loan: 0,
              royalty: 0,
              converted: false
           });
           if (targetComp) {
              targetComp.equityGiven = (targetComp.equityGiven || 0) + pct;
           }
           if (founder) {
              founder.cash += grantCash;
              founder.capital = (founder.cash / 1000) + founder.valuation - (founder.loan / 1000) - ((founder.survivalLoan || 0) / 1000) - ((founder.investorDebt || 0) / 1000);
           }
           io.to(roomId).emit('notification', \`DUMMY INVESTOR DEAL COMPLETED: \${targetPlayer.name} granted $\${grantCash}K to \${founder?.name} for \${pct}% equity in \${companyName}!\`);
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        if (proposer && targetPlayer) {`,
  'propose_royalty_agreement Dummy Investor'
);

// 8. propose_royalty_deal Dummy Investor handling
content = safeReplace(
  content,
  `    socket.on('propose_royalty_deal', ({ roomId, proposerName, partnerName, cash, equity, loan, royalty, terms, companyName }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.name === proposerName);
        const partner = room.players.find((p: any) => p.name === partnerName);

        if (proposer && partner) {`,
  `    socket.on('propose_royalty_deal', ({ roomId, proposerName, partnerName, cash, equity, loan, royalty, terms, companyName }) => {
      if (rooms[roomId]) {
        const room = rooms[roomId];
        const proposer = room.players.find((p: any) => p.name === proposerName);
        const partner = room.players.find((p: any) => p.name === partnerName);

        // Dummy Investor automated evaluation
        if (proposer && partner && partner.isDummy) {
           const activePeriod = getActiveDummyPeriod(room.round, room.dummyInvestor);
           if (!activePeriod) {
              socket.emit('notification', \`DUMMY INVESTOR: No investment available in Round \${room.round}.\`);
              return;
           }

           const requestedCash = Number(cash) || 0;
           const offeredEquity = Number(equity) || 0;

           if (requestedCash > activePeriod.maxFunding) {
              socket.emit('notification', \`DUMMY INVESTOR REJECTED: Maximum funding for \${activePeriod.rounds} is $\${activePeriod.maxFunding}K.\`);
              return;
           }

           if (offeredEquity < activePeriod.equityRequired) {
              socket.emit('notification', \`DUMMY INVESTOR REJECTED: \${partner.name} requires at least \${activePeriod.equityRequired}% equity for \${activePeriod.rounds}.\`);
              return;
           }

           const targetComp = (proposer.ownedCompanies || []).find((c: any) => c.name?.toUpperCase().trim() === (companyName || '').toUpperCase().trim());
           if (targetComp && (targetComp.equityGiven || 0) + offeredEquity > 100) {
              socket.emit('notification', \`ACTION REJECTED: Aggregate equity for \${targetComp.name} cannot exceed 100%.\`);
              return;
           }

           const proposalId = \`proposal_\${Date.now()}\`;
           const dummyProposal = {
              id: proposalId,
              proposerId: proposer.id,
              proposer: proposerName,
              proposerName: proposerName,
              partnerId: partner.id,
              partner: partnerName,
              partnerName: partnerName,
              founderId: proposer.id,
              investorId: partner.id,
              cash: requestedCash,
              equity: offeredEquity,
              loan: Number(loan) || 0,
              royalty: Number(royalty) || 0,
              terms: terms || '',
              companyName: companyName || '',
              proposerSigned: true,
              partnerSigned: true
           };
           processAcceptedDeal(room, dummyProposal, socket, io, roomId);
           io.to(roomId).emit('notification', \`DUMMY INVESTOR ACCEPTED: \${partner.name} funded $\${requestedCash}K in \${proposer.name}'s \${companyName} for \${offeredEquity}% equity!\`);
           io.to(roomId).emit('game_state_update', room);
           return;
        }

        if (proposer && partner) {`,
  'propose_royalty_deal Dummy Investor'
);

fs.writeFileSync(socketPath, content, 'utf8');
console.log('Finished safe patching socket.ts');
