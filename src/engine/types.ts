// ─────────────────────────────────────────────────────────────────────────
// RUKN engine — domain types
// Framework-agnostic. No React, no UI imports. Portable to a Python backend.
// ─────────────────────────────────────────────────────────────────────────

/** The four exposure dimensions, in order of weight (README §2). */
export type Dimension = 'fx' | 'liquidity' | 'concentration' | 'policy'

/** A country flag that drives policy-risk penalties. */
export type PolicyFlag =
  | 'capitalControls' // FX allocation / repatriation restrictions
  | 'subsidyExposed' // fuel/energy subsidy that can be cut
  | 'sanctionsAdjacency' // counterparties near sanctioned entities
  | 'importLicensing' // import permits / quotas that can freeze trade

export type CountryCode = 'EG' | 'LB' | 'SA' | 'AE' | 'MA' | 'TN' | 'JO' | 'IQ'

/**
 * A policy flag as it applies to a specific country, with an intensity 0–1
 * reflecting how acute that risk is *there, right now*. This is where the
 * curated regional read lives — Lebanon's capital controls (≈1.0) bite far
 * harder than Tunisia's managed convertibility (≈0.55), even though both
 * carry the same flag. Editable by hand; the basis of the "current conditions".
 */
export type CountryFlagWeight = {
  flag: PolicyFlag
  intensity: number // 0..1
}

export type Country = {
  code: CountryCode
  name: string
  flags: CountryFlagWeight[]
  /** When these intensities were last reviewed (ISO date). Honesty over hype. */
  reviewed: string
}

/** The company exposure profile the user describes (README §4). */
export type CompanyProfile = {
  name: string
  annualRevenue: number // base currency (€)
  grossMarginPct: number // 0–100
  revenueHardCcyPct: number // % of revenue billed in hard currency
  costHardCcyPct: number // % of costs paid in hard currency (USD/EUR)
  hedgeRatioPct: number // 0–100 — share of FX exposure hedged
  liquidityBufferMonths: number // months of OPEX covered by cash + committed lines
  topMarketPct: number // geographic concentration (0–100)
  topSourcePct: number // sourcing/corridor concentration (0–100)
  countries: CountryCode[] // activates policy flags
}

/** A curated regional shock (README §5 library). */
export type Scenario = {
  id: string
  label: string
  category: Dimension
  hits: Dimension[]
  probability: number // 0–1, indicative annual range
  shockMagnitude: number // e.g. 0.30 for a -30% move
  note: string // one-line transmission mechanic (deck: "transmission mechanics")
}

/** A single auditable step in a calculation — the transparency moat. */
export type TraceStep = {
  label: string
  expr: string // human-readable formula with the real numbers plugged in
  value: number // resulting € value (or unitless where noted)
  unit?: 'eur' | 'pct' | 'x'
}

/** Quantified impact of one scenario on this company. */
export type ScenarioImpact = {
  scenario: Scenario
  marginHitEur: number // € hit to annual margin
  cashHitEur: number // € hit to 90-day cash
  pctOfAnnualMargin: number // 0–100, the figure that speaks to a CFO
  expectedLossEur: number // probability-weighted, for severity ranking
  trace: TraceStep[]
}

/** A mitigation lever (README §4 Action). */
export type Action = {
  id: string
  label: string
  detail: string // what the move is, in neutral/informative language
  improves: Dimension
  scoreUplift: number // sub-score points if applied
  annualImpactEur: number // modelled € gain
  effort: 'low' | 'medium' | 'high'
  done: boolean
  trace: TraceStep[]
}

export type SubScores = Record<Dimension, number>

export type ScoreResult = {
  overall: number // 0–100
  sub: SubScores
  weights: Record<Dimension, number>
  label: string // qualitative band, e.g. "Moderate resilience"
}
