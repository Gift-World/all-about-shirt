// Amani, the AI stylist. Two ways in:
//  · For you: a full screen feed, one complete look per frame (swipe up, double tap to love, comments).
//  · Chat: ask anything; Amani answers with cards, guides you, and can put the look in your bag and take you to checkout.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Bag, CaretUp, ChatCircleDots, Check, Heart, Play, ShareNetwork, Sparkle, WhatsappLogo, X } from '@phosphor-icons/react'
import { branches, delivery, kes, whatsapp, type Product } from '../data/catalog'
import { isSold } from '../data/extras'
import { feed, forYou, STARTERS, think, type Frame } from '../lib/stylist'
import { cartTotals, useShop } from '../store/shop'
import { CommentSheet, useCommentCount } from './Community'
import { ease, Photo } from './ui'

type Tab = 'feed' | 'chat'
type Msg = {
  id: number
  role: 'me' | 'amani'
  text: string
  products?: Product[]
  links?: { label: string; to: string }[]
  looks?: string // query that can open as a feed
  bagged?: boolean
  streaming?: boolean
}
const GREETING: Msg = {
  id: 0,
  role: 'amani',
  text: 'Habari, I am Amani. Tell me the occasion, who it is for, your size and budget. I will pull pieces from today’s rail, style them into a look, and put it in your bag when you are ready.',
}
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
const ORDER_INTENT = /\b(order|buy|checkout|check out|bag it|add (it|them|this|that|the look)|i'?ll take|i will take|take (it|them)|get (it|them))\b/i

/** Adds the available pieces to the bag (without opening the cart over the stylist) and returns what was added. */
function bagPieces(ps: Product[]) {
  const { lines, add } = useShop.getState()
  const todo = ps.filter((p) => !isSold(p) && !lines.some((l) => l.id === p.id))
  todo.forEach((p) => add(p.id, p.colours[0].name, p.sizes[0]))
  useShop.setState({ cartOpen: false })
  return todo
}

export function Stylist() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('feed')
  const [nudge, setNudge] = useState(false)
  const { pathname } = useLocation()
  const opening = useMemo(forYou, [])
  const [frames, setFrames] = useState<Frame[]>(opening)
  const [query, setQuery] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([GREETING])
  const [typing, setTyping] = useState(false)
  const ctx = useRef<{ lastBranches?: ReturnType<typeof think>['branches']; lastLook?: Product[] }>({})

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
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  /** Chat: answer with cards and guidance, or place the order when the customer says so. */
  const ask = (text: string) => {
    const q = text.trim()
    if (!q || typing) return
    setTab('chat')
    const id = Date.now()
    setMsgs((m) => [...m, { id, role: 'me', text: q }])
    setTyping(true)

    let reply: Omit<Msg, 'id' | 'role'>
    const last = ctx.current.lastLook
    if (ORDER_INTENT.test(q) && last?.length) {
      const added = bagPieces(last)
      const { subtotal } = cartTotals(useShop.getState().lines)
      reply = added.length
        ? {
            text: `Done. I put the ${added.map((p) => `${p.name.toLowerCase()} (${p.sizes[0]})`).join(' and ')} in your bag, ${kes(added.reduce((a, p) => a + p.price, 0))}. Your bag comes to ${kes(subtotal)}${subtotal >= delivery.freeOver ? ', so Nairobi delivery is free' : ''}. Pay with M-Pesa at checkout, or pick Try at home and pay only for what you keep.`,
            links: [{ label: 'Checkout now', to: '/checkout' }],
            bagged: true,
          }
        : { text: 'Those pieces are already in your bag. Ready when you are.', links: [{ label: 'Checkout now', to: '/checkout' }] }
    } else {
      const r = think(q, ctx.current)
      if (r.branches) ctx.current.lastBranches = r.branches
      const look = feed(q, 1)[0]?.products ?? r.products ?? []
      if (look.length) ctx.current.lastLook = look
      reply = {
        text: look.length ? `${r.text} Say “order it” and I will put the look in your bag.` : r.text,
        products: r.products?.length ? r.products : undefined,
        links: r.actions,
        looks: r.products?.length ? q : undefined,
      }
    }
    setTimeout(() => {
      setTyping(false)
      const mid = id + 1
      const words = reply.text.split(' ')
      setMsgs((m) => [...m, { id: mid, role: 'amani', text: '', streaming: true }])
      let n = 0
      const tick = setInterval(() => {
        n += 2
        setMsgs((m) => m.map((x) => (x.id === mid ? { ...x, text: words.slice(0, n).join(' ') } : x)))
        if (n >= words.length) {
          clearInterval(tick)
          setMsgs((m) => m.map((x) => (x.id === mid ? { ...x, ...reply, streaming: false } : x)))
        }
      }, 40)
    }, 650 + Math.min(800, q.length * 10))
  }

  /** Open a chat answer as full screen looks. */
  const watch = (q: string) => {
    const f = feed(q, 6)
    if (!f.length) return
    setFrames(f)
    setQuery(q)
    setTab('feed')
  }
  const bagFromChat = (ps: Product[]) => {
    const added = bagPieces(ps)
    setMsgs((m) => [
      ...m,
      {
        id: Date.now(),
        role: 'amani',
        text: added.length ? `In your bag: ${added.map((p) => `${p.name.toLowerCase()} (${p.sizes[0]})`).join(' and ')}. Anything else, or shall we check out?` : 'Already in your bag.',
        links: [{ label: 'Checkout now', to: '/checkout' }],
        bagged: added.length > 0,
      },
    ])
  }

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
                  <span className="text-mute">Swipe through full outfits from today’s rail, or chat with me.</span>
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
              <TopBar
                tab={tab}
                setTab={setTab}
                query={query}
                onReset={() => {
                  setFrames(opening)
                  setQuery(null)
                }}
                onClose={() => setOpen(false)}
              />
              {tab === 'feed' ? (
                <Feed frames={frames} onAsk={ask} onClose={() => setOpen(false)} />
              ) : (
                <Chat msgs={msgs} typing={typing} onAsk={ask} onWatch={watch} onBag={bagFromChat} onClose={() => setOpen(false)} />
              )}
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function TopBar({ tab, setTab, query, onReset, onClose }: { tab: Tab; setTab: (t: Tab) => void; query: string | null; onReset: () => void; onClose: () => void }) {
  const dark = tab === 'feed'
  const icon = `grid size-10 shrink-0 place-items-center rounded-full ${dark ? 'hover:bg-bone/10' : 'hover:bg-black/5'}`
  return (
    <header className={`z-20 flex items-center gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))] ${dark ? 'absolute inset-x-0 top-0 bg-gradient-to-b from-ink/75 to-transparent pb-6 text-bone' : 'relative border-b border-line bg-paper pb-2 text-ink'}`}>
      <div className={`flex shrink-0 rounded-full p-0.5 text-sm font-semibold ${dark ? 'bg-bone/10' : 'bg-bone'}`} role="tablist" aria-label="Stylist mode">
        <button type="button" role="tab" aria-selected={tab === 'feed'} onClick={() => (tab === 'feed' && query ? onReset() : setTab('feed'))} className={`rounded-full px-3 py-1.5 whitespace-nowrap transition ${tab === 'feed' ? 'bg-bone text-ink' : 'text-mute hover:text-ink'}`}>
          For you
        </button>
        <button type="button" role="tab" aria-selected={tab === 'chat'} onClick={() => setTab('chat')} className={`rounded-full px-3 py-1.5 whitespace-nowrap transition ${tab === 'chat' ? 'bg-ink text-bone' : 'text-bone/75 hover:text-bone'}`}>
          Chat
        </button>
      </div>
      <span className={`min-w-0 flex-1 truncate text-xs ${dark ? 'text-bone/70' : 'text-mute'}`}>{tab === 'feed' && query ? `“${query}”` : ''}</span>
      <a href={whatsapp('Hi, I would like help from a stylist.')} target="_blank" rel="noopener noreferrer" className={icon} aria-label="Talk to a person on WhatsApp">
        <WhatsappLogo size={20} />
      </a>
      <button type="button" onClick={onClose} className={icon} aria-label="Close the stylist">
        <X size={20} />
      </button>
    </header>
  )
}

function AskBar({ value, setValue, onSubmit, dark, disabled }: { value: string; setValue: (v: string) => void; onSubmit: () => void; dark?: boolean; disabled?: boolean }) {
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onSubmit()
        }}
        className={`flex items-center gap-2 rounded-full p-1.5 pl-4 ${dark ? 'bg-bone/10 focus-within:ring-1 focus-within:ring-bone/40' : 'border border-line bg-bone focus-within:border-ink'}`}
      >
        <Sparkle size={16} weight="fill" className={`shrink-0 ${dark ? 'text-sand' : 'text-clay'}`} />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Occasion, size, budget… or “order it”" aria-label="Ask Amani" className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${dark ? 'text-bone placeholder:text-bone/45' : 'placeholder:text-mute/60'}`} />
        <button type="submit" disabled={!value.trim() || disabled} aria-label="Ask" className={`grid size-9 shrink-0 place-items-center rounded-full transition disabled:opacity-30 ${dark ? 'bg-bone text-ink' : 'bg-ink text-bone'}`}>
          <ArrowUp size={16} weight="bold" />
        </button>
      </form>
      <p className={`mt-1.5 text-center text-[10px] ${dark ? 'text-bone/40' : 'text-mute'}`}>Demo AI stylist working from the real rail. Every piece is one of one.</p>
    </>
  )
}

