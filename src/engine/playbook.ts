// ─────────────────────────────────────────────────────────────────────────
// RUKN engine — mitigation playbook (PURE)
// Generates a prioritised set of levers from the profile. The "painkiller".
//
// Discipline (README §6): INFORMATION, not advice. Levers are framed as moves
// "companies in this situation often consider" — never "you must buy product X".
// Every € figure is modelled from the profile and carries a trace.
// ─────────────────────────────────────────────────────────────────────────

import type { Action, CompanyProfile, TraceStep } from './types'
import { LIQ_TARGET_MONTHS } from './config'
import {
  annualMarginEur,
  eur,
  hardCostEur,
  pct,
  round,
  unmatchedEur,
  unmatchedShare,
} from './scoring'

/** Build the prioritised playbook for a profile. Sorted by impact-per-effort. */
export function buildPlaybook(p: CompanyProfile): Action[] {
  const actions: Action[] = []
  const unmatched = unmatchedEur(p)
  const margin = annualMarginEur(p)

  // ── FX levers — only meaningful when there's unmatched exposure ──
  if (unmatchedShare(p) > 0.05) {
    // 1. Shift a slice of hard-ccy procurement to a currency matched to revenue.
    const shiftShare = 0.3
    const fxGain = unmatched * shiftShare * 0.3 // avoided margin hit on a 30% move
    actions.push(
      lever({
        id: 'fx-resource',
        label: 'Shift ~30% of hard-currency procurement to a revenue-matched currency',
        detail:
          'Companies in this position often re-source part of their input bill into a currency closer to where they bill, shrinking the unmatched gap a devaluation acts on.',
        improves: 'fx',
        scoreUplift: 14,
        annualImpactEur: fxGain,
        effort: 'medium',
        trace: [
          step('Unmatched hard-cost exposure', `from your profile`, unmatched),
          step('Re-sourced share', `× ${pct(shiftShare)}`, unmatched * shiftShare),
          step('Avoided margin hit on a −30% move', `× 30%`, fxGain),
        ],
      }),
    )

    // 2. Index long contracts to a hard-currency reference (pricing power).
    if (p.revenueHardCcyPct < 50) {
      const indexShare = 0.4
      const idxGain = unmatched * indexShare * 0.3
      actions.push(
        lever({
          id: 'fx-index',
          label: `Index ~40% of customer contracts to a hard-currency reference`,
          detail:
            'Where buyers accept it, indexing long orders to a USD/EUR reference passes part of the FX move through, protecting margin on the order book.',
          improves: 'fx',
          scoreUplift: 10,
          annualImpactEur: idxGain,
          effort: 'medium',
          trace: [
            step('Unmatched hard-cost exposure', `from your profile`, unmatched),
            step('Contract share indexed', `× ${pct(indexShare)}`, unmatched * indexShare),
            step('Margin protected on a −30% move', `× 30%`, idxGain),
          ],
        }),
      )
    }

    // 3. Put a basic hedge / forward cover on where instruments exist.
    if (p.hedgeRatioPct < 30) {
      const coverShare = 0.25
      const hedgeGain = hardCostEur(p) * coverShare * 0.3
      actions.push(
        lever({
          id: 'fx-hedge',
          label: 'Pre-arrange forward cover on ~25% of the import bill where available',
          detail:
            'Even thin frontier-FX markets allow partial forward cover or supplier-side terms; locking a slice caps the worst-case re-pricing.',
          improves: 'fx',
          scoreUplift: 8,
          annualImpactEur: hedgeGain,
          effort: 'high',
          trace: [
            step('Hard-currency cost base', `from your profile`, hardCostEur(p)),
            step('Share covered', `× ${pct(coverShare)}`, hardCostEur(p) * coverShare),
            step('Worst-case re-pricing capped (−30%)', `× 30%`, hedgeGain),
          ],
        }),
      )
    }
  }

  // ── Liquidity lever — when buffer is below target ──
  if (p.liquidityBufferMonths < LIQ_TARGET_MONTHS) {
    const opexMonthly = (p.annualRevenue * (1 - p.grossMarginPct / 100)) / 12
    const gapMonths = Math.min(3, LIQ_TARGET_MONTHS - p.liquidityBufferMonths)
    const standby = opexMonthly * gapMonths
    actions.push(
      lever({
        id: 'liq-standby',
        label: 'Pre-negotiate a stand-by credit line for a 90-day shock',
        detail:
          'A committed line arranged before stress — not during it — converts a cash-timing shock into a manageable cost, and is cheapest to secure while healthy.',
        improves: 'liquidity',
        scoreUplift: Math.round((gapMonths / LIQ_TARGET_MONTHS) * 100),
        annualImpactEur: standby,
        effort: 'low',
        trace: [
          step('Monthly OPEX', `revenue × (1 − margin) ÷ 12`, opexMonthly),
          step('Buffer gap to cover', `${gapMonths.toFixed(1)} months`, gapMonths, 'x'),
          step('Stand-by headroom secured', `OPEX/mo × ${gapMonths.toFixed(1)}`, standby),
        ],
      }),
    )
  }

  // ── Concentration levers — sourcing & geographic ──
  if (p.topSourcePct > 50) {
    const cogs = p.annualRevenue * (1 - p.grossMarginPct / 100)
    const exposed = cogs * (p.topSourcePct / 100)
    const gain = exposed * 0.15
    actions.push(
      lever({
        id: 'conc-route',
        label: 'Qualify a second sourcing route bypassing the top corridor',
        detail:
          'A pre-qualified alternate corridor removes single-route stoppage risk (Red Sea / Suez, a single port) without waiting for the disruption to force it.',
        improves: 'concentration',
        scoreUplift: 12,
        annualImpactEur: gain,
        effort: 'medium',
        trace: [
          step('Cost through top corridor', `COGS × topSource ${p.topSourcePct}%`, exposed),
          step('Stoppage cost removed', `× 15%`, gain),
        ],
      }),
    )
  }
  if (p.topMarketPct > 55) {
    const gain = margin * 0.08
    actions.push(
      lever({
        id: 'conc-market',
        label: 'Open a second geographic market to dilute demand concentration',
        detail:
          'Adding a second market reduces dependence on one economy’s FX and demand cycle — slower to build, but structurally de-risking.',
        improves: 'concentration',
        scoreUplift: 8,
        annualImpactEur: gain,
        effort: 'high',
        trace: [
          step('Annual gross margin', `from your profile`, margin),
          step('Demand-shock buffer from diversification', `× 8%`, gain),
        ],
      }),
    )
  }

  // ── Policy lever — when country flags are active ──
  const cogs = p.annualRevenue * (1 - p.grossMarginPct / 100)
  const buffer = cogs * 0.05
  actions.push(
    lever({
      id: 'policy-buffer',
      label: 'Hold a strategic inventory / licence buffer against policy whiplash',
      detail:
        'A modest pre-positioned inventory and an FX-allocation/licence cushion absorb the first weeks of a tariff, subsidy cut or import freeze while you adjust.',
      improves: 'policy',
      scoreUplift: 6,
      annualImpactEur: buffer,
      effort: 'low',
      trace: [
        step('Annual cost base', `revenue × (1 − margin)`, cogs),
        step('Shock absorbed in first weeks', `× 5%`, buffer),
      ],
    }),
  )

  // Prioritise by impact-per-effort (the deck's "ranked by impact-per-effort").
  const effortWeight = { low: 1, medium: 1.6, high: 2.6 }
  return actions.sort(
    (a, b) =>
      b.annualImpactEur / effortWeight[b.effort] - a.annualImpactEur / effortWeight[a.effort],
  )
}

/** Sum of sub-score uplift from a set of selected (done) action ids. */
export function upliftFrom(actions: Action[], doneIds: Set<string>) {
  const up: Record<string, number> = { fx: 0, liquidity: 0, concentration: 0, policy: 0 }
  for (const a of actions) if (doneIds.has(a.id)) up[a.improves] += a.scoreUplift
  return up as { fx: number; liquidity: number; concentration: number; policy: number }
}

// ── helpers ──
function step(label: string, expr: string, value: number, unit: TraceStep['unit'] = 'eur'): TraceStep {
  return { label, expr, value: unit === 'eur' ? round(value) : value, unit }
}

function lever(a: Omit<Action, 'done' | 'annualImpactEur'> & { annualImpactEur: number }): Action {
  return { ...a, annualImpactEur: round(a.annualImpactEur), done: false }
}

export { eur }
