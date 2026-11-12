import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Sparkle, WhatsappLogo, X } from '@phosphor-icons/react'
import { branches, kes, whatsapp, type Branch, type Product } from '../data/catalog'
import { STARTERS, think, type Reply } from '../lib/stylist'
import { ease, Photo } from './ui'

type Msg = { id: number; role: 'me' | 'amani'; text: string; products?: Product[]; actions?: Reply['actions']; streaming?: boolean }

const GREETING: Msg = {
  id: 0,
  role: 'amani',
  text: 'Habari, I am Amani, the All About Linen stylist. Tell me the occasion, who it is for, your size and budget, and I will put a look together from the one of one pieces on the rail today.',
}

export function Stylist() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [nudge, setNudge] = useState(false)
  const ctx = useRef<{ lastBranches?: Branch[] }>({})
  const list = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()
  const busy = typing || msgs.some((m) => m.streaming)

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
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  const send = (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setInput('')
    setNudge(false)
    const id = Date.now()
    setMsgs((m) => [...m, { id, role: 'me', text: q }])
    setTyping(true)
    const r = think(q, ctx.current)
    if (r.branches) ctx.current.lastBranches = r.branches
    // think, then stream the answer word by word
    setTimeout(() => {
      setTyping(false)
      const words = r.text.split(' ')
      const mid = id + 1
      setMsgs((m) => [...m, { id: mid, role: 'amani', text: '', streaming: true }])
      let n = 0
      const tick = setInterval(() => {
        n += 2
        setMsgs((m) => m.map((x) => (x.id === mid ? { ...x, text: words.slice(0, n).join(' ') } : x)))
        if (n >= words.length) {
          clearInterval(tick)
          setMsgs((m) => m.map((x) => (x.id === mid ? { ...x, text: r.text, streaming: false, products: r.products, actions: r.actions } : x)))
        }
      }, 45)
    }, 700 + Math.min(900, q.length * 12))
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
                  <b className="block font-semibold">Dressing for something?</b>
                  <span className="text-mute">Tell me the occasion and I will style you in seconds.</span>
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
          <motion.section
            role="dialog"
            aria-label="AI stylist chat"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.45, ease }}
            className="fixed inset-0 z-[96] flex flex-col bg-paper md:inset-auto md:right-6 md:bottom-6 md:h-[640px] md:max-h-[calc(100svh-48px)] md:w-[420px] md:rounded-[28px] md:shadow-[0_40px_80px_-20px_rgba(20,19,15,0.5)] md:ring-1 md:ring-black/5"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-sand to-clay">
                <Sparkle size={18} weight="fill" className="text-ink" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">Amani</p>
                <p className="flex items-center gap-1.5 text-[11px] text-mute">
                  <span className="size-1.5 rounded-full bg-olive" /> AI stylist · knows today’s stock
                </p>
              </div>
              <a href={whatsapp('Hi, I would like help from a stylist.')} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full hover:bg-black/5" aria-label="Continue on WhatsApp">
                <WhatsappLogo size={20} />
              </a>
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-black/5" aria-label="Close chat">
                <X size={20} />
              </button>
            </header>

            <div ref={list} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" data-lenis-prevent aria-live="polite">
              {msgs.map((m) => (
                <Bubble key={m.id} m={m} onNav={() => setOpen(false)} />
              ))}
              {typing && (
                <div className="flex items-center gap-1.5 px-1" aria-label="Amani is typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="size-2 rounded-full bg-mute" animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
              {msgs.length === 1 && (
                <div className="flex flex-col items-start gap-2 pt-2">
                  {STARTERS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-2xl border border-line bg-bone px-3.5 py-2.5 text-left text-sm transition hover:border-ink">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="border-t border-line p-3"
            >
              <div className="flex items-center gap-2 rounded-full border border-line bg-bone p-1.5 pl-4 focus-within:border-ink">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Beach wedding, size L, under 3k…"
                  aria-label="Message Amani"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute/60"
                />
                <button type="submit" disabled={!input.trim() || busy} aria-label="Send" className="grid size-9 place-items-center rounded-full bg-ink text-bone transition disabled:opacity-30">
                  <ArrowUp size={16} weight="bold" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-mute">Demo stylist working from the real rail. Amani can make mistakes, so check sizes before you buy.</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}

function Bubble({ m, onNav }: { m: Msg; onNav: () => void }) {
  if (m.role === 'me') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-bone">{m.text}</p>
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-bone px-4 py-2.5 text-sm leading-relaxed">
        {m.text}
        {m.streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-ink/60 align-middle" />}
      </p>
      {m.products && m.products.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1" data-lenis-prevent>
          {m.products.map((p, i) => (
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
      {m.actions && m.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {m.actions.map((a) => (
            <Link key={a.to} to={a.to} onClick={onNav} className="rounded-full border border-ink px-3.5 py-2 text-xs font-semibold transition hover:bg-ink hover:text-bone">
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}
