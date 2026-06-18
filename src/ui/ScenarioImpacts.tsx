import { useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { ScenarioImpact } from '../engine'
import { COLORS } from '../theme'
import { fmtEur, fmtPct } from './format'
import { AuditableNumber } from './Trace'

const catColor: Record<string, string> = {
  fx: COLORS.danger,
  liquidity: '#C77A2E',
  concentration: COLORS.petrol,
  policy: '#6A5AA0',
}

/**
 * "We quantify it." Each regional shock, in cash, ranked by severity. The bar
 * chart gives the at-a-glance hierarchy; the cards below give the auditable
 * detail (margin €, % of annual margin, cash) a CFO can challenge line by line.
 */
export function ScenarioImpacts({ impacts }: { impacts: ScenarioImpact[] }) {
  const [active, setActive] = useState<string | null>(impacts[0]?.scenario.id ?? null)
  const data = impacts.map((i) => ({
    id: i.scenario.id,
    name: i.scenario.label.replace(/\s*\(.*\)/, ''),
    full: i.scenario.label,
    value: i.marginHitEur,
    cat: i.scenario.category,
  }))

  return (
    <div>
      <div className="h-[180px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 56, bottom: 0, left: 8 }}
            barCategoryGap={9}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: COLORS.inkSoft }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(18,35,61,0.04)' }}
              content={({ payload }) =>
                payload && payload[0] ? (
                  <div className="rounded-lg bg-navy text-white text-xs px-3 py-2 shadow-lift max-w-[220px]">
                    <div className="font-medium">{payload[0].payload.full}</div>
                    <div className="text-amber font-semibold mt-1">
                      {fmtEur(payload[0].payload.value, { compact: true })} of lost profit
                    </div>
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              onClick={(d: any) => setActive(d.id)}
              cursor="pointer"
              label={{
                position: 'right',
                formatter: (v: number) => fmtEur(v, { compact: true }),
                fontSize: 11,
                fill: COLORS.navy,
                fontWeight: 600,
              }}
            >
              {data.map((d) => (
                <Cell
                  key={d.id}
                  fill={catColor[d.cat]}
                  fillOpacity={active === d.id ? 1 : 0.82}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* detail row for the selected scenario */}
      <div className="mt-2 grid sm:grid-cols-2 gap-2.5">
        {impacts.map((imp) => (
          <ScenarioCard
            key={imp.scenario.id}
            imp={imp}
            active={active === imp.scenario.id}
            onSelect={() => setActive(imp.scenario.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ScenarioCard({
  imp,
  active,
  onSelect,
}: {
  imp: ScenarioImpact
  active: boolean
  onSelect: () => void
}) {
  const sev = imp.pctOfAnnualMargin
  const sevColor = sev >= 40 ? COLORS.danger : sev >= 15 ? COLORS.amber : COLORS.positive
  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-xl p-3 ring-1 transition-all ${
        active ? 'bg-white ring-amber/40 shadow-card' : 'bg-surface-1 ring-ink/5 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-semibold leading-tight text-ink">{imp.scenario.label}</div>
        <div className="text-[10px] text-ink-soft shrink-0 mt-0.5">
          ~{fmtPct(imp.scenario.probability * 100)}/yr
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-soft">What it costs you</div>
          <span className="font-display text-2xl font-semibold tnum" style={{ color: sevColor }}>
            {fmtEur(imp.marginHitEur, { compact: true })}
          </span>
        </div>
        <span className="text-[12px] font-semibold tnum mb-1" style={{ color: sevColor }}>
          = {fmtPct(imp.pctOfAnnualMargin)} of a year's profit
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-ink/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, sev)}%`, background: sevColor }}
        />
      </div>
      {active && (
        <div className="mt-2.5 text-[11.5px] text-ink-soft leading-snug">
          {imp.scenario.note}
          <div className="mt-1.5">
            <AuditableNumber
              display="See how we got this number"
              title={imp.scenario.label}
              plain={imp.scenario.note}
              steps={imp.trace}
              className="text-[11px] text-petrol font-semibold"
            />
          </div>
        </div>
      )}
    </button>
  )
}
