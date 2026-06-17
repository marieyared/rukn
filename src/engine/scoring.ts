// ─────────────────────────────────────────────────────────────────────────
// RUKN engine — scoring & impact (PURE)
// Sub-scores, overall Resilience Score, and per-scenario cash impact.
// Every figure returns a `trace` so the UI can show the formula with the real
// inputs plugged in. This auditability IS the product's credibility (deck §4).
// ─────────────────────────────────────────────────────────────────────────

import type {
  CompanyProfile,
  Dimension,
  PolicyFlag,
  Scenario,
  ScenarioImpact,
  ScoreResult,
  SubScores,
  TraceStep,
} from './types'
import {
  CONC_FLOOR,
  CONC_SPAN,
  COUNTRIES,
  FX_THRESHOLD,
  LIQ_SHOCK_MONTHS,
  LIQ_TARGET_MONTHS,
  POLICY_PENALTY,
  SCORE_BANDS,
  WEIGHTS,
} from './config'

export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
export const round = (x: number, dp = 0) => {
  const f = 10 ** dp
  return Math.round(x * f) / f
}

/** Active policy flags for a profile's operating countries (de-duplicated). */
export function activeFlags(profile: CompanyProfile): PolicyFlag[] {
  const set = new Set<PolicyFlag>()
  for (const code of profile.countries) {
    const c = COUNTRIES.find((x) => x.code === code)
    c?.flags.forEach((f) => set.add(f))
  }
  return [...set]
}

/**
 * Unmatched hard-currency exposure as a share of costs, after hedging.
 * The single most important number in the model.
 */
export function unmatchedShare(p: CompanyProfile): number {
  const gap = Math.max(0, p.costHardCcyPct - p.revenueHardCcyPct) / 100
  return gap * (1 - p.hedgeRatioPct / 100)
}

// ── Sub-scores ─────────────────────────────────────────────────────────────

export function fxScore(p: CompanyProfile): number {
  const u = unmatchedShare(p)
  return round(100 * (1 - clamp(u / FX_THRESHOLD, 0, 1)))
}

export function liquidityScore(p: CompanyProfile): number {
  return round(100 * clamp(p.liquidityBufferMonths / LIQ_TARGET_MONTHS, 0, 1))
}

export function concentrationScore(p: CompanyProfile): number {
  const conc = Math.max(p.topMarketPct, p.topSourcePct) / 100
  return round(100 * (1 - clamp((conc - CONC_FLOOR) / CONC_SPAN, 0, 1)))
}

export function policyScore(p: CompanyProfile): number {
  const penalty = activeFlags(p).reduce((sum, f) => sum + POLICY_PENALTY[f], 0)
  return round(clamp(100 - penalty, 0, 100))
}

export function subScores(p: CompanyProfile): SubScores {
  return {
    fx: fxScore(p),
    liquidity: liquidityScore(p),
    concentration: concentrationScore(p),
    policy: policyScore(p),
  }
}

function bandLabel(overall: number): string {
  return SCORE_BANDS.find((b) => overall >= b.min)?.label ?? 'Critically exposed'
}

/** Overall Resilience Score from sub-scores + weights. */
export function overallFromSub(sub: SubScores): number {
  const overall = (Object.keys(WEIGHTS) as Dimension[]).reduce(
    (acc, d) => acc + WEIGHTS[d] * sub[d],
    0,
  )
  return round(overall)
}

export function scoreProfile(p: CompanyProfile): ScoreResult {
  const sub = subScores(p)
  const overall = overallFromSub(sub)
  return { overall, sub, weights: WEIGHTS, label: bandLabel(overall) }
}

/**
 * Apply a set of sub-score upgrades (from completed/projected actions) and
 * recompute. Used both for live "tick a lever" recompute and for the ghost
 * "potential score" arc on the gauge.
 */
export function scoreWithUplift(base: SubScores, uplift: Partial<SubScores>): ScoreResult {
  const sub: SubScores = {
    fx: clamp(base.fx + (uplift.fx ?? 0), 0, 100),
    liquidity: clamp(base.liquidity + (uplift.liquidity ?? 0), 0, 100),
    concentration: clamp(base.concentration + (uplift.concentration ?? 0), 0, 100),
    policy: clamp(base.policy + (uplift.policy ?? 0), 0, 100),
  }
  const overall = overallFromSub(sub)
  return { overall, sub, weights: WEIGHTS, label: bandLabel(overall) }
}

// ── Scenario impact (€) ──────────────────────────────────────────────────────

/** Annual gross margin in € — the denominator the CFO cares about. */
export function annualMarginEur(p: CompanyProfile): number {
  return p.annualRevenue * (p.grossMarginPct / 100)
}

/** Hard-currency cost base in € (the part exposed to FX shocks). */
export function hardCostEur(p: CompanyProfile): number {
  const cogs = p.annualRevenue * (1 - p.grossMarginPct / 100)
  return cogs * (p.costHardCcyPct / 100)
}

