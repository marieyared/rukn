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
    label: 'Local-currency devaluation (−30%)',
    category: 'fx',
    hits: ['fx'],
    probability: 0.45,
    shockMagnitude: 0.3,
    note: 'Soft revenue, hard costs: a step devaluation re-prices your import bill overnight.',
  },
  {
    id: 'dollar-shortage',
    label: 'Dollar shortage / FX rationing (imports stall)',
    category: 'fx',
    hits: ['fx', 'liquidity'],
    probability: 0.35,
    shockMagnitude: 0.2,
    note: 'Banks ration USD; payments queue. A margin hit and a cash-timing hit at once.',
  },
  {
    id: 'import-tax',
    label: 'New import tariff or restriction',
    category: 'policy',
    hits: ['policy'],
    probability: 0.3,
    shockMagnitude: 0.12,
    note: 'A tariff or quota lands fast and is felt immediately on landed cost.',
  },
  {
    id: 'subsidy-cut',
    label: 'Energy / fuel subsidy withdrawal',
    category: 'policy',
    hits: ['policy'],
    probability: 0.4,
    shockMagnitude: 0.08,
    note: 'Input and logistics costs step up across the whole cost base.',
  },
  {
    id: 'corridor',
    label: 'Trade-corridor disruption (Red Sea / Suez, port closure)',
    category: 'concentration',
    hits: ['concentration'],
    probability: 0.3,
    shockMagnitude: 0.15,
    note: 'One route, one port. A re-route adds cost and time; a closure stops the business.',
  },
  {
    id: 'sanctions',
    label: 'Sanctions exposure / counterparty cut-off',
    category: 'policy',
    hits: ['policy'],
    probability: 0.15,
    shockMagnitude: 0.18,
    note: 'A sanctioned counterparty or bank severs a payment or supply relationship.',
  },
]
