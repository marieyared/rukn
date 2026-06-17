import { useEffect, useMemo, useState } from 'react'
import {
  buildPlaybook,
  rankedImpacts,
  scoreWithUplift,
  subScores,
  SCENARIOS,
  upliftFrom,
  type CompanyProfile,
} from './engine'
import { SEED_PROFILE, STORAGE_KEY, STORAGE_DONE_KEY } from './data/seed'
import { ScoreGauge } from './ui/ScoreGauge'
import { SubScores } from './ui/SubScores'
import { ScenarioImpacts } from './ui/ScenarioImpacts'
import { Playbook } from './ui/Playbook'
import { ProfileForm } from './ui/ProfileForm'
import { Methodology } from './ui/Methodology'
import { fmtEur } from './ui/format'

function loadProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...SEED_PROFILE, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return SEED_PROFILE
}
function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DONE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    /* ignore */
  }
  return new Set()
}

export default function App() {
  const [profile, setProfile] = useState<CompanyProfile>(loadProfile)
  const [done, setDone] = useState<Set<string>>(loadDone)
  const [showForm, setShowForm] = useState(true)
  const [showMethod, setShowMethod] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])
  useEffect(() => {
    localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify([...done]))
  }, [done])

  // ── derived (pure engine) ──
  const baseSub = useMemo(() => subScores(profile), [profile])
  const playbook = useMemo(() => {
    const pb = buildPlaybook(profile)
    return pb.map((a) => ({ ...a, done: done.has(a.id) }))
  }, [profile, done])

  const doneUplift = useMemo(() => upliftFrom(playbook, done), [playbook, done])
  const allUplift = useMemo(
    () => upliftFrom(playbook, new Set(playbook.map((a) => a.id))),
    [playbook],
  )

  const current = useMemo(() => scoreWithUplift(baseSub, doneUplift), [baseSub, doneUplift])
  const potential = useMemo(() => scoreWithUplift(baseSub, allUplift), [baseSub, allUplift])
  const baseline = useMemo(() => scoreWithUplift(baseSub, {}), [baseSub])

  const impacts = useMemo(() => rankedImpacts(profile, SCENARIOS), [profile])
  const worstImpact = impacts[0]

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const reset = () => {
    setProfile(SEED_PROFILE)
    setDone(new Set())
  }

  const delta = Math.round(current.overall - baseline.overall)

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-[1240px] mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="font-display text-lg font-semibold tracking-tight leading-none">
                RUKN
              </div>
              <div className="text-[10.5px] text-white/55 leading-tight mt-0.5">
                Resilience intelligence · MENA mid-market
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMethod(true)}
              className="text-[12.5px] font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Methodology
            </button>
            <button
              onClick={() => setShowForm((s) => !s)}
              className="lg:hidden text-[12.5px] font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
            >
              {showForm ? 'Hide inputs' : 'Edit profile'}
            </button>
            <button
              onClick={reset}
              className="text-[12.5px] font-medium text-white/70 hover:text-white px-2.5 py-1.5"
              title="Reset to the demo profile"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Insight strip — the deck's vitamin→painkiller line, made concrete */}
      <div className="bg-petrol text-white/95">
        <div className="max-w-[1240px] mx-auto px-5 py-2.5 text-[13px] flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{profile.name}</span>
          <span className="text-white/55">·</span>
          <span>
            A <strong>{worstImpact.scenario.label.replace(/\s*\(.*\)/, '').toLowerCase()}</strong>{' '}
            would cost about{' '}
            <strong className="text-amber">
              {fmtEur(worstImpact.marginHitEur, { compact: true })}
            </strong>{' '}
            of margin this year — {Math.round(worstImpact.pctOfAnnualMargin)}% of your annual margin.
          </span>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-5 py-5 flex flex-col lg:flex-row gap-5">
        {showForm && (
          <ProfileForm profile={profile} onChange={setProfile} onClose={() => setShowForm(false)} />
        )}

        <div className="flex-1 min-w-0 space-y-5">
          {/* Hero row: gauge + sub-scores */}
          <section className="bg-white rounded-2xl shadow-card ring-1 ring-ink/5 p-5 animate-fadeup">
            <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-center">
              <div className="flex justify-center">
                <ScoreGauge
                  score={current.overall}
                  potential={potential.overall}
                  label={current.label}
                  delta={delta}
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold text-navy">
                    Where you stand, by dimension
                  </h2>
                  <span className="text-[11px] text-ink-soft">
                    Ticks show your starting point
                  </span>
                </div>
                <SubScores sub={current.sub} baseline={baseline.sub} />
                <ProgressNote
                  done={done.size}
                  total={playbook.length}
                  potential={Math.round(potential.overall)}
                  current={Math.round(current.overall)}
                />
              </div>
            </div>
          </section>

          {/* Scenario impacts */}
          <section className="bg-white rounded-2xl shadow-card ring-1 ring-ink/5 p-5 animate-fadeup">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-display text-lg font-semibold text-navy">
                What the next shock costs you
              </h2>
              <span className="text-[11px] text-ink-soft">Ranked by probability-weighted severity</span>
            </div>
            <p className="text-[12px] text-ink-soft mb-3">
              Company-specific, in cash. Click any number to audit the calculation.
            </p>
            <ScenarioImpacts impacts={impacts} />
          </section>

          {/* Playbook */}
          <section className="bg-white rounded-2xl shadow-card ring-1 ring-ink/5 p-5 animate-fadeup">
            <Playbook actions={playbook} onToggle={toggle} />
          </section>

          <footer className="text-center text-[11px] text-ink-soft/70 py-3">
            RUKN · working-name prototype · figures are modelled from your inputs, not a live client
            feed. Information, not advice.
          </footer>
        </div>
      </main>

      {showMethod && <Methodology onClose={() => setShowMethod(false)} />}
    </div>
  )
}

function ProgressNote({
  done,
  total,
  potential,
  current,
}: {
  done: number
  total: number
  potential: number
  current: number
}) {
  const gap = potential - current
  return (
    <div className="mt-4 rounded-xl bg-gradient-to-r from-petrol/8 to-positive/8 p-3.5 flex items-center gap-3">
      <div className="shrink-0 h-9 w-9 rounded-full bg-positive/15 grid place-items-center text-positive font-bold text-sm">
        {done}/{total}
      </div>
      <div className="text-[12.5px] text-ink leading-snug">
        {gap > 0 ? (
          <>
            <strong>{gap} more points</strong> of resilience are within reach. Working the open
            levers takes you from <strong>{current}</strong> toward{' '}
            <strong className="text-positive">{potential}</strong> — the score a CFO comes back to
            watch climb.
          </>
        ) : (
          <>
            You've captured the full modelled upside — score at <strong>{current}</strong>. Refresh
            your profile as the business changes to keep it honest.
          </>
        )}
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="h-9 w-9 rounded-lg bg-amber grid place-items-center">
      <span className="font-display text-navy font-bold text-lg leading-none">R</span>
    </div>
  )
}
