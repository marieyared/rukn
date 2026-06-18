// ─────────────────────────────────────────────────────────────────────────
// RUKN engine — curated scenario library (v1)
// MENA-native shocks. FX/policy lead; supply-chain is deliberately ONE of six
// (README §5). Each carries an indicative annual probability and a transmission
// note — the "scenario library" engine from the deck.
// ─────────────────────────────────────────────────────────────────────────

import type { Scenario } from './types'

export const SCENARIOS: Scenario[] = [
  {
    id: 'devaluation',
    label: 'Your local currency drops 30%',
    category: 'fx',
    hits: ['fx'],
    probability: 0.45,
    shockMagnitude: 0.3,
    note: 'You earn in local currency but pay suppliers in dollars — overnight, your import bill jumps.',
  },
  {
    id: 'dollar-shortage',
    label: 'Dollars get scarce and imports stall',
    category: 'fx',
    hits: ['fx', 'liquidity'],
    probability: 0.35,
    shockMagnitude: 0.2,
    note: 'Banks ration dollars and payments queue up — it hits both your margin and your cash at once.',
  },
  {
    id: 'import-tax',
    label: 'A new import tax or restriction lands',
    category: 'policy',
    hits: ['policy'],
    probability: 0.3,
    shockMagnitude: 0.12,
    note: 'A tariff or quota arrives fast and pushes up the cost of everything you bring in.',
  },
  {
    id: 'subsidy-cut',
    label: 'A fuel / energy subsidy gets cut',
    category: 'policy',
    hits: ['policy'],
    probability: 0.4,
    shockMagnitude: 0.08,
    note: 'Energy and transport cost more — and it raises your costs across the board.',
  },
  {
    id: 'corridor',
    label: 'Your shipping route gets blocked',
    category: 'concentration',
    hits: ['concentration'],
    probability: 0.3,
    shockMagnitude: 0.15,
    note: 'One route, one port (think Red Sea / Suez). A detour costs time and money; a closure halts you.',
  },
  {
    id: 'sanctions',
    label: 'A sanctions hit cuts off a key partner',
    category: 'policy',
    hits: ['policy'],
    probability: 0.15,
    shockMagnitude: 0.18,
    note: 'A bank or supplier caught by sanctions severs a payment or supply line you depend on.',
  },
]