/* ═════════════ For you feed ═════════════ */
function Feed({ frames, onAsk, onClose }: { frames: Frame[]; onAsk: (q: string) => void; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [comments, setComments] = useState<Product[] | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    setIndex(0)
  }, [frames])

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div ref={scroller} className="no-scrollbar absolute inset-0 snap-y snap-mandatory overflow-y-auto overscroll-contain" data-lenis-prevent onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollTop / Math.max(1, e.currentTarget.clientHeight)))}>
          {frames.map((f, k) => (
            <FrameView key={f.id} f={f} first={k === 0} hint={k === 0 && frames.length > 1} active={k === index} onComments={() => setComments(f.products)} onNav={onClose} />
          ))}
        </div>
        <span className="pointer-events-none absolute top-16 left-4 z-10 font-mono text-[10px] text-bone/60 tabular-nums">{Math.min(index + 1, frames.length)} / {frames.length}</span>
        <AnimatePresence>{comments && <CommentSheet products={comments} onClose={() => setComments(null)} />}</AnimatePresence>
      </div>
      <div className="relative z-20 border-t border-bone/10 bg-ink px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-2" data-lenis-prevent>
          {CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => onAsk(CHIP_PROMPT[c])} className="shrink-0 rounded-full border border-bone/20 px-3 py-1.5 text-xs font-semibold text-bone/85 transition hover:border-bone hover:text-bone">
              {c}
            </button>
          ))}
        </div>
        <AskBar
          value={input}
          setValue={setInput}
          onSubmit={() => {
            onAsk(input)
            setInput('')
          }}
          dark
        />
      </div>
    </>
  )
}

