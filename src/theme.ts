// Palette & semantic colors, mirrored from tailwind.config.js so the engine-fed
// charts (Recharts needs raw hex) and the Tailwind classes stay in sync.
import type { Dimension } from './engine'

export const COLORS = {
  navy: '#12233D',
  petrol: '#0E5A63',
  amber: '#D98A3D',
  danger: '#C2452F',
  positive: '#3E7C5A',
  inkSoft: '#51606F',
  surface1: '#F6F8F8',
  surface2: '#EDF1F2',
  track: '#E3E9EA',
}

/** A diverging score color: red (fragile) → amber → green (resilient). */
export function scoreColor(v: number): string {
  if (v >= 70) return COLORS.positive
  if (v >= 45) return COLORS.amber
  if (v >= 25) return '#D9683D'
  return COLORS.danger
}

export const DIMENSION_META: Record<Dimension, { label: string; short: string }> = {
  fx: { label: 'FX exposure', short: 'FX' },
  liquidity: { label: 'Liquidity buffer', short: 'Liquidity' },
  concentration: { label: 'Concentration', short: 'Concentration' },
  policy: { label: 'Policy & political', short: 'Policy' },
}

export const EFFORT_META = {
  low: { label: 'LOW', cls: 'bg-positive/10 text-positive' },
  medium: { label: 'MEDIUM', cls: 'bg-amber/15 text-amber' },
  high: { label: 'HIGH', cls: 'bg-danger/10 text-danger' },
} as const
