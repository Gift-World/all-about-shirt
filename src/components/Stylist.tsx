// Amani, the AI stylist, as a For You feed: one complete look per full screen frame.
// Swipe up for the next look, double tap to love it, ask for anything at the bottom.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Bag, CaretUp, Check, Heart, ShareNetwork, Sparkle, WhatsappLogo, X } from '@phosphor-icons/react'
import { branches, kes, whatsapp } from '../data/catalog'
import { isSold } from '../data/extras'
import { feed, forYou, think, type Frame } from '../lib/stylist'
import { useShop } from '../store/shop'
import { ease, Photo } from './ui'

const CHIPS = ['Beach wedding', 'Office, size L', 'Wide legs W30', 'Under 2k', 'For my son', 'Date night', 'All white']
const CHIP_PROMPT: Record<string, string> = {
  'Beach wedding': 'Beach wedding in Diani for him',
  'Office, size L': 'Office look for him in size L',
  'Wide legs W30': 'Wide leg pants for her size W30',
  'Under 2k': 'Something for her under 2k',
  'For my son': 'Smart look for my son age 10',
  'Date night': 'Date night outfit for him in black',
  'All white': 'All white look for him',
}

export function Stylist() {
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    let seen = false
    try {
      seen = !!sessionStorage.getItem('aal-nudge')
    } catch {
      /* ignore */
    }
    if (seen) return
    const show = setTimeout(() => {
      setNudge(true)
      try {
        sessionStorage.setItem('aal-nudge', '1')
      } catch {
        /* ignore */
      }
    }, 9000)
    const hide = setTimeout(() => setNudge(false), 17000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  useEffect(() => {
    // lock the page behind the feed on phones
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const lift = pathname.startsWith('/product/') ? 'bottom-24 lg:bottom-6' : pathname === '/match' ? 'bottom-5 max-md:hidden md:bottom-6' : 'bottom-5 md:bottom-6'

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ duration: 0.4, ease }} className={`fixed right-4 z-[60] flex flex-col items-end gap-2 md:right-6 ${lift}`}>
            <AnimatePresence>
              {nudge && (
                <motion.button
                  type="button"
                  onClick={() => setOpen(true)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-[230px] rounded-2xl rounded-br-md bg-paper px-4 py-3 text-left text-xs shadow-xl ring-1 ring-black/5"
                >
                  <b className="block font-semibold">Looks picked for you</b>
                  <span className="text-mute">Swipe through full outfits from today’s rail, or tell me the occasion.</span>
                </motion.button>
              )}
            </AnimatePresence>
            <button type="button" onClick={() => setOpen(true)} className="group relative flex items-center gap-2.5 rounded-full bg-ink p-2 text-sm font-semibold text-bone shadow-2xl transition hover:scale-[1.03] md:pr-5" aria-label="Open the AI stylist">
              <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-sand to-clay">
                <span className="absolute inset-0 animate-ping rounded-full bg-clay/40" />
                <Sparkle size={18} weight="fill" className="relative text-ink" />
              </span>
              <span className="hidden md:inline">Ask Amani</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[95] hidden bg-ink/40 md:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.section
              role="dialog"
              aria-modal
              aria-label="Amani, AI stylist"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.45, ease }}
              className="fixed inset-0 z-[96] flex flex-col overflow-hidden bg-ink text-bone md:inset-auto md:top-1/2 md:right-6 md:h-[min(760px,calc(100svh-48px))] md:w-[420px] md:-translate-y-1/2 md:rounded-[28px] md:shadow-[0_40px_80px_-20px_rgba(20,19,15,0.6)]"
            >
              <Feed onClose={() => setOpen(false)} />
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═════════════ The feed ═════════════ */
function Feed({ onClose }: { onClose: () => void }) {
  const opening = useMemo(forYou, [])
  const [frames, setFrames] = useState<Frame[]>(opening)
  const [query, setQuery] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  const ask = (raw: string) => {
    const q = raw.trim()
    if (!q || thinking) return
    setInput('')
    setThinking(true)
    setNote(null)
    setTimeout(() => {
      const f = feed(q, 6)
      if (f.length) {
        setFrames(f)
        setQuery(q)
      } else {
        // no pieces for this one: answer in words and keep the current feed
        setNote(think(q, {}).text)
      }
      setThinking(false)
      setIndex(0)
      scroller.current?.scrollTo({ top: 0 })
    }, 750)
  }
  const reset = () => {
    setFrames(opening)
    setQuery(null)
    setNote(null)
    setIndex(0)
    scroller.current?.scrollTo({ top: 0 })
  }

  return (
    <>
      {/* top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-ink/70 to-transparent px-3 pt-[max(12px,env(safe-area-inset-top))] pb-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold">
          <button type="button" onClick={reset} className={`rounded-full px-3 py-1.5 transition ${query ? 'text-bone/60 hover:text-bone' : 'bg-bone/15'}`}>For you</button>
          {query && <span className="min-w-0 truncate rounded-full bg-bone/15 px-3 py-1.5">“{query}”</span>}
        </div>
        <span className="font-mono text-[11px] text-bone/60 tabular-nums">{Math.min(index + 1, frames.length)}/{frames.length}</span>
        <a href={whatsapp('Hi, I would like help from a stylist.')} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full hover:bg-bone/10" aria-label="Talk to a person on WhatsApp">
          <WhatsappLogo size={20} />
        </a>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-bone/10" aria-label="Close the stylist">
          <X size={20} />
        </button>
      </header>

      {/* frames */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          className="no-scrollbar absolute inset-0 snap-y snap-mandatory overflow-y-auto overscroll-contain"
          data-lenis-prevent
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollTop / Math.max(1, e.currentTarget.clientHeight)))}
        >
          {frames.map((f, k) => (
            <FrameView key={f.id} f={f} first={k === 0} hint={k === 0 && frames.length > 1} active={k === index} />
          ))}
        </div>

        <AnimatePresence>
          {thinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-center bg-ink/70 backdrop-blur-sm">
              <div className="text-center">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-sand to-clay">
                  <Sparkle size={24} weight="fill" className="text-ink" />
                </motion.span>
                <p className="mt-4 text-sm font-semibold">Amani is pulling looks from the rail…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {note && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-3 top-16 z-30 rounded-2xl bg-paper p-4 text-sm text-ink shadow-2xl">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sand to-clay"><Sparkle size={14} weight="fill" /></span>
                <p className="flex-1 leading-relaxed">{note}</p>
                <button type="button" onClick={() => setNote(null)} aria-label="Dismiss" className="text-mute"><X size={16} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ask bar */}
      <div className="relative z-20 border-t border-bone/10 bg-ink px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-2" data-lenis-prevent>
          {CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => ask(CHIP_PROMPT[c])} className="shrink-0 rounded-full border border-bone/20 px-3 py-1.5 text-xs font-semibold text-bone/85 transition hover:border-bone hover:text-bone">
              {c}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
          className="flex items-center gap-2 rounded-full bg-bone/10 p-1.5 pl-4 focus-within:ring-1 focus-within:ring-bone/40"
        >
          <Sparkle size={16} weight="fill" className="shrink-0 text-sand" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Amani the occasion, size, budget…"
            aria-label="Ask Amani for a look"
            className="min-w-0 flex-1 bg-transparent text-sm text-bone outline-none placeholder:text-bone/45"
          />
          <button type="submit" disabled={!input.trim() || thinking} aria-label="Get looks" className="grid size-9 shrink-0 place-items-center rounded-full bg-bone text-ink transition disabled:opacity-30">
            <ArrowUp size={16} weight="bold" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-bone/40">Demo AI stylist working from the real rail. Every piece is one of one.</p>
      </div>
    </>
  )
}

