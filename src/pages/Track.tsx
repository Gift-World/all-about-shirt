import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowCounterClockwise, Check, ChatCircleText, Moped, Package, Phone, ShieldCheck, Star, Storefront, TShirt } from '@phosphor-icons/react'
import { byId, kes, whatsapp } from '../data/catalog'
import { ESTATES, findEstate, RIDERS, SHOP } from '../data/delivery'
import { ease, Photo } from '../components/ui'
import type { Order } from './Checkout'

const PACK = 5 // seconds, demo speed
const PICKUP = 4
const RIDE = 40

export function Track() {
  const { id } = useParams()
  const order = useMemo<Order | null>(() => {
    try {
      const o = JSON.parse(sessionStorage.getItem('aal-order') || 'null') as Order | null
      return o && o.id === id ? o : null
    } catch {
      return null
    }
  }, [id])
  const lines = order?.lines ?? [
    { key: 'd1', id: 'p1', colour: 'Chalk white', size: 'L', qty: 1 },
    { key: 'd2', id: 'p15', colour: 'Sand', size: 'M', qty: 1 },
  ]
  const tryHome = order ? order.tryHome ?? false : true
  const estate = findEstate(order?.area) ?? ESTATES[4]
  const rider = RIDERS[(id?.length ?? 0) % RIDERS.length]

  const [t, setT] = useState(0)
  useEffect(() => {
    document.title = `Tracking ${id} | All About Linen`
    const start = performance.now()
    let raf = 0
    const loop = (now: number) => {
      setT((now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [id])

  const rideP = Math.min(1, Math.max(0, (t - PACK - PICKUP) / RIDE))
  const stage = t < PACK ? 0 : t < PACK + PICKUP ? 1 : rideP < 1 ? 2 : 3
  const minsLeft = Math.max(0, Math.ceil(estate.mins * (1 - rideP) + (stage < 2 ? (stage === 0 ? 12 : 4) : 0)))

  const steps = [
    { icon: Package, t: 'Packed and checked', d: 'Inspected, steamed and wrapped at Shop 305' },
    { icon: Storefront, t: `${rider.name.split(' ')[0]} picked it up`, d: `${rider.bike} · ${rider.plate}` },
    { icon: Moped, t: 'On the way', d: `Riding to ${estate.name}` },
    { icon: Check, t: tryHome ? 'Arrived, try it on' : 'Delivered', d: tryHome ? 'Your rider waits 15 minutes' : 'Enjoy your linen' },
  ]

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-mute">Order {id} · {estate.name}</p>
          <AnimatePresence mode="wait">
            <motion.h1 key={stage} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5, ease }} className="display mt-2 text-5xl md:text-7xl">
              {stage === 3 ? (tryHome ? `${rider.name.split(' ')[0]} is outside` : 'Delivered') : (
                <>
                  Arriving in <span className="italic text-clay tabular-nums">{minsLeft} min</span>
                </>
              )}
            </motion.h1>
          </AnimatePresence>
        </div>
        <span className="rounded-full bg-oat px-3 py-1.5 text-[11px] font-semibold">Demo · trip shown at 40× speed</span>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <MapView estate={estate} progress={rideP} stage={stage} />

        <div className="flex flex-col gap-4">
          {/* rider card */}
          <div className="rounded-[24px] bg-ink p-5 text-bone">
            <div className="flex items-center gap-4">
              <span className="display grid size-14 shrink-0 place-items-center rounded-full bg-sand text-2xl text-ink">
                {rider.name.split(' ').map((s) => s[0]).join('')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{rider.name}</p>
                <p className="flex items-center gap-1 text-xs text-bone/70">
                  <Star size={12} weight="fill" className="text-sand" /> {rider.rating} · {rider.trips.toLocaleString()} trips
                </p>
                <p className="mt-0.5 text-xs text-bone/70">{rider.bike} · <span className="font-mono text-bone">{rider.plate}</span></p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href="tel:+254702228340" className="flex items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-sm font-semibold transition hover:bg-white/15">
                <Phone size={16} /> Call
              </a>
              <a href={whatsapp(`Hi, this is about order ${id}.`)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-white/10 py-3 text-sm font-semibold transition hover:bg-white/15">
                <ChatCircleText size={16} /> Message
              </a>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-bone/60"><ShieldCheck size={13} /> Share code <b className="font-mono text-bone">4 8 2 1</b> with your rider at the door</p>
          </div>

          {/* timeline */}
          <ol className="rounded-[24px] bg-paper p-5">
            {steps.map((s, i) => {
              const done = stage > i || (i === 3 && stage === 3)
              const now = stage === i && i < 3
              return (
                <li key={s.t} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < steps.length - 1 && (
                    <span className="absolute top-9 left-[17px] h-[calc(100%-36px)] w-0.5 bg-line">
                      <motion.span className="block w-full origin-top bg-ink" initial={false} animate={{ scaleY: stage > i ? 1 : 0 }} transition={{ duration: 0.6, ease }} style={{ height: '100%' }} />
                    </span>
                  )}
                  <span className={`relative grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-500 ${done ? 'bg-ink text-bone' : now ? 'bg-clay text-white' : 'bg-oat text-mute'}`}>
                    {now && <span className="absolute inset-0 animate-ping rounded-full bg-clay/40" />}
                    <s.icon size={16} />
                  </span>
                  <div className="pt-1">
                    <p className={`text-sm font-semibold ${done || now ? '' : 'text-mute'}`}>{s.t}</p>
                    <p className="text-xs text-mute">{s.d}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <AnimatePresence>{stage === 3 && tryHome && <TryOn lines={lines} riderName={rider.name.split(' ')[0]} />}</AnimatePresence>

      {!(stage === 3 && tryHome) && (
        <section className="mt-6 rounded-[24px] bg-paper p-5">
          <p className="text-sm font-semibold">In this delivery</p>
          <ul className="mt-3 flex gap-3 overflow-x-auto no-scrollbar" data-lenis-prevent-wheel>
            {lines.map((l) => {
              const p = byId(l.id)
              if (!p) return null
              return (
                <li key={l.key} className="w-28 shrink-0">
                  <Photo id={p.images[0]} alt={p.name} sizes="112px" widths={[240]} className="aspect-[4/5] w-full rounded-xl" />
                  <p className="mt-1.5 truncate text-xs font-semibold">{p.name}</p>
                  <p className="text-[11px] text-mute">{l.size}</p>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

/* Stylised Nairobi map with the rider following the road. */
function MapView({ estate, progress, stage }: { estate: { name: string; x: number; y: number }; progress: number; stage: number }) {
  const path = useRef<SVGPathElement>(null)
  const [pt, setPt] = useState({ x: SHOP.x, y: SHOP.y, a: 0 })
  const mid = { x: (SHOP.x + estate.x) / 2 + (estate.y - SHOP.y) * 0.25, y: (SHOP.y + estate.y) / 2 - (estate.x - SHOP.x) * 0.25 }
  const d = `M${SHOP.x} ${SHOP.y} Q${mid.x} ${mid.y} ${estate.x} ${estate.y}`

  useEffect(() => {
    const el = path.current
    if (!el) return
    const L = el.getTotalLength()
    const p = el.getPointAtLength(L * progress)
    const q = el.getPointAtLength(Math.min(L, L * progress + 2))
    setPt({ x: p.x, y: p.y, a: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI })
  }, [progress, d])

  return (
    <div className="relative aspect-[10/8] overflow-hidden rounded-[28px] bg-[#E6DED0] md:aspect-[10/7]">
      <svg viewBox="0 0 1000 700" className="absolute inset-0 h-full w-full" role="img" aria-label={`Map from Shop 305 to ${estate.name}`}>
        {/* parks and blocks */}
        <ellipse cx={330} cy={610} rx={170} ry={70} fill="#CFD3B8" />
        <ellipse cx={420} cy={200} rx={90} ry={45} fill="#CFD3B8" />
        <rect x={620} y={300} width={120} height={80} rx={14} fill="#DDD3C2" />
        <rect x={250} y={250} width={90} height={60} rx={14} fill="#DDD3C2" />
        {/* roads */}
        {[
          'M0 420 C200 400 400 430 1000 380',
          'M560 0 C540 200 580 500 560 700',
          'M100 100 C300 250 700 300 1000 520',
          'M0 640 C300 560 600 520 1000 640',
          'M200 0 C260 300 300 500 240 700',
          'M760 0 C700 200 800 450 900 700',
        ].map((r, i) => (
          <path key={i} d={r} fill="none" stroke="#F7F3EC" strokeWidth={i < 2 ? 16 : 9} strokeLinecap="round" />
        ))}
        {/* estates */}
        {ESTATES.map((e) => (
          <g key={e.name} opacity={e.name === estate.name ? 1 : 0.55}>
            <circle cx={e.x} cy={e.y} r={4} fill="#6F685D" />
            <text x={e.x + 8} y={e.y + 4} fontSize={15} fontFamily="Manrope Variable, sans-serif" fill="#2B2924">{e.name}</text>
          </g>
        ))}
        {/* route */}
        <path ref={path} d={d} fill="none" stroke="#14130F" strokeOpacity={0.15} strokeWidth={10} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#14130F" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
        {/* shop */}
        <g>
          <circle cx={SHOP.x} cy={SHOP.y} r={18} fill="#14130F" />
          <text x={SHOP.x} y={SHOP.y + 5} textAnchor="middle" fontSize={13} fill="#EFE9DF" fontWeight={700}>305</text>
          <text x={SHOP.x + 26} y={SHOP.y - 14} fontSize={14} fontWeight={700} fill="#14130F">All About Linen</text>
        </g>
        {/* destination */}
        <g>
          <circle cx={estate.x} cy={estate.y} r={26} fill="#B5623D" opacity={0.18}>
            <animate attributeName="r" values="18;34;18" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={estate.x} cy={estate.y} r={11} fill="#B5623D" stroke="#fff" strokeWidth={3} />
        </g>
        {/* rider */}
        {stage >= 2 && (
          <g transform={`translate(${pt.x} ${pt.y})`}>
            <circle r={22} fill="#fff" stroke="#14130F" strokeWidth={2} />
            <g transform={`rotate(${pt.a})`}>
              <path d="M-9 -6 L11 0 L-9 6 Z" fill="#14130F" />
            </g>
          </g>
        )}
      </svg>
      {stage < 2 && (
        <div className="absolute bottom-4 left-4 rounded-full bg-paper/90 px-3 py-2 text-xs font-semibold backdrop-blur">
          {stage === 0 ? 'Packing your order at Shop 305…' : 'Rider is collecting your parcel…'}
        </div>
      )}
    </div>
  )
}

/* Try at home: keep or return each piece within 15 minutes. */
function TryOn({ lines, riderName }: { lines: { key: string; id: string; size: string; qty: number }[]; riderName: string }) {
  const [keep, setKeep] = useState<Record<string, boolean>>(() => Object.fromEntries(lines.map((l) => [l.key, true])))
  const [left, setLeft] = useState(15 * 60)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (done) return
    const i = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(i)
  }, [done])
  const kept = lines.filter((l) => keep[l.key])
  const total = kept.reduce((a, l) => a + (byId(l.id)?.price ?? 0) * l.qty, 0)
  const returned = lines.length - kept.length

  return (
    <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease }} className="mt-6 rounded-[28px] bg-paper p-5 md:p-8" aria-label="Try at home">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5 text-clay"><TShirt size={13} /> Try at home</p>
          <p className="display mt-2 text-4xl md:text-5xl">Try it on. Keep what you love.</p>
          <p className="mt-1 text-sm text-mute">{riderName} waits outside. Anything you return goes straight back with him, no questions.</p>
        </div>
        <div className="text-right">
          <p className="display text-6xl tabular-nums">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</p>
          <p className="text-xs text-mute">minutes left to try</p>
        </div>
      </div>

      {!done ? (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {lines.map((l) => {
              const p = byId(l.id)
              if (!p) return null
              const k = keep[l.key]
              return (
                <li key={l.key}>
                  <button type="button" onClick={() => setKeep({ ...keep, [l.key]: !k })} aria-pressed={k} className="group block w-full text-left">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                      <Photo id={p.images[0]} alt={p.name} sizes="(min-width: 768px) 22vw, 45vw" className={`h-full w-full transition duration-500 ${k ? '' : 'scale-95 opacity-40 grayscale'}`} />
                      <span className={`absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${k ? 'bg-ink text-bone' : 'bg-bone text-ink'}`}>
                        {k ? 'Keeping' : 'Returning'}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{p.name}</p>
                    <p className="flex items-center gap-1 text-xs text-mute">
                      {l.size} · {kes(p.price)} · <span className="inline-flex items-center gap-0.5 underline"><ArrowCounterClockwise size={11} /> tap to {k ? 'return' : 'keep'}</span>
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-bone p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Keeping <b>{kept.length}</b>{returned ? <>, returning <b>{returned}</b></> : null} · Pay <b>{kes(total)}</b> with M-Pesa
            </p>
            <button type="button" onClick={() => setDone(true)} disabled={!kept.length && false} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bone">
              {kept.length ? `Done, pay ${kes(total)}` : 'Return everything'}
            </button>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 flex flex-col items-center rounded-2xl bg-bone p-8 text-center" role="status">
          <span className="grid size-14 place-items-center rounded-full bg-olive text-bone"><Check size={26} weight="bold" /></span>
          <p className="display mt-4 text-4xl">{kept.length ? 'Enjoy your linen.' : 'All sent back.'}</p>
          <p className="mt-1 text-sm text-mute">
            {kept.length ? `M-Pesa prompt sent for ${kes(total)}.` : 'Nothing to pay.'} {returned ? `${riderName} is taking ${returned} ${returned === 1 ? 'piece' : 'pieces'} back to Shop 305.` : ''}
          </p>
          <Link to="/shop" className="mt-6 rounded-full border border-ink px-6 py-3 text-sm font-semibold">Keep shopping</Link>
        </motion.div>
      )}
    </motion.section>
  )
}
