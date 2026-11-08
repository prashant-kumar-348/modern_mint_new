// Modern Mint Bank & Reserve Currency Notes Configuration
// Complete suite of all 9 official Modern Reserve Note denominations

export const CURRENCY_NOTES = [
  {
    id: 'note-100000k',
    value: 100000,
    label: '$100,000K',
    title: 'Hundred Million Dollars',
    color: '#F4D03F',
    bgGradient: 'from-amber-200 to-yellow-400',
    image: '/notes/note-100000k.png',
    description: 'The highest denomination Modern Reserve Note issued by The Modern Mint Bank for mega deals and institutional transactions.'
  },
  {
    id: 'note-10000k',
    value: 10000,
    label: '$10,000K',
    title: 'Ten Million Dollars',
    color: '#82E0AA',
    bgGradient: 'from-emerald-200 to-green-400',
    image: '/notes/note-10000k.png',
    description: 'High-value venture reserve note for major growth, scale stages, and syndicated investments.'
  },
  {
    id: 'note-2000k',
    value: 2000,
    label: '$2,000K',
    title: 'Two Million Dollars',
    color: '#76D7C4',
    bgGradient: 'from-teal-200 to-teal-400',
    image: '/notes/note-2000k.png',
    description: 'Mid-tier venture capital note used for retain stages and workforce expansion.'
  },
  {
    id: 'note-1000k',
    value: 1000,
    label: '$1,000K',
    title: 'One Million Dollars',
    color: '#85C1E9',
    bgGradient: 'from-sky-200 to-blue-400',
    image: '/notes/note-1000k.png',
    description: 'Standard institutional seed note for company launches and early operations.'
  },
  {
    id: 'note-500k',
    value: 500,
    label: '$500K',
    title: 'Five Hundred Thousand Dollars',
    color: '#5DADE2',
    bgGradient: 'from-blue-300 to-indigo-400',
    image: '/notes/note-500k.png',
    description: 'Foundation reserve note for startup bootstrapping and initial company investments.'
  },
  {
    id: 'note-100k',
    value: 100,
    label: '$100K',
    title: 'Hundred Thousand Dollars',
    color: '#9B59B6',
    bgGradient: 'from-purple-300 to-violet-500',
    image: '/notes/note-100k.png',
    description: 'Commercial operating note for workforce upgrades, PR services, and company maintenance.'
  },
  {
    id: 'note-50k',
    value: 50,
    label: '$50K',
    title: 'Fifty Thousand Dollars',
    color: '#BB8FCE',
    bgGradient: 'from-purple-200 to-pink-300',
    image: '/notes/note-50k.png',
    description: 'Standard cash note featured on the physical wallet for mid-round transactional expenses.'
  },
  {
    id: 'note-20k',
    value: 20,
    label: '$20K',
    title: 'Twenty Thousand Dollars',
    color: '#F1948A',
    bgGradient: 'from-rose-200 to-pink-400',
    image: '/notes/note-20k.png',
    description: 'Operational service note for buying mentor cards, minor retainers, and interest payments.'
  },
  {
    id: 'note-10k',
    value: 10,
    label: '$10K',
    title: 'Ten Thousand Dollars',
    color: '#E59866',
    bgGradient: 'from-orange-200 to-rose-300',
    image: '/notes/note-10k.png',
    description: 'Base denomination cash note featured on the physical wallet for bank loan interest and fee payments.'
  }
];

/**
 * Breaks down any cash amount (in $K) into available note denominations
 */
export function breakdownCashIntoNotes(cashAmount) {
  let remaining = Math.max(0, Math.round(cashAmount || 0));
  const result = [];

  // Sort descending by value
  const sorted = [...CURRENCY_NOTES].sort((a, b) => b.value - a.value);

  for (const note of sorted) {
    if (remaining >= note.value) {
      const count = Math.floor(remaining / note.value);
      result.push({ note, count });
      remaining %= note.value;
    }
  }

  // If there's a remainder smaller than lowest note but cash > 0, represent with 10K
  if (result.length === 0 && cashAmount > 0) {
    result.push({ note: sorted[sorted.length - 1], count: 1 });
  }

  return result;
}

/**
 * Returns the best matching note image for an amount
 */
export function getBestNoteForAmount(amount) {
  const absAmount = Math.abs(amount || 0);
  const sorted = [...CURRENCY_NOTES].sort((a, b) => b.value - a.value);
  for (const note of sorted) {
    if (absAmount >= note.value) return note;
  }
  return sorted[sorted.length - 1];
}
