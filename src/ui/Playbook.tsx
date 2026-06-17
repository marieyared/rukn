import type { Action } from '../engine'
import { DIMENSION_META, EFFORT_META } from '../theme'
import { fmtEur } from './format'
import { AuditableNumber } from './Trace'

/**
 * The painkiller. Prioritised levers, each cochable. Ticking one recomputes the
 * score live (handled by the parent). Language is informative, never
 * prescriptive (README §6) — "moves companies often consider", not "buy X".
 */
export function Playbook({
  actions,
  onToggle,
}: {
  actions: Action[]
  onToggle: (id: string) => void
}) {
  const totalOpen = actions
    .filter((a) => !a.done)
    .reduce((s, a) => s + a.annualImpactEur, 0)
  const captured = actions.filter((a) => a.done).reduce((s, a) => s + a.annualImpactEur, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink-soft font-semibold">
            Mitigation playbook
          </div>
          <div className="text-[12px] text-ink-soft mt-0.5">
            Ranked by impact per unit of effort. Tick a lever to see your score move.
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-ink-soft">Modelled upside still open</div>
          <div className="font-display text-xl font-semibold text-petrol tnum">
            {fmtEur(totalOpen, { compact: true })}/yr
          </div>
          {captured > 0 && (
            <div className="text-[11px] text-positive font-semibold">
              {fmtEur(captured, { compact: true })}/yr captured
            </div>
          )}
        </div>
      </div>

      <ol className="space-y-2.5">
        {actions.map((a, idx) => (
          <li
            key={a.id}
            className={`group rounded-xl ring-1 transition-all ${
              a.done
                ? 'bg-positive/5 ring-positive/25'
                : 'bg-white ring-ink/8 hover:ring-amber/40 hover:shadow-card'
            }`}
          >
            <label className="flex items-start gap-3 p-3.5 cursor-pointer">
              <span className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={a.done}
                  onChange={() => onToggle(a.id)}
                  className="peer sr-only"
                />
                <span
                  className={`block h-5 w-5 rounded-md border-2 transition-colors ${
                    a.done ? 'bg-positive border-positive' : 'border-ink/25 bg-white'
                  }`}
                />
                {a.done && (
                  <svg
                    className="absolute inset-0 m-auto text-white"
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>

              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-ink-soft/60 tnum">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[14px] font-semibold leading-tight ${
                      a.done ? 'text-ink-soft line-through decoration-positive/50' : 'text-ink'
                    }`}
                  >
                    {a.label}
                  </span>
                </span>
                <span className="block text-[12px] text-ink-soft leading-snug mt-1">
                  {a.detail}
                </span>

                <span className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <Chip className={EFFORT_META[a.effort].cls}>{EFFORT_META[a.effort].label} EFFORT</Chip>
                  <Chip className="bg-navy/5 text-ink-soft">
                    +{a.scoreUplift} {DIMENSION_META[a.improves].short}
                  </Chip>
                  <span className="text-[12px] text-ink-soft">·</span>
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-petrol">
                    <AuditableNumber
                      display={`${fmtEur(a.annualImpactEur, { compact: true })}/yr`}
                      title={a.label}
                      steps={a.trace}
                      className="text-petrol"
                    />
                  </span>
                </span>
              </span>
            </label>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[10.5px] text-ink-soft/70 leading-snug">
        Informative, not advice. These are moves companies in a similar position commonly consider;
        RUKN does not recommend specific financial products or counterparties.
      </p>
    </div>
  )
}

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${className}`}
    >
      {children}
    </span>
  )
}
