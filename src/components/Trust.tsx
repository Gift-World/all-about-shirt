import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle, Info, Ruler, SealCheck, Star, ThumbsUp, Warning, X } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { branches, kes, type Product } from '../data/catalog'
import { condition, GRADES, measurements, recommendSize, reviewsFor, type FitPref, type FitVerdict, type Measure } from '../data/extras'
import { ease, Photo } from './ui'

/* ───────────── Condition report ───────────── */
export function ConditionReport({ p }: { p: Product }) {
  const c = useMemo(() => condition(p), [p])
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[28px] bg-paper p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-mute">Condition report</p>
          <p className="display mt-2 text-4xl">This exact piece</p>
        </div>
        <div className="text-center">
          <span className="display grid size-16 place-items-center rounded-full bg-olive text-3xl text-bone">{c.grade}</span>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 inline-flex items-center gap-1 py-1 text-[11px] font-semibold underline underline-offset-2">
            <Info size={12} /> Grades
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {GRADES.map((g) => (
                <li key={g.g} className={`list-none rounded-2xl p-3 text-xs ${g.g === c.grade ? 'bg-olive text-bone' : 'bg-bone'}`}>
                  <span className="display text-2xl">{g.g}</span> <b>{g.t}</b>
                  <span className={`mt-1 block ${g.g === c.grade ? 'text-bone/80' : 'text-mute'}`}>{g.d}</span>
                </li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>

      <p className="mt-5 text-sm">
        <span className="font-semibold">Inspector's note:</span> <span className="text-mute">“{c.note}”</span>
      </p>
      <p className="mt-1 text-xs text-mute">Inspected by {c.inspectedBy} at Shop 305 · Photographed before listing</p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {c.checks.map((k) => (
          <li key={k.k} className="flex items-start gap-2 text-sm">
            <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-olive" />
            <span>
              <b className="font-semibold">{k.k}.</b> <span className="text-mute">{k.v}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {c.closeups.map((id, i) => (
          <figure key={id + i} className="overflow-hidden rounded-2xl">
            <Photo id={id} alt={i === 0 ? 'Close up of the weave' : 'Close up of the finish'} sizes="(min-width: 1024px) 20vw, 45vw" widths={[400, 700]} className="aspect-[4/3] w-full transition-transform duration-700 hover:scale-110" />
            <figcaption className="bg-bone px-3 py-2 text-[11px] text-mute">{i === 0 ? 'Weave, 4× close up' : 'Seams and finish'}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

/* ───────────── Measurements of this piece ───────────── */
export function Measurements({ p, selected }: { p: Product; selected: string | null }) {
  const { rows, real } = useMemo(() => measurements(p), [p])
  const [unit, setUnit] = useState<'cm' | 'in'>(real ? 'in' : 'cm')
  const one = (v: number) => (unit === 'cm' ? `${v}` : `${Math.round(v / 2.54)}`)
  const fmt = (v: Measure) => (Array.isArray(v) ? `${one(v[0])}–${one(v[1])}` : one(v))
  return (
    <div className="rounded-[28px] bg-paper p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-mute">Measured by hand</p>
          <p className="display mt-2 text-4xl">Exact measurements</p>
        </div>
        <div className="flex rounded-full border border-line p-0.5 text-xs font-semibold" role="radiogroup" aria-label="Units">
          {(['cm', 'in'] as const).map((u) => (
            <button key={u} type="button" role="radio" aria-checked={unit === u} onClick={() => setUnit(u)} className={`rounded-full px-3 py-1.5 transition ${unit === u ? 'bg-ink text-bone' : ''}`}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-mute">
        {real ? 'Taken with a tape on this exact piece when it was listed. A range means the waist stretches.' : 'Every piece is laid flat and measured before it is listed. Compare with a favourite of your own.'}
      </p>
      <div className="no-scrollbar mt-5 overflow-x-auto" data-lenis-prevent-wheel>
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2 pr-3 font-medium text-mute">{unit}</th>
              {p.sizes.map((s) => (
                <th key={s} className={`px-2 py-2 text-center font-semibold ${selected === s ? 'rounded-t-lg bg-ink text-bone' : ''}`}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line/60">
                <td className="py-2.5 pr-3 text-mute">{r.label}</td>
                {p.sizes.map((s) => (
                  <td key={s} className={`px-2 py-2.5 text-center tabular-nums ${selected === s ? 'bg-ink/5 font-semibold' : ''}`}>{fmt(r.values[s])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-mute">
        <Ruler size={14} /> {real ? 'Full waist and hip measurements, not flat.' : 'Measured flat. Double the chest and waist for the full circumference.'}
      </p>
    </div>
  )
}

/* ───────────── Fit finder ───────────── */
export function FitFinder({ p, onClose, onPick }: { p: Product; onClose: () => void; onPick: (size: string) => void }) {
  const kid = p.branch === 'kids'
  const [height, setHeight] = useState(p.branch === 'men' ? 176 : kid ? 115 : 165)
  const [weight, setWeight] = useState(p.branch === 'men' ? 74 : kid ? 20 : 62)
  const [age, setAge] = useState(6)
  const [pref, setPref] = useState<FitPref>('regular')
  const [result, setResult] = useState<FitVerdict | null>(null)

  return (
    <>
      <motion.div className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label="Find my size"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.5, ease }}
        className="fixed inset-x-0 bottom-0 z-[90] max-h-[92svh] overflow-y-auto rounded-t-[28px] bg-paper p-6 md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[520px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:p-8"
        data-lenis-prevent
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-mute">Size finder</p>
            <p className="display mt-1 text-4xl">Find my size</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close size finder" className="grid size-10 place-items-center rounded-full bg-black/5"><X size={18} /></button>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35, ease }}>
              <div className="mt-6 space-y-6">
                {kid ? (
                  <Slider label="Age" value={age} min={1} max={13} unit="years" set={setAge} />
                ) : (
                  <>
                    <Slider label="Height" value={height} min={145} max={205} unit="cm" set={setHeight} />
                    <Slider label="Weight" value={weight} min={40} max={130} unit="kg" set={setWeight} />
                  </>
                )}
                <div>
                  <p className="text-sm font-semibold">How do you like it to fit?</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['snug', 'regular', 'relaxed'] as FitPref[]).map((f) => (
                      <button key={f} type="button" aria-pressed={pref === f} onClick={() => setPref(f)} className={`rounded-xl border py-3 text-sm font-semibold capitalize transition ${pref === f ? 'border-ink bg-ink text-bone' : 'border-line hover:border-ink'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setResult(recommendSize(p, { height, weight, age, pref }))} className="mt-8 w-full rounded-full bg-ink py-4 text-sm font-semibold text-bone transition hover:bg-ink-2">
                Show my size
              </button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.35, ease }} className="mt-6">
              <div className="flex items-center gap-5 rounded-[22px] bg-bone p-5">
                <motion.span
                  initial={{ scale: 0.6, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  className={`display grid size-20 shrink-0 place-items-center rounded-full text-bone ${result.size.length > 4 ? 'text-xl' : result.size.length > 2 ? 'text-3xl' : 'text-4xl'} ${result.verdict === 'yes' ? 'bg-olive' : result.verdict === 'no' ? 'bg-ink' : 'bg-clay'}`}
                >
                  {result.size}
                </motion.span>
                <div>
                  <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${result.verdict === 'yes' ? 'text-olive' : 'text-clay'}`}>
                    {result.verdict === 'yes' ? <SealCheck size={16} weight="fill" /> : <Warning size={16} weight="fill" />} {result.headline}
                  </p>
                  <p className="mt-1 text-sm text-mute">{result.note}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-mute">Every piece is one of one, so we check this exact item against you. Your size: <b className="text-ink">{result.yourSize}</b>.</p>
              {result.verdict !== 'yes' && result.others.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-semibold">On the rail in your size</p>
                  <div className="no-scrollbar -mx-6 mt-3 flex gap-3 overflow-x-auto px-6 md:-mx-8 md:px-8" data-lenis-prevent>
                    {result.others.map((o) => (
                      <Link key={o.id} to={`/product/${o.slug}`} onClick={onClose} className="w-28 shrink-0">
                        <Photo id={o.images[0]} alt={o.name} sizes="112px" widths={[240]} className="aspect-[4/5] w-full rounded-xl" />
                        <p className="mt-1.5 truncate text-xs font-semibold">{o.name}</p>
                        <p className="text-[11px] text-mute">{o.sizes[0]} · {kes(o.price)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <button type="button" onClick={() => setResult(null)} className="flex-1 rounded-full border border-ink py-3.5 text-sm font-semibold">Adjust</button>
                {result.verdict === 'no' ? (
                  <Link to={`/shop/${p.branch}?size=${encodeURIComponent(result.yourSize)}`} onClick={onClose} className="flex-[2] rounded-full bg-ink py-3.5 text-center text-sm font-semibold text-bone">
                    Shop all in {result.yourSize}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onPick(result.size)
                      onClose()
                    }}
                    className="flex-[2] rounded-full bg-ink py-3.5 text-sm font-semibold text-bone"
                  >
                    Take this one · {result.size}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

function Slider({ label, value, min, max, unit, set }: { label: string; value: number; min: number; max: number; unit: string; set: (n: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="display text-3xl tabular-nums">
          {value} <span className="font-sans text-xs text-mute">{unit}</span>
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-ink" />
    </label>
  )
}

/* ───────────── Reviews ───────────── */
export function Reviews({ p }: { p: Product }) {
  const data = useMemo(() => reviewsFor(p), [p])
  const [photo, setPhoto] = useState<string | null>(null)
  const photos = data.list.filter((r) => r.photo)
  const fitPos = 50 + (data.fit.large - data.fit.small) * 2

  return (
    <section className="mt-16 md:mt-24" aria-labelledby="reviews-title">
      <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:gap-16">
        <div>
          <h2 id="reviews-title" className="display text-5xl md:text-6xl">Reviews</h2>
          <p className="mt-2 text-sm text-mute">Every piece is one of one, so these are reviews of {branches[p.branch].house} from buyers of similar pieces.</p>
          <div className="mt-6 flex items-center gap-4">
            <p className="display text-7xl">{p.rating}</p>
            <div>
              <span className="flex gap-0.5">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} weight={i < Math.round(p.rating) ? 'fill' : 'regular'} />)}</span>
              <p className="mt-1 text-sm text-mute">{p.reviews} verified reviews</p>
            </div>
          </div>
          <ul className="mt-6 space-y-1.5">
            {data.breakdown.map((b) => (
              <li key={b.star} className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right">{b.star}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <motion.span className="block h-full origin-left rounded-full bg-ink" initial={{ scaleX: 0 }} whileInView={{ scaleX: b.pct / 100 }} viewport={{ once: true }} transition={{ duration: 1, ease }} />
                </span>
                <span className="w-8 text-mute">{b.pct}%</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-[22px] bg-paper p-5">
            <p className="text-sm font-semibold">How it fits</p>
            <div className="relative mt-4 h-1.5 rounded-full bg-line">
              <motion.span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-4 ring-paper" initial={{ left: '50%' }} whileInView={{ left: `${fitPos}%` }} viewport={{ once: true }} transition={{ duration: 1, ease }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-mute">
              <span>Runs small</span>
              <span className="font-semibold text-ink">{data.fit.true}% say true to size</span>
              <span>Runs large</span>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-semibold">Customer photos</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((r) => (
                  <button key={r.photo} type="button" onClick={() => setPhoto(r.photo!)} className="overflow-hidden rounded-xl" aria-label={`Photo from ${r.name}`}>
                    <Photo id={r.photo!} alt="" sizes="120px" widths={[240]} className="aspect-square w-full transition-transform duration-500 hover:scale-110" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ul className="divide-y divide-line">
          {data.list.map((r, i) => (
            <motion.li key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease, delay: i * 0.06 }} className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, k) => <Star key={k} size={12} weight="fill" />)}</span>
                  <span className="text-xs text-mute">{r.date}</span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed">{r.text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <span>{r.place}</span>
                  <span className="inline-flex items-center gap-1 text-olive"><SealCheck size={13} weight="fill" /> Verified buyer</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-paper px-2.5 py-1">Wears {r.size}</span>
                  <span className="rounded-full bg-paper px-2.5 py-1">{r.height}</span>
                  <span className="rounded-full bg-paper px-2.5 py-1">{r.fit}</span>
                </div>
                <button type="button" className="mt-2 inline-flex items-center gap-1.5 py-2 text-xs text-mute hover:text-ink">
                  <ThumbsUp size={13} /> Helpful ({r.helpful})
                </button>
              </div>
              {r.photo && (
                <button type="button" onClick={() => setPhoto(r.photo!)} className="w-28 overflow-hidden rounded-2xl sm:w-32" aria-label={`Open photo from ${r.name}`}>
                  <Photo id={r.photo} alt="" sizes="128px" widths={[260]} className="aspect-[3/4] w-full" />
                </button>
              )}
            </motion.li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {photo && (
          <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-ink/85 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPhoto(null)} role="dialog" aria-modal aria-label="Customer photo">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.4, ease }} className="w-full max-w-md overflow-hidden rounded-[24px]">
              <Photo id={photo} alt="Customer photo" sizes="448px" widths={[600, 900]} className="aspect-[3/4] w-full" />
            </motion.div>
            <button type="button" aria-label="Close photo" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/15 text-bone"><X size={20} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
