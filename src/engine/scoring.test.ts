import { describe, it, expect } from 'vitest'
import type { CompanyProfile } from './types'
import {
  concentrationScore,
  fxScore,
  liquidityScore,
  overallFromSub,
  policyScore,
  rankedImpacts,
  scenarioImpact,
  scoreProfile,
  scoreWithUplift,
  subScores,
  unmatchedShare,
} from './scoring'
import { SCENARIOS } from './scenarios'
import { buildPlaybook, upliftFrom } from './playbook'

// The seed Egyptian importer (README §9) — the canonical demo story.
const egypt: CompanyProfile = {
  name: 'Demo importer (EG)',
  annualRevenue: 40_000_000,
  grossMarginPct: 22,
  revenueHardCcyPct: 5,
  costHardCcyPct: 70,
  hedgeRatioPct: 0,
  liquidityBufferMonths: 2.5,
  topMarketPct: 80,
  topSourcePct: 65,
  countries: ['EG'],
}

// A resilient counter-example to prove the scale behaves at the top end.
const resilient: CompanyProfile = {
  name: 'Resilient',
  annualRevenue: 40_000_000,
  grossMarginPct: 35,
  revenueHardCcyPct: 60,
  costHardCcyPct: 50,
  hedgeRatioPct: 80,
  liquidityBufferMonths: 8,
  topMarketPct: 25,
  topSourcePct: 25,
  countries: ['AE'],
}

describe('sub-scores: bounds', () => {
  it('every sub-score stays within 0..100 for both profiles', () => {
    for (const p of [egypt, resilient]) {
      const s = subScores(p)
      for (const v of Object.values(s)) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('FX score', () => {
  it('the Egyptian importer is highly FX-fragile (unmatched > threshold)', () => {
    // unmatched = (70-5)/100 * (1-0) = 0.65 > FX_THRESHOLD(0.5) -> score 0
    expect(unmatchedShare(egypt)).toBeCloseTo(0.65, 5)
    expect(fxScore(egypt)).toBe(0)
  })
  it('hedging lifts the FX score', () => {
    expect(fxScore({ ...egypt, hedgeRatioPct: 100 })).toBe(100)
  })
  it('the resilient firm scores well on FX', () => {
    expect(fxScore(resilient)).toBeGreaterThan(80)
  })
})

describe('liquidity score', () => {
  it('2.5 of 6 months -> ~42', () => {
    expect(liquidityScore(egypt)).toBe(42)
  })
  it('caps at 100 above target', () => {
    expect(liquidityScore({ ...egypt, liquidityBufferMonths: 12 })).toBe(100)
  })
})

describe('concentration score', () => {
  it('80% top market -> below floor band, low score', () => {
    // conc = max(80,65)/100 = 0.8 -> (0.8-0.3)/0.6 = 0.833 -> ~17
    expect(concentrationScore(egypt)).toBe(17)
  })
  it('25% concentration -> fully resilient', () => {
    expect(concentrationScore(resilient)).toBe(100)
  })
})

describe('policy score', () => {
  it('Egypt activates capital controls + subsidy + licensing penalties', () => {
    // 100 - (25 + 15 + 18) = 42
    expect(policyScore(egypt)).toBe(42)
  })
  it('UAE has no flags -> 100', () => {
    expect(policyScore(resilient)).toBe(100)
  })
})

describe('overall score', () => {
  it('Egyptian importer lands in the fragile/critical range', () => {
    const r = scoreProfile(egypt)
    expect(r.overall).toBeLessThan(45)
    expect(r.overall).toBeGreaterThan(0)
  })
  it('weights sum to 1', () => {
    const total = Object.values(scoreProfile(egypt).weights).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 9)
  })
  it('resilient firm clearly beats the fragile one', () => {
    expect(scoreProfile(resilient).overall).toBeGreaterThan(scoreProfile(egypt).overall + 30)
  })
})

describe('scenario impact (€)', () => {
  it('devaluation hits a painful share of the Egyptian importer’s margin', () => {
    const dev = SCENARIOS.find((s) => s.id === 'devaluation')!
    const i = scenarioImpact(egypt, dev)
    // unmatchedEur = COGS(31.2M) * costHard 70% (=21.84M) * (1-5%) * (1-0%) = 20.748M
    // marginHit = 20.748M * 0.30 = ~6.22M ; margin = 8.8M -> ~70% of margin
    expect(i.marginHitEur).toBeGreaterThan(5_000_000)
    expect(i.pctOfAnnualMargin).toBeGreaterThan(50)
    expect(i.trace.length).toBeGreaterThanOrEqual(3)
  })
  it('a fully hedged firm takes no FX margin hit', () => {
    const dev = SCENARIOS.find((s) => s.id === 'devaluation')!
    const i = scenarioImpact({ ...egypt, hedgeRatioPct: 100 }, dev)
    expect(i.marginHitEur).toBe(0)
  })
  it('ranking is by expected (probability-weighted) loss, descending', () => {
    const ranked = rankedImpacts(egypt, SCENARIOS)
    for (let k = 1; k < ranked.length; k++) {
      expect(ranked[k - 1].expectedLossEur).toBeGreaterThanOrEqual(ranked[k].expectedLossEur)
    }
  })
})

describe('playbook', () => {
  it('produces FX-first levers for the Egyptian importer', () => {
    const pb = buildPlaybook(egypt)
    expect(pb.length).toBeGreaterThanOrEqual(4)
    // top lever should improve FX (the biggest exposure) and carry real €
    expect(pb.some((a) => a.improves === 'fx')).toBe(true)
    expect(pb[0].annualImpactEur).toBeGreaterThan(0)
  })
  it('completing actions lifts the overall score (the retention loop)', () => {
    const base = subScores(egypt)
    const pb = buildPlaybook(egypt)
    const allDone = new Set(pb.map((a) => a.id))
    const projected = scoreWithUplift(base, upliftFrom(pb, allDone))
    expect(projected.overall).toBeGreaterThan(overallFromSub(base))
  })
  it('every lever is traceable and non-empty', () => {
    for (const a of buildPlaybook(egypt)) {
      expect(a.trace.length).toBeGreaterThan(0)
      expect(a.label.length).toBeGreaterThan(0)
    }
  })
})
