export interface DummyInvestorPeriod {
  rounds: string;
  minRound: number;
  maxRound: number;
  maxFunding: number; // in $K
  equityRequired: number; // in %
  condition: string;
}

export interface DummyInvestorProfile {
  id: string;
  name: string;
  title: string;
  periods: DummyInvestorPeriod[];
}

export const DUMMY_INVESTORS: DummyInvestorProfile[] = [
  {
    id: 'dummy_apex',
    name: 'Apex Syndicate',
    title: 'Seed & Growth Syndicate',
    periods: [
      {
        rounds: 'Rounds 2–3',
        minRound: 2,
        maxRound: 3,
        maxFunding: 500,
        equityRequired: 10,
        condition: 'Seed investment: up to $500K for 10% equity.'
      },
      {
        rounds: 'Rounds 4–6',
        minRound: 4,
        maxRound: 6,
        maxFunding: 1500,
        equityRequired: 15,
        condition: 'Series A funding: up to $1,500K for 15% equity.'
      },
      {
        rounds: 'Rounds 7–9',
        minRound: 7,
        maxRound: 9,
        maxFunding: 3000,
        equityRequired: 20,
        condition: 'Scale funding: up to $3,000K for 20% equity.'
      }
    ]
  },
  {
    id: 'dummy_vanguard',
    name: 'Vanguard Capital',
    title: 'Venture Capital Partner',
    periods: [
      {
        rounds: 'Rounds 2–3',
        minRound: 2,
        maxRound: 3,
        maxFunding: 600,
        equityRequired: 12,
        condition: 'Early stage: up to $600K for 12% equity.'
      },
      {
        rounds: 'Rounds 4–6',
        minRound: 4,
        maxRound: 6,
        maxFunding: 2000,
        equityRequired: 18,
        condition: 'Expansion: up to $2,000K for 18% equity.'
      },
      {
        rounds: 'Rounds 7–9',
        minRound: 7,
        maxRound: 9,
        maxFunding: 4000,
        equityRequired: 25,
        condition: 'Late stage: up to $4,000K for 25% equity.'
      }
    ]
  }
];

export function getActiveDummyPeriod(round: number, dummyInvestor: DummyInvestorProfile): DummyInvestorPeriod | undefined {
  if (!dummyInvestor || !dummyInvestor.periods) return undefined;
  return dummyInvestor.periods.find(p => round >= p.minRound && round <= p.maxRound);
}
