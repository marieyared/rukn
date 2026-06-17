/** UI-facing formatting (the engine has its own compact eur() for traces). */

export function fmtEur(n: number, opts: { compact?: boolean } = {}): string {
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(n)
  if (opts.compact) {
    if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`
    if (abs >= 1_000) return `${sign}€${Math.round(abs / 1_000)}k`
    return `${sign}€${Math.round(abs)}`
  }
  return `${sign}€${Math.round(abs).toLocaleString('en-US')}`
}

export function fmtPct(n: number, dp = 0): string {
  return `${n.toFixed(dp)}%`
}

export function traceValue(v: number, unit?: 'eur' | 'pct' | 'x'): string {
  if (unit === 'pct') return `${v}%`
  if (unit === 'x') return `${v}`
  return fmtEur(v, { compact: true })
}
