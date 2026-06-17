import type { CompanyProfile } from '../engine'

/**
 * Demo profile (README §9): a mid-market Egyptian importer/distributor.
 * Designed to tell the deck's story on first load — poor FX & liquidity scores,
 * a painful devaluation / dollar-shortage impact in cash, and a playbook whose
 * top two levers are high-impact.
 */
export const SEED_PROFILE: CompanyProfile = {
  name: 'Nile Trading & Distribution',
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

export const STORAGE_KEY = 'rukn.profile.v1'
export const STORAGE_DONE_KEY = 'rukn.actionsDone.v1'
