import type { CompanyProfile, CountryCode } from '../engine'
import { COUNTRIES, POLICY_FLAG_LABELS } from '../engine'
import { fmtEur } from './format'

/** Screen 1 — exposure profile. Sliders & selects, not a wall of fields. */
export function ProfileForm({
  profile,
  onChange,
  onClose,
}: {
  profile: CompanyProfile
  onChange: (p: CompanyProfile) => void
  onClose: () => void
}) {
  const set = <K extends keyof CompanyProfile>(k: K, v: CompanyProfile[K]) =>
    onChange({ ...profile, [k]: v })

  const toggleCountry = (code: CountryCode) => {
    const has = profile.countries.includes(code)
    set(
      'countries',
      has ? profile.countries.filter((c) => c !== code) : [...profile.countries, code],
    )
  }

  return (
    <aside className="w-full lg:w-[380px] shrink-0 bg-white rounded-2xl shadow-card ring-1 ring-ink/5 p-5 h-fit lg:sticky lg:top-5 animate-fadeup">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-semibold text-navy">Your business</h2>
        <button
          onClick={onClose}
          className="lg:hidden text-ink-soft text-sm hover:text-navy"
        >
          Done
        </button>
      </div>
      <p className="text-[12px] text-ink-soft mb-4 leading-snug">
        Tell us how the business works. The score and every € number update as you move a slider.
      </p>

      <Field label="Company name">
        <input
          value={profile.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-petrol focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Yearly sales">
          <NumberInput
            value={profile.annualRevenue}
            step={1_000_000}
            onChange={(v) => set('annualRevenue', v)}
            prefix="€"
            display={fmtEur(profile.annualRevenue, { compact: true })}
          />
        </Field>
        <Slider
          label="Profit margin"
          value={profile.grossMarginPct}
          suffix="%"
          onChange={(v) => set('grossMarginPct', v)}
          hint="What's left after the cost of what you sell."
        />
      </div>

      <SectionTitle>Money in vs money out — the core</SectionTitle>
      <Slider
        label="Sales paid in dollars/euros"
        value={profile.revenueHardCcyPct}
        suffix="%"
        onChange={(v) => set('revenueHardCcyPct', v)}
        hint="Share of your sales customers pay in USD/EUR, not local currency."
      />
      <Slider
        label="Costs paid in dollars/euros"
        value={profile.costHardCcyPct}
        suffix="%"
        onChange={(v) => set('costHardCcyPct', v)}
        hint="Share of your costs — imports, suppliers — you pay in USD/EUR."
      />
      <Slider
        label="Currency protection"
        value={profile.hedgeRatioPct}
        suffix="%"
        onChange={(v) => set('hedgeRatioPct', v)}
        hint="How much of your dollar/euro exposure is locked in (hedged). Often ~0 in frontier markets — that's normal."
      />

      <SectionTitle>Cushion & dependence</SectionTitle>
      <Slider
        label="Cash cushion"
        value={profile.liquidityBufferMonths}
        max={12}
        step={0.5}
        suffix=" mo"
        onChange={(v) => set('liquidityBufferMonths', v)}
        hint="Months you could keep operating on cash + credit lines if income stopped."
      />
      <Slider
        label="Reliance on your biggest market"
        value={profile.topMarketPct}
        suffix="%"
        onChange={(v) => set('topMarketPct', v)}
        hint="Share of sales from your single largest country/market."
      />
      <Slider
        label="Reliance on your biggest supplier/route"
        value={profile.topSourcePct}
        suffix="%"
        onChange={(v) => set('topSourcePct', v)}
        hint="Share of sourcing through one supplier or one shipping route."
      />

      <SectionTitle>Where you operate</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {COUNTRIES.map((c) => {
          const on = profile.countries.includes(c.code)
          return (
            <button
              key={c.code}
              onClick={() => toggleCountry(c.code)}
              className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                on
                  ? 'bg-navy text-white'
                  : 'bg-surface-2 text-ink-soft hover:bg-surface-1'
              }`}
              title={
                c.flags
                  .map((f) => `${POLICY_FLAG_LABELS[f.flag]} (${Math.round(f.intensity * 100)}%)`)
                  .join(', ') || 'No active policy flags'
              }
            >
              {c.name}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10.5px] text-ink-soft/80 leading-snug">
        Picking a country switches on its real-world risks — capital controls, subsidy cuts,
        sanctions, import rules — in your country score. Hover a country to see which.
      </p>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-petrol border-b border-ink/8 pb-1">
      {children}
    </div>
  )
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  hint?: string
}) {
  return (
    <div className="mb-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] text-ink font-medium">{label}</span>
        <span className="tnum text-[13px] font-semibold text-navy">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-1.5"
      />
      {hint && <p className="text-[10.5px] text-ink-soft/80 mt-0.5 leading-snug">{hint}</p>}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  step = 1,
  prefix,
  display,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  prefix?: string
  display?: string
}) {
  return (
    <div className="flex items-center rounded-lg border border-ink/15 focus-within:border-petrol overflow-hidden">
      {prefix && <span className="pl-2.5 text-ink-soft text-sm">{prefix}</span>}
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full px-2 py-2 text-sm focus:outline-none tnum"
      />
      {display && (
        <span className="pr-2.5 text-[11px] text-ink-soft whitespace-nowrap">{display}</span>
      )}
    </div>
  )
}