/* ═════════════ One frame = one complete look ═════════════ */
function FrameView({ f, first, hint, active, onComments, onNav }: { f: Frame; first: boolean; hint: boolean; active: boolean; onComments: () => void; onNav: () => void }) {
  const [focus, setFocus] = useState(0)
  const [burst, setBurst] = useState(0)
  const [more, setMore] = useState(false)
  const wishlist = useShop((s) => s.wishlist)
  const lines = useShop((s) => s.lines)
  const notify = useShop((s) => s.notify)
  const ids = useMemo(() => f.products.map((p) => p.id), [f])
  const commentCount = useCommentCount(ids)
  const lastTap = useRef(0)
  const main = f.products[focus] ?? f.products[0]
  const liked = f.products.every((p) => wishlist.includes(p.id))
  const available = f.products.filter((p) => !isSold(p))
  const inBag = available.length > 0 && available.every((p) => lines.some((l) => l.id === p.id))

  const love = (force?: boolean) => {
    const { wishlist: w } = useShop.getState()
    if (liked && !force) useShop.setState({ wishlist: w.filter((id) => !ids.includes(id)) })
    else useShop.setState({ wishlist: [...new Set([...w, ...ids])] })
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
    if (inBag) return useShop.getState().openCart(true)
    const added = bagPieces(available)
    if (added.length) notify(added.length > 1 ? `The full look is in your bag, ${kes(f.total)}` : `${added[0].name} is in your bag`)
  }
  const share = () => {
    const text = `Look from All About Linen:\n${f.products.map((p) => `• ${p.name}, ${p.sizes[0]}, ${kes(p.price)} ${location.origin}/product/${p.slug}`).join('\n')}`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="relative h-full w-full snap-start snap-always overflow-hidden bg-ink-2" aria-label={`Look: ${f.products.map((p) => p.name).join(' and ')}`}>
      <AnimatePresence initial={false}>
        <motion.div key={main.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: active ? 1.03 : 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.35 }, scale: { duration: 6, ease: 'linear' } }} onClick={onTap}>
          <Photo id={main.images[0]} alt={main.name} sizes="(min-width: 768px) 420px, 100vw" widths={[600, 1000]} priority={first} className="h-full w-full" />
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />

      <AnimatePresence>
        {burst > 0 && (
          <motion.span key={burst} className="pointer-events-none absolute top-1/2 left-1/2 text-clay" initial={{ scale: 0.3, opacity: 0, x: '-50%', y: '-50%' }} animate={{ scale: [0.3, 1.25, 1], opacity: [0, 1, 0] }} transition={{ duration: 0.9, times: [0, 0.35, 1] }}>
            <Heart size={120} weight="fill" />
          </motion.span>
        )}
      </AnimatePresence>

      {f.products.length > 1 && (
        <div className="absolute top-20 right-3 flex flex-col gap-2">
          {f.products.map((p, k) => (
            <button key={p.id} type="button" onClick={() => setFocus(k)} aria-label={`Show ${p.name}`} aria-pressed={k === focus} className={`h-[84px] w-16 overflow-hidden rounded-xl ring-2 transition ${k === focus ? 'ring-bone' : 'opacity-70 ring-transparent hover:opacity-100'}`}>
              <Photo id={p.images[0]} alt="" sizes="64px" widths={[160]} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}

      <div className="absolute right-2.5 bottom-6 flex flex-col items-center gap-3">
        <Rail label={liked ? 'Loved' : 'Love'} onClick={() => love()} active={liked}>
          <Heart size={26} weight="fill" className={liked ? 'text-clay' : ''} />
        </Rail>
        <Rail label={String(commentCount)} onClick={onComments}>
          <ChatCircleDots size={25} weight="fill" />
        </Rail>
        <Rail label={inBag ? 'In bag' : f.products.length > 1 ? 'Bag look' : 'Bag it'} onClick={bagAll} disabled={!available.length}>
          {inBag ? <Check size={24} weight="bold" /> : <Bag size={24} weight="fill" />}
        </Rail>
        <Rail label="Share" onClick={share}>
          <ShareNetwork size={24} weight="fill" />
        </Rail>
        <Link to={`/product/${main.slug}`} onClick={onNav} className="flex flex-col items-center gap-1 text-[11px] font-semibold">
          <span className="block size-11 overflow-hidden rounded-full ring-2 ring-bone">
            <Photo id={main.images[2] ?? main.images[0]} alt="" sizes="44px" widths={[120]} className="h-full w-full" />
          </span>
          Details
        </Link>
      </div>

      <div className={`absolute inset-x-0 bottom-0 pr-20 pl-4 ${hint ? 'pb-9' : 'pb-5'}`}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-sand to-clay"><Sparkle size={13} weight="fill" className="text-ink" /></span>
          Amani <span className="font-normal text-bone/60">· AI stylist</span>
        </p>
        <button type="button" onClick={() => setMore(!more)} className={`mt-2 w-full text-left text-[13px] leading-snug text-bone/90 ${more ? '' : 'line-clamp-3'}`}>
          {f.caption}
        </button>
        <ul className="mt-3 space-y-1.5">
          {f.products.map((p) => (
            <li key={p.id}>
              <Link to={`/product/${p.slug}`} onClick={onNav} className="inline-flex max-w-full items-center gap-2 rounded-full bg-bone/15 py-1 pr-3 pl-1 text-xs backdrop-blur-md transition hover:bg-bone/25">
                <span className="shrink-0 rounded-full bg-bone px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-ink">{p.sizes[0]}</span>
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
        <motion.span className="pointer-events-none absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[10px] font-semibold text-bone/70" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
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

/* ═════════════ Chat: cards, guidance and ordering ═════════════ */
function Chat({ msgs, typing, onAsk, onWatch, onBag, onClose }: { msgs: Msg[]; typing: boolean; onAsk: (q: string) => void; onWatch: (q: string) => void; onBag: (ps: Product[]) => void; onClose: () => void }) {
  const [input, setInput] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const busy = typing || msgs.some((m) => m.streaming)
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper text-ink">
      <div ref={list} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" data-lenis-prevent aria-live="polite">
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} onWatch={onWatch} onBag={onBag} onNav={onClose} />
        ))}
        {typing && (
          <div className="flex items-center gap-1.5 pl-9" aria-label="Amani is typing">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="size-2 rounded-full bg-mute" animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </div>
        )}
        {msgs.length === 1 && (
          <div className="flex flex-col items-start gap-2 pt-2 pl-9">
            {STARTERS.map((s) => (
              <button key={s} type="button" onClick={() => onAsk(s)} className="rounded-2xl border border-line bg-bone px-3.5 py-2.5 text-left text-sm transition hover:border-ink">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-line p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <AskBar
          value={input}
          setValue={setInput}
          onSubmit={() => {
            onAsk(input)
            setInput('')
          }}
          disabled={busy}
        />
      </div>
    </div>
  )
}

function Bubble({ m, onWatch, onBag, onNav }: { m: Msg; onWatch: (q: string) => void; onBag: (ps: Product[]) => void; onNav: () => void }) {
  const navigate = useNavigate()
  if (m.role === 'me') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-bone">{m.text}</p>
      </motion.div>
    )
  }
  const available = m.products?.filter((p) => !isSold(p)) ?? []
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-end gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sand to-clay"><Sparkle size={13} weight="fill" /></span>
        <p className="max-w-[88%] rounded-2xl rounded-bl-md bg-bone px-4 py-2.5 text-sm leading-relaxed">
          {m.text}
          {m.streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-ink/60 align-middle" />}
          {m.bagged && <Check size={14} weight="bold" className="ml-1 inline text-olive" />}
        </p>
      </div>
      {!m.streaming && available.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto pr-4 pb-1 pl-13" data-lenis-prevent>
          {available.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.4, ease }} className="w-36 shrink-0">
              <Link to={`/product/${p.slug}`} onClick={onNav} className="group block">
                <div className="relative overflow-hidden rounded-2xl">
                  <Photo id={p.images[0]} alt={p.name} sizes="144px" widths={[300]} className="aspect-[3/4] w-full transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-2 left-2 rounded-full bg-ink/85 px-2 py-0.5 text-[9px] font-semibold text-bone">{p.sizes[0]}</span>
                </div>
                <p className="mt-1.5 truncate text-xs font-semibold">{p.name}</p>
                <p className="text-[11px] text-mute">{branches[p.branch].label} · {kes(p.price)}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      {!m.streaming && (available.length > 0 || !!m.links?.length) && (
        <div className="flex flex-wrap gap-2 pl-9">
          {available.length > 0 && (
            <button type="button" onClick={() => onBag(available.slice(0, 2))} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-bone">
              <Bag size={13} weight="fill" /> Bag {available.length > 1 ? 'the look' : 'it'}
            </button>
          )}
          {m.looks && (
            <button type="button" onClick={() => onWatch(m.looks!)} className="inline-flex items-center gap-1.5 rounded-full border border-ink px-3.5 py-2 text-xs font-semibold transition hover:bg-ink hover:text-bone">
              <Play size={12} weight="fill" /> See as looks
            </button>
          )}
          {m.links?.map((a) => (
            <button
              key={a.to}
              type="button"
              onClick={() => {
                onNav()
                navigate(a.to)
              }}
              className="rounded-full border border-ink px-3.5 py-2 text-xs font-semibold transition hover:bg-ink hover:text-bone"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
