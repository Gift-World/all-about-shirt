import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react'
import { ArrowRight, ArrowUpRight, Camera, Clock, InstagramLogo, MapPin, Moped, ShieldCheck, Star, WhatsappLogo } from '@phosphor-icons/react'
import { branches, bySlug, C, featured, igPost, products, reviews, store, whatsapp, type Branch } from '../data/catalog'
import { U } from '../lib/img'
import { ease, Magnetic, Photo, ProductCard, Reveal, SplitHeading, Tilt } from '../components/ui'
import type { RingItem } from '../three/LookRing'
import { DropBand } from '../components/Drops'
import { OCCASIONS } from '../data/extras'

const HeroCloth = lazy(() => import('../three/HeroCloth'))
const LookRing = lazy(() => import('../three/LookRing'))

export function Home() {
  useEffect(() => {
    document.title = 'All About Linen | Ex UK linen for men, women and kids in Nairobi'
  }, [])
  return (
    <>
      <Hero />
      <WordStream />
      <Houses />
      <Statement />
      <NewArrivals />
      <DropBand />
      <Lookbook />
      <Fabric />
      <FamilyTeaser />
      <MatchTeaser />
      <Shades />
      <Bestsellers />
      <Promises />
      <Reviews />
      <Visit />
      <Social />
    </>
  )
}

/* ═════════════ HERO · photo printed on 3D linen ═════════════ */
const CAMPAIGNS: { key: Branch | 'all'; id: string; title: string; sub: string; to: string }[] = [
  { key: 'all', id: U.wStrawHat, title: 'The linen edit', sub: `${products.filter((p) => !p.sold).length} pieces, one of each`, to: '/shop' },
  { key: 'men', id: branches.men.campaign, title: 'All About Linen', sub: `Men · Linen shirts and trousers from KES ${Math.min(...products.filter((p) => p.branch === 'men').map((p) => p.price)).toLocaleString('en-KE')}`, to: '/shop/men' },
  { key: 'women', id: branches.women.campaign, title: 'Lady Linen', sub: `Women · Wide legs and shirts from KES ${Math.min(...products.filter((p) => p.branch === 'women').map((p) => p.price)).toLocaleString('en-KE')}`, to: '/shop/women' },
  { key: 'kids', id: branches.kids.campaign, title: 'Kids Bayke', sub: `Kids · Linen for boys from KES ${Math.min(...products.filter((p) => p.branch === 'kids').map((p) => p.price)).toLocaleString('en-KE')}`, to: '/shop/kids' },
]
const SLIDE_MS = 5500