/* ═════════════ One frame = one complete look ═════════════ */
function FrameView({ f, first, hint, active }: { f: Frame; first: boolean; hint: boolean; active: boolean }) {
  const [focus, setFocus] = useState(0)
  const [burst, setBurst] = useState(0)
  const [more, setMore] = useState(false)
  const [bagged, setBagged] = useState(false)
  const wishlist = useShop((s) => s.wishlist)
  const lines = useShop((s) => s.lines)
  const add = useShop((s) => s.add)
  const notify = useShop((s) => s.notify)
  const lastTap = useRef(0)
  const main = f.products[focus] ?? f.products[0]
  const liked = f.products.every((p) => wishlist.includes(p.id))
  const available = f.products.filter((p) => !isSold(p))
  const inBag = available.every((p) => lines.some((l) => l.id === p.id))

  const love = (force?: boolean) => {
    const { wishlist: w } = useShop.getState()
    if (liked && !force) useShop.setState({ wishlist: w.filter((id) => !f.products.some((p) => p.id === id)) })
    else useShop.setState({ wishlist: [...new Set([...w, ...f.products.map((p) => p.id)])] })
  }
  const onTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      love(true)
      setBurst((b) => b + 1)
    }
    lastTap.current = now
  }
  const bagAll = () => {
    const todo = available.filter((p) => !lines.some((l) => l.id === p.id))
    if (!todo.length) return useShop.getState().openCart(true)
    todo.forEach((p) => add(p.id, p.colours[0].name, p.sizes[0]))
    setBagged(true)
    notify(todo.length > 1 ? `The full look is in your bag, ${kes(f.total)}` : `${todo[0].name} is in your bag`)
  }
  const share = () => {
    const text = `Look from All About Linen:\n${f.products.map((p) => `• ${p.name}, ${p.sizes[0]}, ${kes(p.price)} ${location.origin}/product/${p.slug}`).join('\n')}`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="relative h-full w-full snap-start snap-always overflow-hidden bg-ink-2" aria-label={`Look: ${f.products.map((p) => p.name).join(' and ')}`}>
      {/* the piece, full bleed */}
      <AnimatePresence initial={false}>
        <motion.div key={main.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: active ? 1.03 : 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.35 }, scale: { duration: 6, ease: 'linear' } }} onClick={onTap}>
          <Photo id={main.images[0]} alt={main.name} sizes="(min-width: 768px) 420px, 100vw" widths={[600, 1000]} priority={first} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />

      {/* double tap heart */}
      <AnimatePresence>
        {burst > 0 && (
          <motion.span key={burst} className="pointer-events-none absolute top-1/2 left-1/2 text-clay" initial={{ scale: 0.3, opacity: 0, x: '-50%', y: '-50%' }} animate={{ scale: [0.3, 1.25, 1], opacity: [0, 1, 0] }} transition={{ duration: 0.9, times: [0, 0.35, 1] }}>
            <Heart size={120} weight="fill" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* the rest of the look */}
      {f.products.length > 1 && (
        <div className="absolute top-20 right-3 flex flex-col gap-2">
          {f.products.map((p, k) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFocus(k)}
              aria-label={`Show ${p.name}`}
              aria-pressed={k === focus}
              className={`h-[84px] w-16 overflow-hidden rounded-xl ring-2 transition ${k === focus ? 'ring-bone' : 'opacity-70 ring-transparent hover:opacity-100'}`}
            >
              <Photo id={p.images[0]} alt="" sizes="64px" widths={[160]} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}

      {/* action rail */}
      <div className="absolute right-2.5 bottom-6 flex flex-col items-center gap-4">
        <Rail label={liked ? 'Loved' : 'Love'} onClick={() => love()} active={liked}>
          <Heart size={26} weight="fill" className={liked ? 'text-clay' : ''} />
        </Rail>
        <Rail label={inBag || bagged ? 'In bag' : f.products.length > 1 ? 'Bag look' : 'Bag it'} onClick={bagAll} disabled={!available.length}>
          {inBag || bagged ? <Check size={24} weight="bold" /> : <Bag size={24} weight="fill" />}
        </Rail>
        <Rail label="Share" onClick={share}>
          <ShareNetwork size={24} weight="fill" />
        </Rail>
        <Link to={`/product/${main.slug}`} className="flex flex-col items-center gap-1 text-[11px] font-semibold">
          <span className="block size-11 overflow-hidden rounded-full ring-2 ring-bone">
            <Photo id={main.images[2] ?? main.images[0]} alt="" sizes="44px" widths={[120]} className="h-full w-full" />
          </span>
          Details
        </Link>
      </div>

      {/* caption */}
      <div className="absolute inset-x-0 bottom-0 pr-20 pb-5 pl-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-sand to-clay"><Sparkle size={13} weight="fill" className="text-ink" /></span>
          Amani <span className="font-normal text-bone/60">· AI stylist</span>
        </p>
        <button type="button" onClick={() => setMore(!more)} className={`mt-2 block text-left text-[13px] leading-snug text-bone/90 ${more ? '' : 'line-clamp-3'}`}>
          {f.caption}
        </button>
        <ul className="mt-3 space-y-1.5">
          {f.products.map((p) => (
            <li key={p.id}>
              <Link to={`/product/${p.slug}`} className="inline-flex max-w-full items-center gap-2 rounded-full bg-bone/15 py-1 pr-3 pl-1 text-xs backdrop-blur-md transition hover:bg-bone/25">
                <span className="rounded-full bg-bone px-2 py-0.5 text-[10px] font-bold text-ink">{p.sizes[0]}</span>
                <span className="truncate font-semibold">{p.name}</span>
                <span className="shrink-0 text-bone/70">{kes(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-bone/60">
          {branches[main.branch].house} · one of one{f.products.length > 1 ? ` · full look ${kes(f.total)}` : ''}
        </p>
      </div>

      {hint && (
        <motion.span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 flex-col items-center text-[10px] text-bone/60" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <CaretUp size={14} /> Swipe for more looks
        </motion.span>
      )}
    </article>
  )
}

function Rail({ children, label, onClick, active, disabled }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active} className="flex flex-col items-center gap-1 text-[11px] font-semibold drop-shadow disabled:opacity-40">
      <motion.span whileTap={{ scale: 0.8 }} className="grid size-11 place-items-center rounded-full bg-ink/35 backdrop-blur-md">
        {children}
      </motion.span>
      {label}
    </button>
  )
}
