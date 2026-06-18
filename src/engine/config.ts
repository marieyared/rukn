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

/**
 * Country reference data. Each flag carries an intensity (0–1) for how acute it
 * is in that country today — so the policy sub-score reflects real severity, not
 * a flat "has the flag / doesn't". This is the curated regional read; it is a
 * hand-set judgement (reviewed dates below) and is meant to be revised, not a
 * live feed. Resulting policy sub-scores: LB 45 · EG 53 · IQ 67 · TN 68 ·
 * MA 81 · JO 93 · SA/AE 100 — Lebanon correctly the most acute, Tunisia milder.
 */
export const COUNTRIES: Country[] = [
  {
    code: 'EG',
    name: 'Egypt',
    reviewed: '2026-06',
    flags: [
      { flag: 'capitalControls', intensity: 0.85 }, // FX rationing eased but real
      { flag: 'subsidyExposed', intensity: 0.9 }, // IMF-driven fuel/energy cuts ongoing
      { flag: 'importLicensing', intensity: 0.7 },
    ],
  },
  {
    code: 'LB',
    name: 'Lebanon',
    reviewed: '2026-06',
    flags: [
      { flag: 'capitalControls', intensity: 1.0 }, // informal but absolute since 2019
      { flag: 'importLicensing', intensity: 0.75 }, // FX scarcity throttles imports
      { flag: 'sanctionsAdjacency', intensity: 0.6 },
      { flag: 'subsidyExposed', intensity: 0.3 }, // most subsidies already gone
    ],
  },
  { code: 'SA', name: 'Saudi Arabia', reviewed: '2026-06', flags: [] },
  { code: 'AE', name: 'UAE', reviewed: '2026-06', flags: [] },
  {
    code: 'MA',
    name: 'Morocco',
    reviewed: '2026-06',
    flags: [
      { flag: 'subsidyExposed', intensity: 0.7 },
      { flag: 'importLicensing', intensity: 0.5 },
    ],
  },
  {
    code: 'TN',
    name: 'Tunisia',
    reviewed: '2026-06',
    flags: [
      { flag: 'capitalControls', intensity: 0.55 }, // dinar managed, not collapsed
      { flag: 'subsidyExposed', intensity: 0.65 }, // IMF pressure, slower pace
      { flag: 'importLicensing', intensity: 0.5 },
    ],
  },
  {
    code: 'JO',
    name: 'Jordan',
    reviewed: '2026-06',
    flags: [{ flag: 'subsidyExposed', intensity: 0.5 }],
  },
  {
    code: 'IQ',
    name: 'Iraq',
    reviewed: '2026-06',
    flags: [
      { flag: 'sanctionsAdjacency', intensity: 0.85 },
      { flag: 'capitalControls', intensity: 0.65 }, // USD access via auctions constrained
    ],
  },
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
