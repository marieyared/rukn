import { useCountUp } from './useCountUp'
import { scoreColor, COLORS } from '../theme'

/**
 * The hero. A 270° radial gauge that shows the live Resilience Score AND a faint
 * "ghost" arc up to the potential score the open high-impact actions would reach
 * — the deck's retention loop ("come back to watch it move") on screen one.
 */
export function ScoreGauge({
  score,
  potential,
  label,
  delta,
}: {
  score: number
  potential: number
  label: string
  delta?: number
}) {
  const animated = useCountUp(score)
  const SIZE = 280
  const R = 116
  const STROKE = 18
  const C = 2 * Math.PI * R
  const SWEEP = 0.75 // 270° arc, gap at the bottom
  const arcFor = (v: number) => (Math.max(0, Math.min(100, v)) / 100) * SWEEP * C

  const color = scoreColor(score)
  const showGhost = potential > score + 0.5
  // rotate so the 270° arc opens at the bottom and starts at lower-left
  const rotate = 135

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        <g transform={`rotate(${rotate} ${SIZE / 2} ${SIZE / 2})`}>
          {/* track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={COLORS.track}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${SWEEP * C} ${C}`}
          />
          {/* ghost potential arc */}
          {showGhost && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={COLORS.positive}
              strokeOpacity={0.22}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${arcFor(potential)} ${C}`}
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
            />
          )}
          {/* current score arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${arcFor(score)} ${C}`}
            style={{
              transition:
                'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease',
            }}
          />
        </g>

        {/* potential target marker */}
        {showGhost && (
          <TargetTick size={SIZE} r={R} value={potential} sweep={SWEEP} rotate={rotate} />
        )}
      </svg>

      {/* center readout, overlaid */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-soft font-semibold">
          Resilience Score
        </div>
        <div className="flex items-end gap-1 mt-1">
          <span
            className="font-display tnum leading-none"
            style={{ fontSize: 76, color }}
          >
            {Math.round(animated)}
          </span>
          <span className="text-ink-soft text-lg font-medium mb-2">/100</span>
        </div>
        <div className="text-sm font-semibold mt-1" style={{ color }}>
          {label}
        </div>
        {typeof delta === 'number' && delta !== 0 && (
          <div
            className={`mt-1 text-xs font-semibold inline-flex items-center gap-1 ${
              delta > 0 ? 'text-positive' : 'text-danger'
            }`}
          >
            {delta > 0 ? '▲' : '▼'} {delta > 0 ? '+' : ''}
            {Math.round(delta)} since baseline
          </div>
        )}
        {showGhost && (
          <div className="mt-2 text-[11px] text-ink-soft/90 text-center max-w-[180px] leading-tight">
            Potential <span className="font-semibold text-positive">{Math.round(potential)}</span> if
            you act on the open levers
          </div>
        )}
      </div>
    </div>
  )
}

/** Small tick + dot on the arc marking the achievable potential score. */
function TargetTick({
  size,
  r,
  value,
  sweep,
  rotate,
}: {
  size: number
  r: number
  value: number
  sweep: number
  rotate: number
}) {
  const cx = size / 2
  const cy = size / 2
  const frac = Math.max(0, Math.min(100, value)) / 100
  const angle = ((rotate + frac * sweep * 360) * Math.PI) / 180
  const x = cx + r * Math.cos(angle)
  const y = cy + r * Math.sin(angle)
  return (
    <g style={{ transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
      <circle cx={x} cy={y} r={5.5} fill="#fff" stroke={COLORS.positive} strokeWidth={2.5} />
    </g>
  )
}
