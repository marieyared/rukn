import type { Dimension, SubScores as Sub } from '../engine'
import { DIMENSION_META, scoreColor } from '../theme'

const ORDER: Dimension[] = ['fx', 'liquidity', 'concentration', 'policy']

/** The four sub-scores, with a baseline ghost marker so movement is visible. */
export function SubScores({ sub, baseline }: { sub: Sub; baseline: Sub }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ORDER.map((d) => {
        const v = sub[d]
        const base = baseline[d]
        const color = scoreColor(v)
        const improved = v > base + 0.5
        return (
          <div
            key={d}
            className="rounded-xl bg-surface-1 p-3.5 ring-1 ring-ink/5"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-medium text-ink-soft">
                {DIMENSION_META[d].label}
              </span>
              <span className="tnum text-xl font-display font-semibold" style={{ color }}>
                {Math.round(v)}
              </span>
            </div>
            <div className="relative mt-2 h-1.5 rounded-full bg-ink/10 overflow-visible">
              {/* baseline tick */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-ink/25"
                style={{ left: `${base}%` }}
                title={`Baseline ${Math.round(base)}`}
              />
              <div
                className="h-full rounded-full"
                style={{
                  width: `${v}%`,
                  background: color,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1), background 0.4s',
                }}
              />
            </div>
            {improved && (
              <div className="mt-1.5 text-[10.5px] font-semibold text-positive">
                ▲ +{Math.round(v - base)} from your actions
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
