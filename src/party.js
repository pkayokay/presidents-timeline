// Muted, period-appropriate accent colors per political party for the card ribbons.
const PARTY_COLORS = {
  Republican: '#8a2b2b',
  Democratic: '#2c4a6e',
  'Democratic-Republican': '#4a5d3a',
  Whig: '#8a6a2b',
  Federalist: '#5a4a6e',
  'National Union': '#6e5230',
  Unaffiliated: '#5c5346',
}

export function partyColor(party) {
  return PARTY_COLORS[party] || '#5c5346'
}

export function termLabel(p) {
  return p.termEnd ? `${p.termStart}–${p.termEnd}` : `${p.termStart}–present`
}