/** Unmatched hard cost in € — exposure left after natural & financial hedges. */
export function unmatchedEur(p: CompanyProfile): number {
  return hardCostEur(p) * (1 - p.revenueHardCcyPct / 100) * (1 - p.hedgeRatioPct / 100)
}

/**
 * Quantify one scenario's hit to this company, in cash, with a full trace.
 * FX shocks bite the unmatched hard-cost base; policy/concentration shocks
 * bite the broader exposed base per their transmission mechanic.
 */
export function scenarioImpact(p: CompanyProfile, s: Scenario): ScenarioImpact {
  const margin = annualMarginEur(p)
  const trace: TraceStep[] = []
  let marginHit = 0
  let cashHit = 0

  if (s.category === 'fx') {
    const exposed = unmatchedEur(p)
    marginHit = exposed * s.shockMagnitude
    trace.push(
      {
        label: 'Hard-currency cost base',
        expr: `revenue ${eur(p.annualRevenue)} × (1 − margin ${p.grossMarginPct}%) × costHardCcy ${p.costHardCcyPct}%`,
        value: hardCostEur(p),
        unit: 'eur',
      },
      {
        label: 'Unmatched after natural + financial hedge',
        expr: `× (1 − revHardCcy ${p.revenueHardCcyPct}%) × (1 − hedge ${p.hedgeRatioPct}%)`,
        value: exposed,
        unit: 'eur',
      },
      {
        label: `Margin hit at −${pct(s.shockMagnitude)} shock`,
        expr: `unmatched ${eur(exposed)} × ${pct(s.shockMagnitude)}`,
        value: marginHit,
        unit: 'eur',
      },
    )
    // A dollar shortage is also a cash-timing event, not just a margin event.
    cashHit = s.hits.includes('liquidity') ? marginHit + exposed * 0.15 : marginHit
    if (s.hits.includes('liquidity')) {
      trace.push({
        label: 'Plus cash trapped while payments queue (~15% of exposure)',
        expr: `margin hit ${eur(marginHit)} + ${eur(exposed * 0.15)}`,
        value: cashHit,
        unit: 'eur',
      })
    }
  } else if (s.category === 'concentration') {
    // A corridor stoppage hits the share of throughput routed through the top
    // corridor; magnitude is the re-route cost / lost-throughput penalty.
    const exposedShare = p.topSourcePct / 100
    const cogs = p.annualRevenue * (1 - p.grossMarginPct / 100)
    const exposed = cogs * exposedShare
    marginHit = exposed * s.shockMagnitude
    cashHit = marginHit
    trace.push(
      {
        label: 'Cost routed through top corridor',
        expr: `COGS ${eur(cogs)} × topSource ${p.topSourcePct}%`,
        value: exposed,
        unit: 'eur',
      },
      {
        label: `Re-route / stoppage cost at ${pct(s.shockMagnitude)}`,
        expr: `${eur(exposed)} × ${pct(s.shockMagnitude)}`,
        value: marginHit,
        unit: 'eur',
      },
    )
  } else {
    // Policy shocks (tariff, subsidy cut, sanctions) step up the whole cost base.
    const cogs = p.annualRevenue * (1 - p.grossMarginPct / 100)
    marginHit = cogs * s.shockMagnitude
    cashHit = marginHit
    trace.push({
      label: `Cost-base step-up at ${pct(s.shockMagnitude)}`,
      expr: `COGS ${eur(cogs)} × ${pct(s.shockMagnitude)}`,
      value: marginHit,
      unit: 'eur',
    })
  }

  const pctOfMargin = margin > 0 ? clamp((marginHit / margin) * 100, 0, 999) : 0
  const expectedLoss = marginHit * s.probability

  trace.push({
    label: 'Share of annual gross margin',
    expr: `${eur(marginHit)} ÷ margin ${eur(margin)}`,
    value: round(pctOfMargin, 1),
    unit: 'pct',
  })

  return {
    scenario: s,
    marginHitEur: round(marginHit),
    cashHitEur: round(cashHit),
    pctOfAnnualMargin: round(pctOfMargin, 1),
    expectedLossEur: round(expectedLoss),
    trace,
  }
}

/** All scenarios, ranked by severity (probability-weighted loss, desc). */
export function rankedImpacts(p: CompanyProfile, scenarios: Scenario[]): ScenarioImpact[] {
  return scenarios
    .map((s) => scenarioImpact(p, s))
    .sort((a, b) => b.expectedLossEur - a.expectedLossEur)
}

// ── small formatting helpers used inside traces ──────────────────────────────
export function eur(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `€${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `€${Math.round(n / 1_000)}k`
  return `€${Math.round(n)}`
}
export function pct(frac: number): string {
  return `${round(frac * 100, frac * 100 < 10 ? 1 : 0)}%`
}

export { LIQ_SHOCK_MONTHS }
