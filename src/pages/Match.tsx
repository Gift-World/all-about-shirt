import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { ArrowCounterClockwise, ArrowsLeftRight, Bag, Heart, HeartStraight, Sparkle, Users, X } from '@phosphor-icons/react'
import { branches, kes, products, type Branch, type Product } from '../data/catalog'
import { isSold, lastOnes, stock, totalLeft } from '../data/extras'
import { ease, Photo } from '../components/ui'
import { useShop } from '../store/shop'

type Verdict = 'love' | 'pass' | 'bag'
type Mode = 'solo' | 'couple'

const shuffle = <T,>(a: T[], seed = 7) => {
  const r = [...a]
  let s = seed
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export function Match() {
  useEffect(() => {
    document.title = 'Linen Match | All About Linen'
  }, [])
  const [mode, setMode] = useState<Mode>('solo')
  const [house, setHouse] = useState<Branch | 'all'>('all')
  const [round, setRound] = useState(0)

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-col items-center text-center">
        <p className="eyebrow inline-flex items-center gap-1.5 text-clay"><Sparkle size={12} weight="fill" /> New · Linen Match</p>
        <h1 className="display mt-3 text-6xl md:text-8xl">
          Swipe your <span className="italic text-clay">style</span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-mute">Right to love it, left to pass, up to put it in your bag. We learn your taste as you go.</p>

        <div className="mt-6 inline-flex rounded-full border border-line bg-paper p-1" role="radiogroup" aria-label="Mode">
          {(
            [
              { k: 'solo', l: 'Just me', i: HeartStraight },
              { k: 'couple', l: 'Couples', i: Users },
            ] as const
          ).map((m) => (
            <button
              key={m.k}
              type="button"
              role="radio"
              aria-checked={mode === m.k}
              onClick={() => {
                setMode(m.k)
                setRound((r) => r + 1)
              }}
              className="relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              {mode === m.k && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.4, ease }} />}
              <span className={`relative inline-flex items-center gap-2 ${mode === m.k ? 'text-bone' : ''}`}>
                <m.i size={16} /> {m.l}
              </span>
            </button>
          ))}
        </div>

        {mode === 'solo' && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(['all', 'men', 'women', 'kids'] as const).map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={house === h}
                onClick={() => {
                  setHouse(h)
                  setRound((r) => r + 1)
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${house === h ? 'bg-oat' : 'hover:bg-oat/60'}`}
              >
                {h === 'all' ? 'Everything' : branches[h].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">{mode === 'solo' ? <Solo key={`s${round}`} house={house} /> : <Couple key={`c${round}`} />}</div>
    </div>
  )
}

/* ═════════════ Solo ═════════════ */
function Solo({ house }: { house: Branch | 'all' }) {
  const deck = useMemo(() => shuffle(products.filter((p) => !isSold(p) && (house === 'all' || p.branch === house)), house.length).slice(0, 14), [house])
  const [i, setI] = useState(0)
  const [history, setHistory] = useState<{ p: Product; v: Verdict }[]>([])
  const [match, setMatch] = useState<Product | null>(null)
  const [sizeFor, setSizeFor] = useState<Product | null>(null)
  const wishlist = useShop((s) => s.wishlist)
  const toggleWish = useShop((s) => s.toggleWish)

  const decide = useCallback(
    (v: Verdict) => {
      const p = deck[i]
      if (!p) return
      setHistory((h) => [...h, { p, v }])
      setI((n) => n + 1)
      if (v === 'love' && !wishlist.includes(p.id)) toggleWish(p.id)
      if (v === 'bag') setSizeFor(p)
      if (v === 'love' && (totalLeft(p) <= 4 || lastOnes(p).length)) setMatch(p)
    },
    [deck, i, wishlist, toggleWish],
  )
  const undo = () => {
    if (!history.length) return
    setHistory((h) => h.slice(0, -1))
    setI((n) => n - 1)
  }

  if (i >= deck.length) return <TasteProfile history={history} />

  return (
    <div className="flex flex-col items-center">
      <Deck cards={deck.slice(i, i + 3)} onDecide={decide} progress={`${i + 1} / ${deck.length}`} />
      <Controls onDecide={decide} onUndo={undo} canUndo={history.length > 0} />
      <AnimatePresence>{match && <MatchModal p={match} onClose={() => setMatch(null)} onBag={() => { setSizeFor(match); setMatch(null) }} />}</AnimatePresence>
      <AnimatePresence>{sizeFor && <SizeSheet p={sizeFor} onClose={() => setSizeFor(null)} />}</AnimatePresence>
    </div>
  )
}

function Deck({ cards, onDecide, progress, allowBag = true }: { cards: Product[]; onDecide: (v: Verdict) => void; progress: string; allowBag?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') onDecide('love')
      if (e.key === 'ArrowLeft') onDecide('pass')
      if (e.key === 'ArrowUp' && allowBag) {
        e.preventDefault()
        onDecide('bag')
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onDecide, allowBag])

  return (
    <div className="relative aspect-[3/4.2] w-full max-w-[380px]">
      <AnimatePresence>
        {[...cards].reverse().map((p, idx) => {
          const depth = cards.length - 1 - idx
          return <SwipeCard key={p.id} p={p} depth={depth} onDecide={onDecide} allowBag={allowBag} />
        })}
      </AnimatePresence>
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[11px] text-mute">{progress}</span>
    </div>
  )
}

function SwipeCard({ p, depth, onDecide, allowBag }: { p: Product; depth: number; onDecide: (v: Verdict) => void; allowBag: boolean }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-18, 18])
  const love = useTransform(x, [30, 140], [0, 1])
  const pass = useTransform(x, [-140, -30], [1, 0])
  const bag = useTransform(y, [-140, -40], [1, 0])
  const [photo, setPhoto] = useState(0)
  const [leaving, setLeaving] = useState<Verdict | null>(null)
  const top = depth === 0
  const left = totalLeft(p)
  const ones = lastOnes(p)

  const fly = (v: Verdict) => {
    setLeaving(v)
    const to = v === 'love' ? { x: 600, y: 40 } : v === 'pass' ? { x: -600, y: 40 } : { x: 0, y: -800 }
    animate(x, to.x, { duration: 0.45, ease })
    animate(y, to.y, { duration: 0.45, ease }).then(() => onDecide(v))
  }

  const onEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120 || info.velocity.x > 700) fly('love')
    else if (info.offset.x < -120 || info.velocity.x < -700) fly('pass')
    else if (allowBag && (info.offset.y < -120 || info.velocity.y < -700)) fly('bag')
    else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <motion.div
      className="absolute inset-0 touch-none select-none"
      style={{ x, y, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 16, opacity: depth > 2 ? 0 : 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease }}
      drag={top && !leaving}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={onEnd}
      data-cursor={top ? 'Drag' : undefined}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-oat shadow-[0_30px_60px_-20px_rgba(20,19,15,0.45)]">
        <Photo id={p.images[photo]} alt={`${p.name}, ${photo === 1 ? 'on body' : photo === 0 ? 'product' : 'fabric'} photo`} sizes="380px" widths={[500, 800]} priority={top} className="pointer-events-none h-full w-full" />
        {/* photo bars, tap left or right half to flip */}
        <div className="absolute inset-x-3 top-3 flex gap-1.5">
          {p.images.map((_, k) => (
            <span key={k} className={`h-1 flex-1 rounded-full ${k === photo ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
        {top && (
          <>
            <button type="button" aria-label="Previous photo" className="absolute top-0 bottom-1/3 left-0 w-1/2" onClick={() => setPhoto((n) => (n + 2) % 3)} />
            <button type="button" aria-label="Next photo" className="absolute top-0 right-0 bottom-1/3 w-1/2" onClick={() => setPhoto((n) => (n + 1) % 3)} />
          </>
        )}

        <motion.span style={{ opacity: love }} className="display absolute top-10 left-6 -rotate-12 rounded-xl border-4 border-olive px-3 text-5xl text-olive">LOVE</motion.span>
        <motion.span style={{ opacity: pass }} className="display absolute top-10 right-6 rotate-12 rounded-xl border-4 border-clay px-3 text-5xl text-clay">PASS</motion.span>
        {allowBag && <motion.span style={{ opacity: bag }} className="display absolute bottom-40 left-1/2 -translate-x-1/2 rounded-xl border-4 border-bone bg-ink/40 px-3 text-5xl text-bone">BAG IT</motion.span>}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent p-5 pt-20 text-bone">
          <p className="eyebrow text-bone/70">{branches[p.branch].house}</p>
          <p className="display mt-1 text-4xl leading-none">{p.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{kes(p.price)}</span>
            <span className="text-bone/60">·</span>
            <span className="text-bone/80">{p.colours.map((c) => c.name).slice(0, 2).join(', ')}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {left <= 3 ? (
              <Chip hot>Last {left} {left === 1 ? 'piece' : 'pieces'}</Chip>
            ) : ones.length ? (
              <Chip hot>1 left in {ones[0]}</Chip>
            ) : (
              <Chip>{left} in stock</Chip>
            )}
            <Chip>{p.fit}</Chip>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Chip({ children, hot }: { children: React.ReactNode; hot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${hot ? 'bg-clay text-white' : 'bg-white/15'}`}>
      {hot && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
      {children}
    </span>
  )
}

function Controls({ onDecide, onUndo, canUndo, allowBag = true }: { onDecide: (v: Verdict) => void; onUndo?: () => void; canUndo?: boolean; allowBag?: boolean }) {
  const btn = 'grid place-items-center rounded-full bg-paper shadow-lg ring-1 ring-black/5 transition hover:scale-110 active:scale-95'
  return (
    <div className="mt-12 flex items-center gap-4">
      {onUndo && (
        <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo" className={`${btn} size-12 text-mute disabled:opacity-30`}>
          <ArrowCounterClockwise size={18} />
        </button>
      )}
      <button type="button" onClick={() => onDecide('pass')} aria-label="Pass" className={`${btn} size-16 text-clay`}>
        <X size={26} weight="bold" />
      </button>
      {allowBag && (
        <button type="button" onClick={() => onDecide('bag')} aria-label="Add to bag" className={`${btn} size-12 text-ink`}>
          <Bag size={20} weight="bold" />
        </button>
      )}
      <button type="button" onClick={() => onDecide('love')} aria-label="Love" className={`${btn} size-16 text-olive`}>
        <Heart size={26} weight="fill" />
      </button>
    </div>
  )
}

function MatchModal({ p, onClose, onBag }: { p: Product; onClose: () => void; onBag: () => void }) {
  const ones = lastOnes(p)
  return (
    <motion.div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink/90 px-6 text-center text-bone backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal aria-label="It's a match">
      {Array.from({ length: 14 }).map((_, k) => (
        <motion.span
          key={k}
          className="pointer-events-none absolute text-clay"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: Math.cos(k) * (160 + (k % 4) * 40), y: Math.sin(k) * (160 + (k % 3) * 40) - 60, opacity: 0, scale: 1.2, rotate: k * 25 }}
          transition={{ duration: 1.6, ease, delay: 0.15 }}
        >
          <Heart size={18 + (k % 3) * 8} weight="fill" />
        </motion.span>
      ))}
      <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="display text-7xl italic md:text-8xl">
        It’s a match
      </motion.p>
      <p className="mt-3 max-w-xs text-sm text-bone/75">You love it, and it is almost gone. {ones.length ? `There is 1 left in ${ones.join(', ')}.` : `Only ${totalLeft(p)} pieces left.`}</p>
      <div className="mt-8 flex items-center">
        <motion.span initial={{ x: -60, rotate: -14 }} animate={{ x: 10, rotate: -8 }} transition={{ duration: 0.8, ease }} className="display grid size-28 place-items-center rounded-full bg-sand text-3xl text-ink ring-4 ring-ink">
          You
        </motion.span>
        <motion.span initial={{ x: 60, rotate: 14 }} animate={{ x: -10, rotate: 8 }} transition={{ duration: 0.8, ease }} className="block size-28 overflow-hidden rounded-full ring-4 ring-ink">
          <Photo id={p.images[0]} alt={p.name} sizes="112px" widths={[240]} className="h-full w-full" />
        </motion.span>
      </div>
      <p className="mt-4 font-semibold">{p.name}</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
        <button type="button" onClick={onBag} className="rounded-full bg-bone py-4 text-sm font-semibold text-ink">Put it in my bag</button>
        <button type="button" onClick={onClose} className="rounded-full border border-white/25 py-4 text-sm font-semibold">Keep swiping</button>
      </div>
    </motion.div>
  )
}

function SizeSheet({ p, onClose }: { p: Product; onClose: () => void }) {
  const add = useShop((s) => s.add)
  const inv = stock(p)
  return (
    <>
      <motion.div className="fixed inset-0 z-[90] bg-ink/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div role="dialog" aria-modal aria-label="Pick a size" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.45, ease }} className="fixed inset-x-0 bottom-0 z-[95] mx-auto max-w-md rounded-t-[28px] bg-paper p-6">
        <div className="flex items-center gap-4">
          <Photo id={p.images[0]} alt="" sizes="64px" widths={[160]} className="size-16 rounded-2xl" />
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-mute">{kes(p.price)} · pick your size</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {p.sizes.map((s) => (
            <button
              key={s}
              type="button"
              disabled={!inv[s]}
              onClick={() => {
                add(p.id, p.colours[0].name, s)
                onClose()
              }}
              className="relative rounded-xl border border-line py-3 text-sm font-semibold transition hover:border-ink disabled:text-mute/40 disabled:line-through"
            >
              {s}
              {inv[s] === 1 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-clay" />}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full py-3 text-sm text-mute">Not now</button>
      </motion.div>
    </>
  )
}

/* ═════════════ Taste profile ═════════════ */
const PERSONAS = [
  { k: 'Coastal minimalist', test: (c: string) => ['Chalk white', 'Oat', 'Sand', 'Sky'].includes(c), d: 'Clean whites and sand, cut loose. You dress like the weekend never ends.' },
  { k: 'Garden romantic', test: (c: string) => ['Sage', 'Olive', 'Blush', 'Lilac'].includes(c), d: 'Soft greens and petal tones. Effortless, a little poetic.' },
  { k: 'City tailored', test: (c: string) => ['Charcoal', 'Navy', 'Stone'].includes(c), d: 'Dark, sharp and considered. Linen that means business.' },
  { k: 'Sun seeker', test: (c: string) => ['Terracotta', 'Rust', 'Lemon'].includes(c), d: 'Warm, bold colour. You are the brightest person at the party.' },
]

function TasteProfile({ history }: { history: { p: Product; v: Verdict }[] }) {
  const liked = history.filter((h) => h.v !== 'pass').map((h) => h.p)
  const colours = liked.flatMap((p) => p.colours.slice(0, 1).map((c) => c.name))
  const scores = PERSONAS.map((x) => ({ ...x, n: colours.filter((c) => x.test(c)).length })).sort((a, b) => b.n - a.n)
  const top = scores[0]
  const cats = Object.entries(liked.reduce<Record<string, number>>((a, p) => ((a[p.category] = (a[p.category] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1])
  const pct = liked.length ? Math.round((top.n / liked.length) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mx-auto max-w-3xl">
      <div className="rounded-[32px] bg-ink p-8 text-center text-bone md:p-12">
        <p className="eyebrow text-bone/60">Your linen personality</p>
        <p className="display mt-4 text-6xl md:text-8xl">{liked.length ? top.k : 'Still deciding'}</p>
        <p className="mx-auto mt-4 max-w-md text-bone/75">{liked.length ? top.d : 'You passed on everything. Try another house, or come back after Friday’s drop.'}</p>
        {liked.length > 0 && (
          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-left">
            <Stat k={`${liked.length}`} v="pieces loved" />
            <Stat k={`${pct}%`} v={top.k.toLowerCase()} />
            <Stat k={cats[0]?.[0] ?? '—'} v="your go to" />
          </div>
        )}
      </div>
      {liked.length > 0 && (
        <>
          <p className="mt-10 text-sm font-semibold">Your matches</p>
          <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-5">
            {liked.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group">
                <Photo id={p.images[0]} alt={p.name} sizes="20vw" widths={[300]} className="aspect-[4/5] w-full rounded-2xl transition-transform group-hover:scale-[1.03]" />
                <p className="mt-1.5 truncate text-xs font-semibold">{p.name}</p>
              </Link>
            ))}
          </div>
        </>
      )}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/wishlist" className="rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone">See my wishlist</Link>
        <Link to="/drop" className="rounded-full border border-ink px-6 py-3.5 text-sm font-semibold">Get Friday’s drop first</Link>
      </div>
    </motion.div>
  )
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="display truncate text-2xl capitalize">{k}</p>
      <p className="mt-0.5 text-[11px] text-bone/60">{v}</p>
    </div>
  )
}

/* ═════════════ Couples ═════════════ */
function Couple() {
  const deck = useMemo(() => shuffle(products.filter((p) => !isSold(p) && p.branch !== 'kids'), 11).slice(0, 10), [])
  const [names, setNames] = useState({ a: '', b: '' })
  const [phase, setPhase] = useState<'names' | 'a' | 'handoff' | 'b' | 'result'>('names')
  const [i, setI] = useState(0)
  const [likes, setLikes] = useState<{ a: string[]; b: string[] }>({ a: [], b: [] })
  const A = names.a.trim() || 'Partner one'
  const B = names.b.trim() || 'Partner two'

  const decide = useCallback(
    (v: Verdict) => {
      const who = phase === 'a' ? 'a' : 'b'
      const p = deck[i]
      if (!p) return
      if (v !== 'pass') setLikes((l) => ({ ...l, [who]: [...l[who], p.id] }))
      if (i + 1 >= deck.length) {
        setI(0)
        setPhase(phase === 'a' ? 'handoff' : 'result')
      } else setI(i + 1)
    },
    [deck, i, phase],
  )

  if (phase === 'names') {
    return (
      <div className="mx-auto max-w-md rounded-[28px] bg-paper p-6 text-center md:p-8">
        <Users size={32} className="mx-auto" />
        <p className="display mt-4 text-4xl">Shop together</p>
        <p className="mt-2 text-sm text-mute">You each swipe the same {deck.length} looks on this phone, then we reveal the ones you both love.</p>
        <div className="mt-6 grid gap-3 text-left">
          <input value={names.a} onChange={(e) => setNames({ ...names, a: e.target.value })} placeholder="Your name" aria-label="Your name" className="rounded-2xl border border-line bg-bone px-4 py-3.5 text-sm outline-none focus:border-ink" />
          <input value={names.b} onChange={(e) => setNames({ ...names, b: e.target.value })} placeholder="Their name" aria-label="Their name" className="rounded-2xl border border-line bg-bone px-4 py-3.5 text-sm outline-none focus:border-ink" />
        </div>
        <button type="button" onClick={() => setPhase('a')} className="mt-6 w-full rounded-full bg-ink py-4 text-sm font-semibold text-bone">Start swiping</button>
      </div>
    )
  }

  if (phase === 'handoff') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto flex max-w-md flex-col items-center rounded-[28px] bg-ink p-10 text-center text-bone">
        <motion.span animate={{ x: [0, 40, 0], rotate: [0, 12, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <ArrowsLeftRight size={40} />
        </motion.span>
        <p className="display mt-6 text-5xl">Pass the phone to {B}</p>
        <p className="mt-3 text-sm text-bone/70">{A} loved {likes.a.length} of {deck.length}. No peeking at their picks.</p>
        <button type="button" onClick={() => setPhase('b')} className="mt-8 w-full rounded-full bg-bone py-4 text-sm font-semibold text-ink">I am {B}, start</button>
      </motion.div>
    )
  }

  if (phase === 'result') {
    const both = deck.filter((p) => likes.a.includes(p.id) && likes.b.includes(p.id))
    const score = Math.round((both.length / Math.max(1, new Set([...likes.a, ...likes.b]).size)) * 100)
    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-mute">{A} and {B}</p>
        <p className="display mt-3 text-6xl md:text-8xl">
          {both.length ? <>You matched on <span className="italic text-clay">{both.length}</span></> : 'Opposites attract'}
        </p>
        <p className="mt-3 text-mute">{both.length ? `Style compatibility ${score}%.` : 'No shared picks this time. Try another round after Friday’s drop.'}</p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {both.map((p, k) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20, rotate: k % 2 ? 3 : -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.2 + k * 0.1, duration: 0.6, ease }}>
              <Link to={`/product/${p.slug}`} className="block text-left">
                <Photo id={p.images[1]} alt={p.name} sizes="25vw" widths={[300, 500]} className="aspect-[3/4] w-full rounded-2xl" />
                <p className="mt-2 truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-mute">{branches[p.branch].house} · {kes(p.price)}</p>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/family" className="rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bone">Build a matching look</Link>
          <button type="button" onClick={() => { setLikes({ a: [], b: [] }); setPhase('a') }} className="rounded-full border border-ink px-6 py-3.5 text-sm font-semibold">Play again</button>
        </div>
      </motion.div>
    )
  }

  const who = phase === 'a' ? A : B
  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 rounded-full bg-oat px-4 py-2 text-sm font-semibold">{who} is swiping</p>
      <Deck key={phase} cards={deck.slice(i, i + 3)} onDecide={decide} progress={`${i + 1} / ${deck.length}`} allowBag={false} />
      <Controls onDecide={decide} allowBag={false} />
    </div>
  )
}
