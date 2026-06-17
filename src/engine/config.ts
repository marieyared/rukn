// ─────────────────────────────────────────────────────────────────────────
// RUKN engine — configuration
// Every constant the scoring depends on lives here, commented and editable.
// This file is, deliberately, the whole "secret sauce" laid bare — the deck's
// argument is that a CFO can audit the number. No black box.
// ─────────────────────────────────────────────────────────────────────────

import type { Dimension, PolicyFlag, Country } from './types'

/** Weights of each sub-score in the overall Resilience Score (sum = 1). */
export const WEIGHTS: Record<Dimension, number> = {
  fx: 0.4, // FX is the core of MENA mid-market pain (deck)
  liquidity: 0.25, // can you survive a 90-day shock
  concentration: 0.2, // one market / one corridor fragility
  policy: 0.15, // capital controls, subsidies, sanctions, licensing
}

/**
 * FX: the share of costs that is unmatched hard-currency exposure at which the
 * FX sub-score bottoms out at 0. 0.5 = if half your cost base is unhedged,
 * unmatched hard-currency exposure, you are maximally fragile on FX.
 */
export const FX_THRESHOLD = 0.5

/** Liquidity target: months of OPEX buffer considered fully resilient. */
export const LIQ_TARGET_MONTHS = 6

/** A 90-day shock needs ~3 months of buffer to absorb without distress. */
export const LIQ_SHOCK_MONTHS = 3

/** Concentration: below this share, concentration is not penalised. */
export const CONC_FLOOR = 0.3 // 30% of revenue/sourcing in one place is fine
/** At/above floor + span, concentration sub-score hits 0. */
export const CONC_SPAN = 0.6 // so 90%+ is critical

/** Policy penalties — points removed from a 100 base per active flag. */
export const POLICY_PENALTY: Record<PolicyFlag, number> = {
  capitalControls: 25,
  sanctionsAdjacency: 20,
  subsidyExposed: 15,
  importLicensing: 18,
}

/** Country reference data — which flags each operating country activates. */
export const COUNTRIES: Country[] = [
  { code: 'EG', name: 'Egypt', flags: ['capitalControls', 'subsidyExposed', 'importLicensing'] },
  { code: 'LB', name: 'Lebanon', flags: ['capitalControls'] },
  { code: 'SA', name: 'Saudi Arabia', flags: [] },
  { code: 'AE', name: 'UAE', flags: [] },
  { code: 'MA', name: 'Morocco', flags: ['subsidyExposed', 'importLicensing'] },
  { code: 'TN', name: 'Tunisia', flags: ['capitalControls', 'subsidyExposed', 'importLicensing'] },
  { code: 'JO', name: 'Jordan', flags: ['subsidyExposed'] },
  { code: 'IQ', name: 'Iraq', flags: ['sanctionsAdjacency', 'capitalControls'] },
]

/** Human-readable labels for policy flags (used in UI + methodology). */
export const POLICY_FLAG_LABELS: Record<PolicyFlag, string> = {
  capitalControls: 'Capital controls / FX allocation',
  subsidyExposed: 'Subsidy exposure',
  sanctionsAdjacency: 'Sanctions adjacency',
  importLicensing: 'Import licensing / quotas',
}

/** Qualitative bands for the overall score (README: libellé qualitatif). */
export const SCORE_BANDS: { min: number; label: string }[] = [
  { min: 80, label: 'Strong resilience' },
  { min: 60, label: 'Solid resilience' },
  { min: 45, label: 'Moderate resilience' },
  { min: 30, label: 'Fragile' },
  { min: 0, label: 'Critically exposed' },
]