function Hero() {
  const [i, setI] = useState(0)
  const [pinned, setPinned] = useState(false)
  const [ready, setReady] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const scaleCanvas = useTransform(scrollYProgress, [0, 1], [1, 0.86])

  useEffect(() => {
    import('../three/HeroCloth').then((m) => m.preloadHero(CAMPAIGNS.map((c) => c.id)))
  }, [])
  useEffect(() => {
    if (pinned || !inView || !ready) return
    const t = setTimeout(() => setI((n) => (n + 1) % CAMPAIGNS.length), SLIDE_MS)
    return () => clearTimeout(t)
  }, [i, pinned, inView, ready])
  const onReady = useCallback(() => setReady(true), [])
  const c = CAMPAIGNS[i]

  return (
    <section ref={ref} className="relative -mt-16 h-[calc(100svh-32px)] min-h-[620px] overflow-hidden [@media(max-height:520px)]:min-h-[420px]" aria-label="Welcome">
      <motion.div style={{ y: yText, opacity: fade }} className="pointer-events-none absolute inset-0 flex flex-col justify-start px-4 pt-[16vh] md:justify-center md:px-8 md:pt-0" aria-hidden>
        <motion.p
          initial={{ y: 120, opacity: 0, rotate: 2 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease, delay: 0.15 }}
          className="display text-[26vw] leading-[0.8] md:text-[18.5vw]"
        >
          Breathe
        </motion.p>
        <motion.p
          initial={{ y: 120, opacity: 0, rotate: -2 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease, delay: 0.3 }}
          className="display self-end text-[26vw] leading-[0.8] italic text-clay md:text-[18.5vw]"
        >
          easy.
        </motion.p>
      </motion.div>

      {/* WebGL banner */}
      <motion.div
        style={{ scale: scaleCanvas }}
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -60 }}
        transition={{ duration: 1.6, ease }}
        className="absolute inset-x-0 top-16 bottom-44 md:top-14 md:bottom-10 md:left-[30%] md:right-[10%] [@media(max-height:520px)]:top-14 [@media(max-height:520px)]:bottom-2 [@media(max-height:520px)]:left-[48%] [@media(max-height:520px)]:right-0"
        data-cursor="Touch"
      >
        <Suspense fallback={null}>
          <HeroCloth image={c.id} active={inView} onReady={onReady} />
        </Suspense>
      </motion.div>
      {!ready && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[60%]" aria-hidden>
          <div className="h-[52vh] w-[40vh] animate-pulse rounded-sm bg-oat/70" />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 md:px-8 md:pb-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 0.8 }} className="max-w-sm">
            <h1 className="text-[15px] leading-snug font-semibold">Ex UK linen for men, women and little ones.</h1>
            <p className="mt-1 text-sm text-mute [@media(max-height:520px)]:hidden">Hand picked in Nairobi, checked piece by piece, delivered across Kenya by tonight.</p>
            <Magnetic className="mt-5">
              <Link to={c.to} className="group inline-flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-sm font-semibold text-bone transition hover:bg-ink-2">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={c.key} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.35, ease }}>
                    {c.key === 'all' ? 'Shop the edit' : `Shop ${branches[c.key].label.toLowerCase()}`}
                  </motion.span>
                </AnimatePresence>
                <span className="grid size-9 place-items-center rounded-full bg-bone text-ink transition-transform duration-500 group-hover:-rotate-45">
                  <ArrowRight size={16} />
                </span>
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease, delay: 1 }} className="w-full md:w-auto [@media(max-height:520px)]:hidden">
            <div className="mb-3 flex items-baseline justify-between gap-6 md:justify-end">
              <AnimatePresence mode="wait">
                <motion.p key={c.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }} className="text-right text-xs">
                  <span className="display mr-2 text-xl">{c.title}</span>
                  <span className="text-mute">{c.sub}</span>
                </motion.p>
              </AnimatePresence>
              <span className="font-mono text-[11px] text-mute">0{i + 1} / 0{CAMPAIGNS.length}</span>
            </div>
            <div className="flex gap-1.5" onMouseLeave={() => setPinned(false)}>
              {CAMPAIGNS.map((x, k) => (
                <button
                  key={x.key}
                  type="button"
                  onMouseEnter={() => {
                    setPinned(true)
                    setI(k)
                  }}
                  onFocus={() => {
                    setPinned(true)
                    setI(k)
                  }}
                  onClick={() => setI(k)}
                  aria-label={`Show ${x.title}`}
                  aria-pressed={k === i}
                  className="group relative flex-1 overflow-hidden rounded-full border border-ink/15 bg-paper/50 px-4 py-2 text-left text-xs font-semibold backdrop-blur-md transition hover:border-ink md:w-28 md:flex-none"
                >
                  <span className="relative z-10">{x.key === 'all' ? 'Edit' : branches[x.key].label}</span>
                  {k === i && (
                    <motion.span
                      key={`${i}-${pinned}`}
                      className="absolute inset-0 origin-left bg-oat"
                      initial={{ scaleX: pinned ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: pinned || !ready ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Word stream that skews with scroll speed ═════════════ */
function WordStream() {
  const { scrollY } = useScroll()
  const v = useVelocity(scrollY)
  const skew = useSpring(useTransform(v, [-2000, 0, 2000], [8, 0, -8]), { stiffness: 200, damping: 30 })
  const words = ['Breathable', 'Ex UK', 'Hand picked', 'Nairobi', 'Grade A', 'Made to last', 'Same day']
  return (
    <div className="overflow-hidden border-y border-line bg-paper py-5">
      <motion.div style={{ skewX: skew }} className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {[...words, ...words, ...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className={`display text-5xl md:text-7xl ${i % 2 ? 'italic text-clay' : ''}`}>{w}</span>
            <span className="size-3 rounded-full bg-ink/80" />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

/* ═════════════ Houses ═════════════ */
function Houses() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-36">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SplitHeading text="One fabric. Three houses." className="display max-w-3xl text-6xl md:text-[7.5rem]" />
        <Reveal className="max-w-sm text-mute">
          <p>All About Linen dresses the men, Lady Linen dresses the women, and Kids Bayke dresses the little ones. Same hand picked quality across all three.</p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3 md:gap-5">
        {(['men', 'women', 'kids'] as Branch[]).map((k, i) => (
          <HouseCard key={k} k={k} i={i} />
        ))}
      </div>
    </section>
  )
}

function HouseCard({ k, i }: { k: Branch; i: number }) {
  const b = branches[k]
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const count = products.filter((p) => p.branch === k).length
  return (
    <Reveal delay={i * 0.12} className={i === 1 ? 'md:mt-16' : ''}>
      <div ref={ref}>
        <Tilt max={6} className="rounded-[28px]">
          <Link to={`/shop/${k}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[28px]" style={{ transformStyle: 'preserve-3d' }} data-cursor="Enter">
            <motion.div style={{ y }} className="absolute -inset-[10%]">
              <Photo id={b.cover} alt={`${b.house} campaign`} sizes="(min-width: 768px) 33vw, 100vw" className="h-full w-full transition-transform duration-[1.6s] ease-out-expo group-hover:scale-[1.06]" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-bone md:p-7" style={{ transform: 'translateZ(60px)' }}>
              <p className="eyebrow text-bone/70">{b.label} · {count} pieces</p>
              <p className="display mt-2 text-5xl md:text-6xl">{b.house}</p>
              <p className="mt-2 max-h-0 max-w-xs overflow-hidden text-sm text-bone/85 opacity-0 transition-all duration-700 ease-out-expo group-hover:max-h-24 group-hover:opacity-100">
                {b.blurb}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                Enter the house <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </div>
            <span className="absolute top-5 left-5 rounded-full bg-paper/85 px-3 py-1 text-xs font-semibold backdrop-blur" style={{ transform: 'translateZ(40px)' }}>
              {b.handle}
            </span>
          </Link>
        </Tilt>
      </div>
    </Reveal>
  )
}

/* ═════════════ Statement with inline photos ═════════════ */
function Statement() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const tokens: (string | { img: string })[] = [
    'Linen', { img: U.fabBeige }, 'breathes', 'in', 'the', 'heat,', 'softens', { img: U.fabSwirl }, 'with', 'every', 'wash,', 'and', 'looks', 'better', 'the', 'more', 'you', { img: U.menCoast }, 'live', 'in', 'it.',
  ]
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-40">
      <div ref={ref}>
        <p className="eyebrow mb-8 text-mute">Why linen</p>
        <p className="display max-w-6xl text-[13vw] leading-[1] md:text-[6.6vw]">
          {tokens.map((t, i) =>
            typeof t === 'string' ? (
              <Word key={i} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} italic={t === 'breathes' || t === 'live'}>
                {t}
              </Word>
            ) : (
              <InlineImg key={i} id={t.img} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} />
            ),
          )}
        </p>
      </div>
    </section>
  )
}
function Word({ children, progress, range, italic }: { children: string; progress: MotionValue<number>; range: [number, number]; italic?: boolean }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  return (
    <motion.span style={{ opacity }} className={`mr-[0.22em] inline-block ${italic ? 'italic text-clay' : ''}`}>
      {children}
    </motion.span>
  )
}
function InlineImg({ id, progress, range }: { id: string; progress: MotionValue<number>; range: [number, number] }) {
  const w = useTransform(progress, range, ['0em', '1.7em'])
  const o = useTransform(progress, range, [0, 1])
  return (
    <motion.span style={{ width: w, opacity: o }} className="mr-[0.22em] inline-block h-[0.78em] overflow-hidden rounded-full align-[-0.06em]">
      <Photo id={id} alt="" sizes="200px" widths={[200, 400]} className="h-full w-[1.7em]" />
    </motion.span>
  )
}

/* ═════════════ New arrivals ═════════════ */
function NewArrivals() {
  const items = [...products].sort((a, b) => a.addedDaysAgo - b.addedDaysAgo).slice(0, 10)
  const [progress, setProgress] = useState(0)
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-6 px-4 md:px-8">
        <div>
          <p className="eyebrow text-mute">Just landed</p>
          <SplitHeading text="New this week" className="display mt-2 text-5xl md:text-8xl" />
        </div>
        <Link to="/shop?sort=new" className="group hidden items-center gap-2 py-2 text-sm font-semibold md:inline-flex">
          View all new in <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div
        onScroll={(e) => {
          const t = e.currentTarget
          setProgress(t.scrollLeft / Math.max(1, t.scrollWidth - t.clientWidth))
        }}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:gap-6 md:px-8"
        data-lenis-prevent-wheel
      >
        {items.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 5) * 0.06} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw] lg:w-[22vw]">
            <ProductCard p={p} priority={i < 4} />
          </Reveal>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-[1440px] px-4 md:px-8">
        <div className="h-px bg-line">
          <motion.div className="h-px origin-left bg-ink" animate={{ scaleX: 0.12 + progress * 0.88 }} transition={{ ease, duration: 0.4 }} />
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Lookbook · WebGL ring driven by scroll ═════════════ */
// Real pieces from the three houses, straight off the Instagram rail.
const RING: RingItem[] = [
  ...featured(11, 3).map((p) => ({ id: p.images[0], label: p.name, href: `/product/${p.slug}` })),
  { id: U.kHands, label: 'Kids Bayke', href: '/shop/kids' },
]

function Lookbook() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { margin: '200px' })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [front, setFront] = useState(0)
  const navigate = useNavigate()
  const p = bySlug(RING[front].href.replace('/product/', ''))
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-40%'])

  return (
    <section ref={ref} id="lookbook" className="relative h-[300vh] bg-ink text-bone" aria-label="Lookbook">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ y: titleY }} className="pointer-events-none absolute inset-x-0 top-[8vh] z-10 px-4 text-center md:px-8">
          <p className="eyebrow text-bone/50">The lookbook · Season 07</p>
          <p className="display mt-3 text-[15vw] leading-[0.85] md:text-[10vw]">
            Coast <span className="italic text-sand">to</span> city
          </p>
        </motion.div>

        <div className="absolute inset-0">
          {inView && (
            <Suspense fallback={null}>
              <LookRing items={RING} progress={scrollYProgress} active={inView} onFront={setFront} onSelect={(h) => navigate(h)} />
            </Suspense>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 px-4 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={front} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.45, ease }}>
              <p className="display text-3xl md:text-4xl">{RING[front].label}</p>
              <p className="mt-1 text-xs text-bone/60">
                {p ? `${branches[p.branch].house} · KES ${p.price.toLocaleString('en-KE')}` : 'Explore the house'}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-1 flex items-center gap-4 text-[11px] text-bone/50">
            <span className="font-mono">{String(front + 1).padStart(2, '0')} / {RING.length}</span>
            <span>Scroll or drag to turn · Tap to shop</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Fabric macro · scroll scrubbed zoom ═════════════ */
function Fabric() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const clip = useTransform(scrollYProgress, [0, 0.55], ['inset(22% 30% 22% 30% round 32px)', 'inset(0% 0% 0% 0% round 0px)'])
  const scale = useTransform(scrollYProgress, [0, 1], [1.35, 1])
  const textO = useTransform(scrollYProgress, [0.45, 0.65], [0, 1])
  const textY = useTransform(scrollYProgress, [0.45, 0.7], [60, 0])
  const stats = [
    { k: '100%', v: 'Natural flax fibre' },
    { k: '3×', v: 'Inspected before it hits the rail' },
    { k: '2 hrs', v: 'From order to ready at Shop 305' },
  ]
  return (
    <section ref={ref} className="relative h-[220vh]" aria-label="The fabric">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ clipPath: clip }} className="absolute inset-0">
          <motion.div style={{ scale }} className="h-full w-full">
            <Photo id={U.sunDrying} alt="White linen drying in the sun" sizes="100vw" widths={[800, 1400, 2000]} className="h-full w-full" />
          </motion.div>
          <div className="absolute inset-0 bg-ink/35" />
        </motion.div>
        <motion.div style={{ opacity: textO, y: textY }} className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-bone">
          <p className="eyebrow text-bone/70">Grade A, every piece</p>
          <p className="display mt-4 max-w-4xl text-6xl md:text-8xl">Checked thread by thread.</p>
          <div className="mt-12 grid w-full max-w-3xl grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.k}>
                <p className="display text-4xl md:text-6xl">{s.k}</p>
                <p className="mt-1 text-xs text-bone/75 md:text-sm">{s.v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═════════════ Dress the family teaser ═════════════ */
function FamilyTeaser() {
  const shots = [branches.men.cover, branches.women.cover, branches.kids.cover]
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-24 md:px-8 md:pt-36" aria-label="Dress the family">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative h-[420px] md:h-[560px]">
          {shots.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 60, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: [-6, 3, 8][i] }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 1.1, ease, delay: i * 0.12 }}
              className="absolute w-[46%] overflow-hidden rounded-[24px] shadow-2xl"
              style={{ left: `${[2, 27, 52][i]}%`, top: `${[6, 18, 2][i]}%`, zIndex: [1, 3, 2][i] }}
            >
              <Photo id={id} alt="" sizes="(min-width: 1024px) 22vw, 45vw" widths={[400, 700]} className="aspect-[3/4] w-full" />
            </motion.div>
          ))}
        </div>
        <div>
          <p className="eyebrow text-clay">Only at All About Linen</p>
          <SplitHeading text="Dress the whole family." className="display mt-3 text-6xl md:text-8xl" />
          <p className="mt-5 max-w-md text-mute">
            Pick the occasion and one shade. We match him, her and the little ones across our three houses, and take 10% off the family bundle.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <span key={o.id} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold">{o.label}</span>
            ))}
          </div>
          <Magnetic className="mt-8">
            <Link to="/family" className="group inline-flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-sm font-semibold text-bone transition hover:bg-ink-2">
              Build your family look
              <span className="grid size-9 place-items-center rounded-full bg-bone text-ink transition-transform duration-500 group-hover:-rotate-45">
                <ArrowRight size={16} />
              </span>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Linen Match teaser ═════════════ */
function MatchTeaser() {
  const cards = featured(3, 7)
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-24 md:px-8 md:pt-36" aria-label="Linen Match">
      <div className="grid items-center gap-12 overflow-hidden rounded-[36px] bg-oat px-6 py-14 md:px-14 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="eyebrow text-clay">New · Linen Match</p>
          <SplitHeading text="Swipe right on linen." className="display mt-3 text-6xl md:text-8xl" />
          <p className="mt-5 max-w-md text-ink/70">
            Love it, pass it, or bag it in one flick. Play couples mode to find the looks you both love, and we learn your style as you swipe.
          </p>
          <Magnetic className="mt-8">
            <Link to="/match" className="group inline-flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-sm font-semibold text-bone">
              Start swiping
              <span className="grid size-9 place-items-center rounded-full bg-bone text-ink transition-transform duration-500 group-hover:-rotate-45">
                <ArrowRight size={16} />
              </span>
            </Link>
          </Magnetic>
        </div>
        <div className="relative order-1 mx-auto h-[440px] w-full max-w-[300px] lg:order-2" aria-hidden>
          {cards.map((p, i) => (
            <motion.div
              key={p.id}
              className="absolute inset-0 overflow-hidden rounded-[28px] shadow-2xl"
              initial={{ rotate: 0, x: 0 }}
              whileInView={{ rotate: [-10, 6, 0][i], x: [-40, 40, 0][i], y: [16, 8, 0][i] }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, ease, delay: 0.2 + i * 0.1 }}
              animate={i === 2 ? { x: [0, 26, 0, -26, 0], rotate: [0, 6, 0, -6, 0] } : undefined}
              style={{ zIndex: i }}
            >
              <Photo id={p.images[1]} alt="" sizes="300px" widths={[400]} className="h-full w-full" />
              {i === 2 && (
                <>
                  <span className="display absolute top-8 left-5 -rotate-12 rounded-xl border-4 border-olive bg-bone/30 px-3 text-4xl text-olive">LOVE</span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-5 pt-16 text-bone">
                    <span className="display block text-3xl">{p.name}</span>
                    <span className="text-sm">KES {p.price.toLocaleString('en-KE')}</span>
                  </span>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Shades (real fabric swatches) ═════════════ */
function Shades() {
  const shades = [
    { id: U.fabWhite, c: C.white },
    { id: U.fabBeige, c: C.oat },
    { id: U.fabSwirl, c: C.sand },
    { id: U.fabSage, c: C.sage },
    { id: U.fabPeach, c: C.blush },
    { id: U.fabSky, c: C.sky },
  ]
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 md:px-8 md:py-32">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SplitHeading text="Shop by shade" className="display text-5xl md:text-8xl" />
        <p className="max-w-xs text-sm text-mute">Six natural tones that sit at the heart of every house. Tap a swatch to see every piece in it.</p>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-5">
        {shades.map((s, i) => (
          <Reveal key={s.c.name} delay={i * 0.06}>
            <Link to={`/shop?colour=${encodeURIComponent(s.c.name)}`} className="group block" data-cursor="Shop">
              <div className="relative aspect-[3/4] overflow-hidden rounded-full transition-transform duration-700 ease-out-expo group-hover:-translate-y-3">
                <Photo id={s.id} alt={`${s.c.name} linen`} sizes="(min-width: 768px) 16vw, 33vw" widths={[300, 600]} className="h-full w-full transition-transform duration-[1.4s] ease-out-expo group-hover:scale-110" />
                <span className="absolute inset-0 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0" style={{ background: s.c.hex, opacity: 0.25 }} />
              </div>
              <p className="mt-3 text-center text-sm font-semibold">{s.c.name}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ═════════════ Bestsellers ═════════════ */
function Bestsellers() {
  const list = featured(4, 15)
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-8">
      <div className="flex items-end justify-between">
        <SplitHeading text="Still on the rail" className="display text-5xl md:text-8xl" />
        <Link to="/shop" className="group hidden items-center gap-2 py-2 text-sm font-semibold md:inline-flex">
          Shop all {products.filter((p) => !p.sold).length} pieces <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {list.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.07} className={i % 2 ? 'md:translate-y-12' : ''}>
            <ProductCard p={p} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ═════════════ Promises ═════════════ */
function Promises() {
  const items = [
    { icon: ShieldCheck, k: 'Grade A only', v: 'Every ex UK piece is inspected for fabric, seams and buttons before it reaches the rail.' },
    { icon: Camera, k: 'Real photos first', v: 'Ask on WhatsApp and get photos and exact measurements of the actual piece.' },
    { icon: Moped, k: 'Same day Nairobi', v: 'Order by 2pm for delivery the same evening. Countrywide in one to three days.' },
    { icon: Clock, k: '7 day exchanges', v: 'Wrong size? Swap it within seven days at the shop or by courier.' },
  ]
  return (
    <section className="mx-auto mt-32 max-w-[1440px] px-4 md:px-8">
      <div className="grid gap-px overflow-hidden rounded-[28px] bg-line md:grid-cols-4">
        {items.map(({ icon: Icon, k, v }, i) => (
          <Reveal key={k} delay={i * 0.08} className="group bg-paper p-8 transition-colors duration-500 hover:bg-oat">
            <Icon size={28} weight="light" className="transition-transform duration-500 group-hover:-rotate-12" />
            <p className="display mt-8 text-3xl">{k}</p>
            <p className="mt-2 text-sm text-mute">{v}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ═════════════ Reviews ═════════════ */
function Reviews() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-4 md:flex-row md:items-end md:px-8">
        <SplitHeading text="Worn and loved across Kenya" className="display max-w-3xl text-5xl md:text-8xl" />
        <Reveal className="flex items-center gap-4">
          <p className="display text-7xl">4.8</p>
          <div className="text-sm">
            <span className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} weight="fill" />)}
            </span>
            <p className="mt-1 text-mute">from 2,137 reviews</p>
          </div>
        </Reveal>
      </div>
      <div className="mt-12 overflow-hidden">
        <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
          {[...reviews, ...reviews].map((r, i) => (
            <figure key={i} className="w-[340px] shrink-0 rounded-[24px] bg-paper p-6 md:w-[420px]" aria-hidden={i >= reviews.length}>
              <span className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, k) => <Star key={k} size={12} weight="fill" />)}
              </span>
              <blockquote className="display mt-4 text-2xl leading-tight">“{r.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-oat text-sm font-semibold">
                  {r.name.split(' ').map((s) => s[0]).join('')}
                </span>
                <span className="text-sm">
                  <b className="block font-semibold">{r.name}</b>
                  <span className="text-mute">{r.where} · {r.house}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Visit ═════════════ */
function Visit() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-8">
      <div ref={ref} className="relative grid min-h-[640px] overflow-hidden rounded-[32px] text-bone lg:grid-cols-2">
        <motion.div style={{ y }} className="absolute -inset-[14%]">
          <Photo id={U.boutique} alt="Inside the boutique" sizes="100vw" widths={[800, 1400, 2000]} className="h-full w-full" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/10" />
        <div className="relative flex flex-col justify-between gap-10 p-8 md:p-14">
          <div>
            <p className="eyebrow text-bone/60">The boutique</p>
            <SplitHeading text="Come feel the fabric." className="display mt-3 text-5xl md:text-8xl" />
            <p className="mt-5 max-w-md text-bone/80">
              Try everything on at {store.shop}. Three houses, one room, and a team that knows linen better than anyone in town.
            </p>
          </div>
          <div className="grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 font-semibold"><MapPin size={16} /> {store.shop}</p>
              <p className="mt-1 text-bone/70">{store.city}, Kenya</p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold"><Clock size={16} /> Opening hours</p>
              <p className="mt-1 text-bone/70">{store.hours}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={whatsapp('Hi, I would like to book a fitting at the shop.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-3 text-sm font-semibold text-ink transition hover:bg-oat">
              <WhatsappLogo size={18} weight="fill" /> Book a fitting
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=Platinum+Plaza+Nairobi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-bone/40 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-bone/10">
              Get directions <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═════════════ Social grid ═════════════ */
function Social() {
  // the latest real posts from each house, linking straight to the post
  const tiles = (['men', 'women', 'kids', 'men', 'women', 'kids'] as Branch[]).map((b, i) => {
    const p = products.filter((x) => x.branch === b)[i < 3 ? 0 : 3]
    return { id: p.images[0], b, href: igPost(p) }
  })
  return (
    <section className="mx-auto mt-28 max-w-[1440px] px-4 md:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SplitHeading text="Follow the houses" className="display text-5xl md:text-7xl" />
        <div className="flex flex-wrap gap-2">
          {(['men', 'women', 'kids'] as Branch[]).map((k) => (
            <a key={k} href={branches[k].instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-ink hover:bg-paper">
              <InstagramLogo size={16} /> {branches[k].handle}
            </a>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-mute">{store.followers} people already follow {branches.men.handle}.</p>
      <div className="mt-8 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {tiles.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.05}>
            <a href={t.href} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-2xl" data-cursor="Open">
              <Photo id={t.id} alt={`${branches[t.b].house} on Instagram`} sizes="(min-width: 768px) 16vw, 33vw" widths={[300, 600]} className="h-full w-full transition-transform duration-[1.2s] ease-out-expo group-hover:scale-110" />
              <span className="absolute inset-0 grid place-items-center bg-ink/0 text-bone opacity-0 transition duration-500 group-hover:bg-ink/40 group-hover:opacity-100">
                <InstagramLogo size={28} />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

