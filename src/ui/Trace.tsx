import { useState } from 'react'
import type { TraceStep } from '../engine'
import { traceValue } from './format'

/**
 * The auditability moat, made tangible. Any € figure can be expanded to show
 * the exact formula with the company's real inputs plugged in — what no
 * black-box incumbent offers. Click the figure (or the "audit" affordance).
 */
export function AuditableNumber({
  display,
  title,
  steps,
  className = '',
  align = 'left',
}: {
  display: string
  title: string
  steps: TraceStep[]
  className?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`group inline-flex items-center gap-1 underline decoration-dotted decoration-ink-soft/40 underline-offset-4 hover:decoration-amber focus:outline-none focus:decoration-amber ${className}`}
        aria-expanded={open}
      >
        {display}
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          className="opacity-40 group-hover:opacity-90 transition-opacity"
          fill="none"
        >
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={`absolute z-40 top-[calc(100%+8px)] ${
              align === 'right' ? 'right-0' : 'left-0'
            } w-[320px] animate-fadeup rounded-xl bg-navy text-white shadow-lift ring-1 ring-black/20`}
          >
            <div className="px-4 pt-3 pb-2 border-b border-white/10">
              <div className="text-[10px] uppercase tracking-[0.14em] text-amber/90 font-semibold">
                How this is calculated
              </div>
              <div className="text-sm font-medium leading-snug mt-0.5">{title}</div>
            </div>
            <ol className="px-4 py-3 space-y-2.5">
              {steps.map((s, i) => (
                <li key={i} className="text-[12.5px] leading-tight">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/75">{s.label}</span>
                    <span className="tnum font-semibold text-white shrink-0">
                      {traceValue(s.value, s.unit)}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40 font-mono mt-0.5 break-words">
                    {s.expr}
                  </div>
                </li>
              ))}
            </ol>
            <div className="px-4 pb-3 -mt-1 text-[10.5px] text-white/45">
              Every input traces to your exposure profile. No black box.
            </div>
          </div>
        </>
      )}
    </span>
  )
}
