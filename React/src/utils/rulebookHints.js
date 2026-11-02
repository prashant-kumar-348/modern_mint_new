export function getRulebookHint({
  phase,
  round,
  role = 'founder',
  isLocked = false,
  isMyTurn = true
}) {
  const isFounder = (role || 'founder').toLowerCase() === 'founder';

  if (isLocked) {
    return {
      title: "Waiting for Others!",
      subtitle: "Waiting for remaining players to lock their turns...",
      badge: "Turn Locked",
      ruleRef: "Turn In Progress",
      description: "Your decisions for this turn have been locked in. The game will advance automatically as soon as the remaining players finish.",
      tip: "Sit tight while other founders and investors complete their actions.",
      iconName: 'Activity'
    };
  }

  // PHASE 1: Fundraising & Bank Loans (Rounds 2–9; Skipped in Round 1)
  if (phase === 1) {
    if (round === 4) {
      return {
        title: "Discuss amongst the players!",
        subtitle: "Press M to Unmute • Event Card 1 active • Pitch deals & borrow",
        badge: "Round 4 • Event 1 Active",
        ruleRef: "Rulebook Section D",
        description: "Event Card 1 has been revealed! Pitch deals to investors or fellow founders, or take Bank Loans. Bank loans & deals do NOT use any of your 30 Action Points!",
        tip: "👉 Press M to Unmute. Take eligible loans or negotiate deals. Click 'LOCK THE DEAL' when ready.",
        iconName: 'Handshake'
      };
    }

    if (round === 7) {
      return {
        title: "Discuss amongst the players!",
        subtitle: "Press M to Unmute • Event Card 2 active • Fresh investor funds",
        badge: "Round 7 • Event 2 Active",
        ruleRef: "Rulebook Section D",
        description: "Event Card 2 has been revealed and investors received fresh funds! Secure capital (Equity, Royalty, or Loan) or take Bank Loans.",
        tip: "👉 Press M to Unmute. Pitch to investors or take Bank Loans. Click 'LOCK THE DEAL' when ready.",
        iconName: 'Handshake'
      };
    }

    if (round === 9) {
      return {
        title: "Discuss amongst the players!",
        subtitle: "Press M to Unmute • Final fundraising & deal negotiation round",
        badge: "Round 9 • Final Round",
        ruleRef: "Rulebook Section D",
        description: "Final fundraising phase! Raise any needed capital to fund operations or stage-up your companies before the game concludes.",
        tip: "👉 Press M to Unmute. Complete final deals or take loans. Click 'LOCK THE DEAL' when ready.",
        iconName: 'Handshake'
      };
    }

    return {
      title: "Discuss amongst the players!",
      subtitle: round === 2 
        ? "Press M to Unmute • Pitch deals & take bank loans" 
        : "Press M to Unmute",
      badge: `Round ${round} • Phase 1`,
      ruleRef: "No Action Points Required",
      description: "Pitch to investors for cash (Equity, Royalty, or Loan) using 'Offer a Deal', or borrow money using 'Take Bank Loan'. Bank loans & deals do NOT use any of your 30 Action Points!",
      tip: "👉 Press M to Unmute. Take eligible loans or negotiate deals. Click 'LOCK THE DEAL' when ready.",
      iconName: 'Handshake'
    };
  }

  // PHASE 2: Operations & Growth (All Rounds 1–9)
  if (phase === 2) {
    if (round === 1) {
      if (isFounder) {
        return {
          title: "Round 1: Operations Phase",
          subtitle: "Launch up to 4 companies on the board with your $500K starting cash",
          badge: "Round 1 • Operations",
          ruleRef: "Phase 1 is Skipped in Round 1",
          description: "You have $500K starting cash! Launch up to 4 companies on the board, upgrade your workforce, or purchase PR services. Each action costs 1 Action Point from your 30 lifetime limit.",
          tip: "👉 Click 'Launch Company' or click icons on the board. When finished, click 'END ACTIONS'.",
          iconName: 'Rocket'
        };
      } else {
        return {
          title: "Round 1: Observation Phase",
          subtitle: "Watch founder launches & prepare your investment strategy",
          badge: "Round 1 • Observation",
          ruleRef: "Phase 1 is Skipped in Round 1",
          description: "Observe founders as they establish startups and build initial teams. Prepare your investment strategy for Round 2 fundraising!",
          tip: "👉 Watch founder launches. Click 'END ACTIONS' when ready to advance to Phase 3.",
          iconName: 'Handshake'
        };
      }
    }

    if (round === 9) {
      if (isFounder) {
        return {
          title: "Round 9: Final Operations",
          subtitle: "Final actions to Stage Up (L → R → G → S) & maximize valuations",
          badge: "Round 9 • Final Actions",
          ruleRef: "Rulebook Section E",
          description: "This is your final chance to execute operations! Stage up companies, upgrade teams, and buy PR to maximize your final company valuations.",
          tip: "👉 Use your remaining Action Points wisely. When done, click 'END ACTIONS' to enter the final revenue roll!",
          iconName: 'Building2'
        };
      } else {
        return {
          title: "Round 9: Portfolio Review",
          subtitle: "Final review of founder expansions before the final revenue roll",
          badge: "Round 9 • Final Review",
          ruleRef: "Rulebook Section E",
          description: "Final operations phase! Observe founders' final stage-ups and prepare to calculate net worth from your equity and revenue shares.",
          tip: "👉 Review all founder board positions. Click 'END ACTIONS' when ready.",
          iconName: 'Activity'
        };
      }
    }

    if (isFounder) {
      return {
        title: "Phase 2: Operations & Growth",
        subtitle: "Launch, Stage Up (L → R → G → S), Upgrade Team, or Buy PR (30 actions max)",
        badge: `Round ${round} • Phase 2`,
        ruleRef: "1 Action Point per Action",
        description: "Execute operations: Launch new startups, Stage Up (L → R → G → S), Upgrade Workforce, Buy PR (doubles revenue), or Buy a Mentor Card ($20K). You have 30 total actions for the whole game.",
        tip: "👉 Use your Action Keys on the bar below. When finished, click 'END ACTIONS' to proceed to Revenue Rolls!",
        iconName: 'Building2'
      };
    } else {
      return {
        title: "Phase 2: Portfolio Review",
        subtitle: "Monitor founder operations & stage-ups across the board",
        badge: `Round ${round} • Phase 2`,
        ruleRef: "Investor Observation",
        description: "Monitor founder expansions, workforce upgrades, and PR campaigns. Advise founders on stage-ups to maximize upcoming revenue sharing returns.",
        tip: "👉 Review company growth on the board. Click 'END ACTIONS' when ready to proceed to Phase 3.",
        iconName: 'Activity'
      };
    }
  }

  // PHASE 3: Roll the Dice for Revenue & Loan Settle (All Rounds 1–9)
  if (phase === 3) {
    if (round === 1) {
      if (isFounder) {
        return {
          title: "Round 1: Roll the Dice for Revenue!",
          subtitle: "Roll D10 to calculate Net Revenue = Base Rev × Team Multiplier",
          badge: "Round 1 • Revenue Roll",
          ruleRef: "Rulebook Section F",
          description: "Roll the D10 die! Positive revenue is paid from the bank to you; losses are paid to the bank. Pay 10% loan interest or repay loans. If facing a loss, use your 2nd Chance lifeline or Bankruptcy plan.",
          tip: "👉 Click 'Roll the Dice' to generate revenue for your companies and settle round accounts.",
          iconName: 'Coins'
        };
      } else {
        return {
          title: "Round 1: Revenue Collection",
          subtitle: "Watch founder rolls • First revenue distribution of the game",
          badge: "Round 1 • Revenue Collection",
          ruleRef: "Rulebook Section F",
          description: "Founders roll the D10 die for company revenues. Observe founder rolls and prepare for Round 2 fundraising!",
          tip: "👉 Watch founder rolls and prepare for Round 2 negotiations.",
          iconName: 'Coins'
        };
      }
    }

    if (round === 9) {
      if (isFounder) {
        return {
          title: "Round 9: Final Revenue Roll!",
          subtitle: "Roll D10 for final revenue • Pay 10% loan interest before final Net Worth tally",
          badge: "Round 9 • Final Roll",
          ruleRef: "Rulebook Section F",
          description: "The final roll of the game! Roll D10 for your final company revenues. Settle any outstanding loans to maximize your final Net Worth and claim victory!",
          tip: "👉 Click 'Roll the Dice' for the grand finale revenue calculation!",
          iconName: 'Coins'
        };
      } else {
        return {
          title: "Round 9: Final Revenue Collection",
          subtitle: "Collect final royalty cuts • Prepare for final Net Worth winner declaration",
          badge: "Round 9 • Final Distribution",
          ruleRef: "Rulebook Section F",
          description: "Final revenue distribution! Collect your revenue-sharing payouts and tally up total net worth to determine the winner.",
          tip: "👉 Watch final founder rolls and collect your revenue share payments.",
          iconName: 'Coins'
        };
      }
    }

    if (isFounder) {
      return {
        title: "Phase 3: Roll the Dice for Revenue!",
        subtitle: "Roll D10 to calculate Net Revenue = Base Rev × Team Multiplier",
        badge: `Round ${round} • Phase 3`,
        ruleRef: "Net Revenue = Projected Rev × Team Multiplier",
        description: "Roll the D10 die! Positive revenue is paid from the bank to you; losses are paid to the bank. Pay 10% loan interest or repay loans. If facing a loss, use your 2nd Chance lifeline or Bankruptcy plan.",
        tip: "👉 Click 'Roll the Dice' to generate revenue for your companies and settle round accounts.",
        iconName: 'Coins'
      };
    } else {
      return {
        title: "Phase 3: Revenue Collection",
        subtitle: "Founders roll D10 for revenues • Collect royalty cuts after rolls",
        badge: `Round ${round} • Phase 3`,
        ruleRef: "Royalty & Debt Returns",
        description: "Founders roll the D10 die for company revenues. If you hold Royalty or Revenue-Sharing deals with an operating founder, collect your agreed return immediately after their roll!",
        tip: "👉 Watch founder rolls and collect your revenue share payments.",
        iconName: 'Coins'
      };
    }
  }

  return {
    title: "Modern Mint Strategy Co.",
    subtitle: "Plan stage-up costs, bank loans, and workforce upgrades",
    badge: "Official Rulebook",
    ruleRef: "Round Flow",
    description: "Follow the 3-phase flow each round: 1. Fundraise & Loans → 2. Operations (up to 30 actions total) → 3. Revenue Roll.",
    tip: "👉 Check your Player Mat to plan stage-up costs, loans, and team upgrades.",
    iconName: 'Building2'
  };
}
