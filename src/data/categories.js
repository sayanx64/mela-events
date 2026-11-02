/**
 * Event categories. Each one is colour-coded like a roll of raffle tickets,
 * so a category reads the same on cards, filters, tickets and the stub.
 * Text on these colours is always the ink colour, which passes WCAG AA on all of them.
 */
export const CATEGORIES = [
  { id: 'music', label: 'Music', color: '#FF6B5B', blurb: 'Gigs, bands and long nights' },
  { id: 'tech', label: 'Tech', color: '#5CC8F2', blurb: 'Hackathons, meetups and talks' },
  { id: 'art', label: 'Art & Design', color: '#FFD447', blurb: 'Exhibitions, studios and walks' },
  { id: 'food', label: 'Food & Drink', color: '#FFA03A', blurb: 'Food walks and tastings' },
  { id: 'comedy', label: 'Comedy', color: '#FF92C8', blurb: 'Stand-up and open mics' },
  { id: 'workshops', label: 'Workshops', color: '#B6A4FF', blurb: 'Make something with your hands' },
  { id: 'sport', label: 'Sport & Fitness', color: '#59D88F', blurb: 'Runs, climbs and yoga' },
  { id: 'film', label: 'Film', color: '#E3C38F', blurb: 'Screenings and retrospectives' },
]

const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id) {
  return byId[id] ?? null
}

export const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Goa']
