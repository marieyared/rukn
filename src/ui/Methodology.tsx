import {
  WEIGHTS,
  FX_THRESHOLD,
  LIQ_TARGET_MONTHS,
  CONC_FLOOR,
  CONC_SPAN,
  POLICY_PENALTY,
  POLICY_FLAG_LABELS,
  type PolicyFlag,
} from '../engine'
import { DIMENSION_META, scoreColor } from '../theme'

/**
 * Screen 3 — the open methodology. Transparency is a sales argument (deck §4,
 * §12): a CFO can audit every weight and formula. No black box.
 */
export function Methodology({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-8 animate-fadeup">
      <div className="bg-white rounded-2xl shadow-lift max-w-3xl w-full my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy">Methodology</h2>
            <p className="text-[12px] text-ink-soft">
              Every weight and formula, in the open. A CFO can audit the number.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-surface-2 text-ink-soft hover:bg-surface-1"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <section>
            <H>Overall Resilience Score</H>
            <p className="text-[13px] text-ink-soft mb-3">
              A weighted blend of four sub-scores, each on a 0–100 scale where 100 is fully
              resilient. Weights reflect MENA mid-market reality — FX leads.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((d) => (
                <div key={d} className="rounded-xl bg-surface-1 p-3 text-center">
                  <div className="font-display text-2xl font-semibold" style={{ color: scoreColor(60) }}>
                    {Math.round(WEIGHTS[d] * 100)}%
                  </div>
                  <div className="text-[11px] text-ink-soft mt-0.5">{DIMENSION_META[d].label}</div>
                </div>
              ))}
            </div>
            <Formula>
              overall = {WEIGHTS.fx}·FX + {WEIGHTS.liquidity}·Liquidity +{' '}
              {WEIGHTS.concentration}·Concentration + {WEIGHTS.policy}·Policy
            </Formula>
          </section>

          <section>
            <H>FX sub-score — the core</H>
            <p className="text-[13px] text-ink-soft">
              Penalises hard-currency cost exposure that revenue and hedging don't cover. The single
              biggest driver of regional fragility.
            </p>
            <Formula>
              unmatched = max(0, costHardCcy − revHardCcy) × (1 − hedgeRatio)
              {'\n'}fxScore = 100 × (1 − min(unmatched ÷ {FX_THRESHOLD}, 1))
            </Formula>
          </section>

          <section>
            <H>Liquidity sub-score</H>
            <p className="text-[13px] text-ink-soft">
              Buffer of cash + committed lines vs a {LIQ_TARGET_MONTHS}-month target.
            </p>
            <Formula>liquidityScore = 100 × min(bufferMonths ÷ {LIQ_TARGET_MONTHS}, 1)</Formula>
          </section>

          <section>
            <H>Concentration sub-score</H>
            <p className="text-[13px] text-ink-soft">
              The larger of top-market and top-corridor share. Below {CONC_FLOOR * 100}% is fine;{' '}
              {(CONC_FLOOR + CONC_SPAN) * 100}%+ is critical.
            </p>
            <Formula>
              conc = max(topMarket, topSource)
              {'\n'}concentrationScore = 100 × (1 − min((conc − {CONC_FLOOR}) ÷ {CONC_SPAN}, 1))
            </Formula>
          </section>

          <section>
            <H>Policy sub-score</H>
            <p className="text-[13px] text-ink-soft mb-2">
              Starts at 100; each active country flag removes points. Bounded at 0.
            </p>
            <div className="space-y-1.5">
              {(Object.keys(POLICY_PENALTY) as PolicyFlag[]).map((f) => (
                <div
                  key={f}
                  className="flex items-center justify-between text-[13px] bg-surface-1 rounded-lg px-3 py-1.5"
                >
                  <span className="text-ink">{POLICY_FLAG_LABELS[f]}</span>
                  <span className="tnum font-semibold text-danger">−{POLICY_PENALTY[f]}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <H>Scenario impact (€)</H>
            <p className="text-[13px] text-ink-soft">
              A shock is applied to the <em>exposed</em> base, not the whole revenue. FX shocks bite
              the unmatched hard-cost base; policy shocks step up the cost base; corridor shocks hit
              the throughput routed through the top corridor. Each figure on the dashboard expands to
              show its full line-by-line trace.
            </p>
            <Formula>
              marginHit(FX) = COGS × costHardCcy × (1 − revHardCcy) × (1 − hedge) × shock
            </Formula>
          </section>

          <p className="text-[11px] text-ink-soft/70 border-t border-ink/8 pt-4">
            Information, not advice. RUKN quantifies exposure and surfaces mitigation levers
            companies commonly consider. It does not recommend specific financial products or
            counterparties.
          </p>
        </div>
      </div>
    </div>
  )
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-base font-semibold text-navy mb-1">{children}</h3>
)
const Formula = ({ children }: { children: React.ReactNode }) => (
  <pre className="mt-2 whitespace-pre-wrap font-mono text-[12px] text-petrol bg-petrol/5 rounded-lg px-3 py-2.5 leading-relaxed">
    {children}
  </pre>
)
