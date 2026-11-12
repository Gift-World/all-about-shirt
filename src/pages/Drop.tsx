import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { BellRinging, Eye, Lightning, ShoppingBag } from '@phosphor-icons/react'
import { Countdown, NotifyForm } from '../components/Drops'
import { ease, Photo, ProductCard, Reveal, SplitHeading } from '../components/ui'
import { currentDrop, DROP_COUNT, DROP_NO, dropTeasers, nextDrop } from '../data/extras'
import { products } from '../data/catalog'
import { SOLD_RECENTLY } from '../data/extras'

export function Drop() {
  useEffect(() => {
    document.title = `Drop ${String(DROP_NO).padStart(2, '0')} | All About Linen`
  }, [])
  const live = currentDrop()
  const sold = products.filter((p) => SOLD_RECENTLY.has(p.slug))
  const when = nextDrop().toLocaleString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Nairobi' })

  return (
    <div>
      <section className="relative overflow-hidden bg-ink pt-14 pb-20 text-bone md:pt-24">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-2 opacity-25 md:grid-cols-6" aria-hidden>
          {[...dropTeasers, ...dropTeasers].slice(0, 6).map((t, i) => (
            <Photo key={i} id={t.id} alt="" sizes="20vw" widths={[300]} className="h-full w-full scale-110 blur-2xl" />
          ))}
        </div>
        <div className="relative mx-auto max-w-[1440px] px-4 md:px-8">
          <p className="eyebrow text-bone/60">Next drop · {when}</p>
          <motion.h1 initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2, ease }} className="display mt-4 text-[26vw] leading-[0.8] md:text-[15vw]">
            Drop <span className="italic text-sand">{String(DROP_NO).padStart(2, '0')}</span>
          </motion.h1>
          <p className="mt-6 max-w-xl text-bone/75">
            {DROP_COUNT} hand picked ex UK pieces across All About Linen, Lady Linen and Kids Bayke. Most come in one size only. When a piece sells, it is gone.
          </p>
          <div className="mt-10">
            <Countdown />
          </div>
          <div className="mt-10">
            <NotifyForm />
            <p className="mt-3 text-xs text-bone/50">Alert list members get a private link 30 minutes early. No spam, one message per drop.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-20 md:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SplitHeading text="A peek at Friday" className="display text-5xl md:text-7xl" />
          <p className="max-w-sm text-sm text-mute">Hover or tap to peek. Full photos, prices and sizes go live at 7pm.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {dropTeasers.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.06}>
              <div className="group relative aspect-[4/5] overflow-hidden rounded-[24px]" tabIndex={0}>
                <Photo id={t.id} alt={`Teaser: ${t.hint}`} sizes="(min-width: 768px) 33vw, 50vw" className="h-full w-full scale-110 blur-xl transition-all duration-700 ease-out-expo group-hover:scale-105 group-hover:blur-[6px] group-focus:blur-[6px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-bone md:p-6">
                  <p className="eyebrow text-bone/70">{t.house}</p>
                  <p className="display mt-1 text-2xl md:text-3xl">{t.hint}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-bone/70">
                    <Eye size={14} /> Revealed Friday 7pm
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow inline-flex items-center gap-1.5 text-clay"><Lightning size={12} weight="fill" /> Live now</p>
            <SplitHeading text={`Drop ${String(DROP_NO - 1).padStart(2, '0')}, still on the rail`} className="display mt-2 text-5xl md:text-7xl" />
          </div>
          <Link to="/shop?sort=new" className="py-2 text-sm font-semibold underline underline-offset-4">Shop everything new</Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {live.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 6) * 0.05}>
              <ProductCard p={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <SplitHeading text="Gone this week" className="display text-4xl md:text-6xl" />
        <p className="mt-2 text-sm text-mute">Sold pieces stay here for 48 hours. Missed one? Ask us to find you another in the next drop.</p>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {sold.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-[28px] bg-line md:grid-cols-3">
          {[
            { icon: BellRinging, t: 'Join the alert list', d: 'Drop your WhatsApp number. We message you once, 30 minutes before the doors open.' },
            { icon: Eye, t: 'Shop the early link', d: 'Members get first pick of every one of a kind piece before it goes public at 7pm.' },
            { icon: ShoppingBag, t: 'Checkout fast', d: 'Pay with M-Pesa in seconds. Your piece is held for you the moment you pay.' },
          ].map(({ icon: Icon, t, d }, i) => (
            <div key={t} className="bg-paper p-8">
              <span className="font-mono text-xs text-mute">0{i + 1}</span>
              <Icon size={28} weight="light" className="mt-6" />
              <p className="display mt-6 text-3xl">{t}</p>
              <p className="mt-2 text-sm text-mute">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
