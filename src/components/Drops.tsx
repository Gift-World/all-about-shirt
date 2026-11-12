import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, BellRinging, CalendarPlus, Check, Lightning } from '@phosphor-icons/react'
import { DROP_COUNT, DROP_NO, dropTeasers, nextDrop } from '../data/extras'
import { ease, Photo } from './ui'

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function useCountdown() {
  const now = useNow()
  const target = nextDrop(now)
  const diff = Math.max(0, target.getTime() - now.getTime())
  return {
    target,
    d: Math.floor(diff / 86400000),
    h: Math.floor(diff / 3600000) % 24,
    m: Math.floor(diff / 60000) % 60,
    s: Math.floor(diff / 1000) % 60,
  }
}

function Digit({ v }: { v: number }) {
  const str = String(v).padStart(2, '0')
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      {str.split('').map((ch, i) => (
        <span key={i} className="relative inline-block w-[0.62em] text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ch}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  )
}

export function Countdown({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const { d, h, m, s } = useCountdown()
  const parts = [
    { v: d, l: 'Days' },
    { v: h, l: 'Hours' },
    { v: m, l: 'Mins' },
    { v: s, l: 'Secs' },
  ]
  return (
    <div className={`flex ${size === 'lg' ? 'gap-3 md:gap-6' : 'gap-2'}`} role="timer" aria-label={`Next drop in ${d} days ${h} hours ${m} minutes`}>
      {parts.map((p, i) => (
        <div key={p.l} className="flex items-start gap-3 md:gap-6">
          <div className="text-center">
            <div className={`display leading-none ${size === 'lg' ? 'text-6xl sm:text-7xl md:text-9xl' : 'text-4xl'}`}>
              <Digit v={p.v} />
            </div>
            <p className={`mt-2 uppercase tracking-[0.2em] opacity-60 ${size === 'lg' ? 'text-[10px] md:text-xs' : 'text-[9px]'}`}>{p.l}</p>
          </div>
          {i < 3 && <span className={`display leading-none opacity-30 ${size === 'lg' ? 'text-5xl md:text-8xl' : 'text-3xl'}`}>:</span>}
        </div>
      ))}
    </div>
  )
}

/** Mock sign up for WhatsApp drop alerts, with an add to calendar file. */
export function NotifyForm({ dark = true, compact = false }: { dark?: boolean; compact?: boolean }) {
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle')
  const target = nextDrop()
  const ics = () => {
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const end = new Date(target.getTime() + 3600000)
    const body = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//All About Linen//Drops//EN', 'BEGIN:VEVENT',
      `UID:drop${DROP_NO}@allaboutlinen`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(target)}`, `DTEND:${f(end)}`,
      `SUMMARY:All About Linen · Drop ${String(DROP_NO).padStart(2, '0')}`,
      'DESCRIPTION:New ex UK linen for men\\, women and kids. One of each\\, first come first served.',
      'LOCATION:allaboutlinen.co.ke', 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`
  }

  if (state === 'done') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl p-5 ${dark ? 'bg-white/10' : 'bg-paper'}`} role="status">
        <p className="flex items-center gap-2 font-semibold">
          <Check size={18} weight="bold" /> You are on the list for Drop {String(DROP_NO).padStart(2, '0')}
        </p>
        <p className={`mt-1 text-sm ${dark ? 'text-bone/70' : 'text-mute'}`}>We will WhatsApp {phone} 30 minutes before the doors open, with a private early link.</p>
        <a href={ics()} download={`all-about-linen-drop-${DROP_NO}.ics`} className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${dark ? 'bg-bone text-ink' : 'bg-ink text-bone'}`}>
          <CalendarPlus size={16} /> Add to calendar
        </a>
      </motion.div>
    )
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        setState(/^(?:\+?254|0)(?:7|1)\d{8}$/.test(phone.replace(/\s+/g, '')) ? 'done' : 'error')
      }}
      className={compact ? '' : 'max-w-md'}
    >
      <div className={`flex rounded-full border p-1 ${state === 'error' ? 'border-clay' : dark ? 'border-white/25' : 'border-line bg-paper'}`}>
        <input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            setState('idle')
          }}
          inputMode="tel"
          autoComplete="tel"
          placeholder="WhatsApp number, 0712 345 678"
          aria-label="WhatsApp number for drop alerts"
          aria-invalid={state === 'error'}
          className={`min-w-0 flex-1 bg-transparent px-4 text-sm outline-none ${dark ? 'placeholder:text-bone/40' : 'placeholder:text-mute/60'}`}
        />
        <button className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition sm:px-5 ${dark ? 'bg-bone text-ink hover:bg-oat' : 'bg-ink text-bone hover:bg-ink-2'}`}>
          <BellRinging size={16} /> <span className="hidden sm:inline">Alert me</span>
        </button>
      </div>
      {state === 'error' && <p className="mt-2 px-4 text-xs text-blush">Use a Kenyan number like 0712 345 678.</p>}
    </form>
  )
}

/** Home page band: countdown, teasers and sign up. */
export function DropBand() {
  return (
    <section className="relative overflow-hidden bg-ink text-bone" aria-label="Next drop">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-clay" />
            </span>
            Drop {String(DROP_NO).padStart(2, '0')} · Friday 7pm · {DROP_COUNT} pieces
          </p>
          <h2 className="display mt-6 text-6xl md:text-8xl">
            One of each.
            <br />
            <span className="italic text-sand">Then it is gone.</span>
          </h2>
          <p className="mt-5 max-w-md text-bone/70">
            Every ex UK piece is a single find, so new stock lands as a weekly drop. Get the WhatsApp alert and shop 30 minutes before everyone else.
          </p>
          <div className="mt-8">
            <Countdown />
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <NotifyForm />
            <Link to="/drop" className="group inline-flex items-center gap-2 py-2 text-sm font-semibold">
              See the drop <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {dropTeasers.slice(0, 6).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease, delay: i * 0.07 }}
              className={`group relative aspect-[3/4] overflow-hidden rounded-2xl ${i % 3 === 1 ? 'translate-y-6' : ''}`}
            >
              <Photo id={t.id} alt="" sizes="(min-width: 1024px) 15vw, 30vw" widths={[300, 500]} className="h-full w-full scale-110 blur-md transition duration-700 group-hover:blur-sm" />
              <span className="absolute inset-0 bg-ink/30" />
              <span className="absolute inset-x-2 bottom-2 rounded-xl bg-ink/60 px-2 py-1.5 text-[10px] leading-tight backdrop-blur">
                <Lightning size={10} weight="fill" className="mr-1 inline text-sand" />
                {t.hint}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
