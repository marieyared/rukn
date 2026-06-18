// Standalone engine verification, runnable via vite-node (single process — no
// vitest worker pool, which this sandbox blocks). Mirrors scoring.test.ts.
import assert from 'node:assert/strict'
import type { CompanyProfile } from '../src/engine'
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
  SCENARIOS,
  buildPlaybook,
  upliftFrom,
} from '../src/engine'

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

let passed = 0
const t = (name: string, fn: () => void) => {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${(e as Error).message}`)
    process.exitCode = 1
  }
}

console.log('sub-scores: bounds')
t('all sub-scores within 0..100', () => {
  for (const p of [egypt, resilient])
    for (const v of Object.values(subScores(p))) {
      assert.ok(v >= 0 && v <= 100, `got ${v}`)
    }
})

console.log('FX score')
t('Egyptian importer FX-fragile (unmatched 0.65 > threshold)', () => {
  assert.ok(Math.abs(unmatchedShare(egypt) - 0.65) < 1e-9)
  assert.equal(fxScore(egypt), 0)
})
t('full hedge -> 100', () => assert.equal(fxScore({ ...egypt, hedgeRatioPct: 100 }), 100))
t('resilient firm FX > 80', () => assert.ok(fxScore(resilient) > 80))

console.log('liquidity / concentration / policy')
t('2.5 of 6 months -> 42', () => assert.equal(liquidityScore(egypt), 42))
t('80% concentration -> 17', () => assert.equal(concentrationScore(egypt), 17))
t('Egypt policy (intensity-weighted) -> 53', () => assert.equal(policyScore(egypt), 53))
t('UAE policy -> 100', () => assert.equal(policyScore(resilient), 100))
t('Lebanon worse than Tunisia on policy (calibration fix)', () => {
  const lb = policyScore({ ...egypt, countries: ['LB'] })
  const tn = policyScore({ ...egypt, countries: ['TN'] })
  assert.ok(lb < tn, `expected LB(${lb}) < TN(${tn})`)
  assert.ok(tn > 60, `Tunisia should be milder now, got ${tn}`)
})

console.log('overall')
t('Egyptian importer < 45 and > 0', () => {
  const o = scoreProfile(egypt).overall
  assert.ok(o < 45 && o > 0, `got ${o}`)
})
t('weights sum to 1', () => {
  const s = Object.values(scoreProfile(egypt).weights).reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(s - 1) < 1e-9)
})
t('resilient beats fragile by 30+', () =>
  assert.ok(scoreProfile(resilient).overall > scoreProfile(egypt).overall + 30))

console.log('scenario impact')
t('devaluation hits > €5M and > 50% of margin', () => {
  const dev = SCENARIOS.find((s) => s.id === 'devaluation')!
  const i = scenarioImpact(egypt, dev)
  assert.ok(i.marginHitEur > 5_000_000, `got ${i.marginHitEur}`)
  assert.ok(i.pctOfAnnualMargin > 50, `got ${i.pctOfAnnualMargin}`)
  assert.ok(i.trace.length >= 3)
})
t('fully hedged -> no FX hit', () => {
  const dev = SCENARIOS.find((s) => s.id === 'devaluation')!
  assert.equal(scenarioImpact({ ...egypt, hedgeRatioPct: 100 }, dev).marginHitEur, 0)
})
t('ranking is by expected loss desc', () => {
  const r = rankedImpacts(egypt, SCENARIOS)
  for (let k = 1; k < r.length; k++)
    assert.ok(r[k - 1].expectedLossEur >= r[k].expectedLossEur)
})

console.log('playbook')
t('FX-first levers, >= 4, top has € impact', () => {
  const pb = buildPlaybook(egypt)
  assert.ok(pb.length >= 4, `got ${pb.length}`)
  assert.ok(pb.some((a) => a.improves === 'fx'))
  assert.ok(pb[0].annualImpactEur > 0)
})
t('completing all actions lifts overall', () => {
  const base = subScores(egypt)
  const pb = buildPlaybook(egypt)
  const projected = scoreWithUplift(base, upliftFrom(pb, new Set(pb.map((a) => a.id))))
  assert.ok(projected.overall > overallFromSub(base))
})
t('every lever traceable', () => {
  for (const a of buildPlaybook(egypt)) {
    assert.ok(a.trace.length > 0)
    assert.ok(a.label.length > 0)
  }
})

console.log(`\n${passed} checks passed${process.exitCode ? ' (with failures)' : ''}`)
