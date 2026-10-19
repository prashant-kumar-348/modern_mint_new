export interface EventCard {
  id: string;
  name: string;
  description: string;
  effect: string;
  immediate?: boolean;
}

export const eventCardsData: EventCard[] = [
  {
    id: 'E1',
    name: 'Bull Market',
    description: 'The market is booming. All PR costs are reduced by $100K.',
    effect: 'pr_discount_100'
  },
  {
    id: 'E2',
    name: 'Bear Market',
    description: 'Investors are hesitant. Loan interest is increased to 15%.',
    effect: 'loan_interest_15'
  },
  {
    id: 'E3',
    name: 'Tech Boom',
    description: 'Workforce upgrade costs are halved.',
    effect: 'workforce_discount_half'
  },
  {
    id: 'E4',
    name: 'Economic Stimulus',
    description: 'Government grants $100K stimulus per owned company to all Founders upon reveal.',
    effect: 'immediate_stimulus_100',
    immediate: true
  },
  {
    id: 'E5',
    name: 'Credit Crunch',
    description: 'Banks tighten lending. Bank loan interest is increased to 15%.',
    effect: 'loan_interest_15'
  },
  {
    id: 'E6',
    name: 'Marketing Subsidy',
    description: 'Public media campaigns are subsidized. All PR costs are reduced by $100K.',
    effect: 'pr_discount_100'
  },
  {
    id: 'E7',
    name: 'Innovation Grant',
    description: 'National innovation initiative. Workforce upgrade costs are halved.',
    effect: 'workforce_discount_half'
  },
  {
    id: 'E8',
    name: 'Regulatory Audit',
    description: 'Compliance checks required. Each Founder pays a one-time $50K audit fee.',
    effect: 'immediate_tax_50',
    immediate: true
  },
  {
    id: 'E9',
    name: 'Consumer Confidence',
    description: 'Strong consumer demand. All PR costs are reduced by $100K.',
    effect: 'pr_discount_100'
  },
  {
    id: 'E10',
    name: 'High Interest Rates',
    description: 'Central bank raises rates. Bank loan interest is increased to 15%.',
    effect: 'loan_interest_15'
  },
  {
    id: 'E11',
    name: 'Talent Influx',
    description: 'Global talent migration. Workforce upgrade costs are halved.',
    effect: 'workforce_discount_half'
  },
  {
    id: 'E12',
    name: 'Startup Relief Package',
    description: 'Startup relief program grants $100K per owned company to all Founders upon reveal.',
    effect: 'immediate_stimulus_100',
    immediate: true
  }
];

export function generateEventDeck(): EventCard[] {
  return [...eventCardsData];
}
