import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Clock, FacebookLogo, InstagramLogo, MapPin, Phone, WhatsappLogo } from '@phosphor-icons/react'
import { branches, products, store, whatsapp, type Branch } from '../data/catalog'
import { useShop } from '../store/shop'
import { U } from '../lib/img'
import { ease, Photo, ProductCard, Reveal, SplitHeading } from '../components/ui'

export function Wishlist() {
  const ids = useShop((s) => s.wishlist)
  const items = products.filter((p) => ids.includes(p.id))
  useEffect(() => {
    document.title = 'Wishlist | All About Linen'
  }, [])
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8 md:pt-16">
      <SplitHeading as="h1" text="Your wishlist" className="display text-6xl md:text-8xl" />
      <p className="mt-3 text-mute">{items.length ? `${items.length} saved pieces. They stay here on this device.` : 'Tap the heart on any piece to save it here.'}</p>
      {items.length === 0 ? (
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {(['men', 'women', 'kids'] as Branch[]).map((k) => (
            <Link key={k} to={`/shop/${k}`} className="group flex items-center justify-between rounded-[24px] bg-paper p-6 transition hover:bg-oat">
              <span>
                <span className="eyebrow block text-mute">Browse</span>
                <span className="display text-4xl">{branches[k].house}</span>
              </span>
              <ArrowUpRight size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Visit() {
  useEffect(() => {
    document.title = 'Visit the boutique | All About Linen'
  }, [])
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8 md:pt-16">
      <p className="eyebrow text-mute">The boutique</p>
      <SplitHeading as="h1" text="Three houses under one roof." className="display mt-3 max-w-5xl text-6xl md:text-[8vw]" />
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <div className="grid aspect-[4/3] grid-cols-3 gap-3 overflow-hidden rounded-[32px] bg-oat p-3">
            {[U.boutique, U.rackNeutral, U.foldedStack, U.rackBoutique, U.hangers, U.rackWindow].map((g, i) => (
              <motion.div key={g} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.8, ease }} className="overflow-hidden rounded-[22px]">
                <Photo id={g} alt="Inside the All About Linen boutique" sizes="(min-width: 1024px) 20vw, 33vw" className="h-full w-full" />
              </motion.div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-4">
          <InfoRow icon={<MapPin size={22} />} title={store.shop} body={`${store.city}, Kenya. Take the lift to the third floor and turn left.`} />
          <InfoRow icon={<Clock size={22} />} title="Opening hours" body={store.hours} />
          <InfoRow icon={<Phone size={22} />} title={store.phoneDisplay} body="Calls and WhatsApp, every day the shop is open." />
          <div className="mt-2 flex flex-wrap gap-3">
            <a href={whatsapp('Hi, I would like to visit the shop.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-semibold text-bone">
              <WhatsappLogo size={18} weight="fill" /> Book a fitting
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=Platinum+Plaza+Nairobi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-ink px-6 py-4 text-sm font-semibold">
              Directions <ArrowUpRight size={14} />
            </a>
          </div>
        </Reveal>
      </div>

      <section className="mt-24">
        <SplitHeading text="Follow each house" className="display text-5xl md:text-7xl" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(['men', 'women', 'kids'] as Branch[]).map((k, i) => {
            const b = branches[k]
            return (
              <Reveal key={k} delay={i * 0.08}>
                <a href={b.instagram} target="_blank" rel="noopener noreferrer" className="group block rounded-[28px] p-8 transition hover:-translate-y-1" style={{ background: b.tint }}>
                  <InstagramLogo size={28} />
                  <p className="display mt-10 text-5xl">{b.house}</p>
                  <p className="mt-1 text-sm font-semibold">{b.handle}</p>
                  <p className="mt-4 text-sm text-ink/70">{b.blurb}</p>
                </a>
              </Reveal>
            )
          })}
        </div>
        <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 py-2 text-sm font-semibold underline underline-offset-4">
          <FacebookLogo size={18} /> Also on Facebook: AllaboutLinen
        </a>
      </section>
    </div>
  )
}

function InfoRow({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-[24px] bg-paper p-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-oat">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-mute">{body}</span>
      </span>
    </div>
  )
}

const LEGAL: Record<string, { title: string; sections: [string, string][] }> = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      ['What we collect', 'Your name, phone number, delivery address and, if you share it, your email. We need these to deliver your order and to contact you about it.'],
      ['How we use it', 'Only to process orders, arrange delivery and, if you opt in, to send news about new arrivals. We never sell your details.'],
      ['Your bag and wishlist', 'These are saved in your browser on this device so they are still there when you come back. Clearing your browser data removes them.'],
      ['Contact', `Questions about your data? Call or WhatsApp ${store.phoneDisplay}.`],
    ],
  },
  terms: {
    title: 'Terms of sale',
    sections: [
      ['Condition', 'All pieces are ex UK and graded before sale. Each listing describes the condition. Ask for real photos before you buy.'],
      ['Prices and payment', 'Prices are in Kenya shillings and include VAT where applicable. We accept M-Pesa, card and cash on pickup.'],
      ['Delivery', 'Nairobi deliveries ordered before 2pm usually arrive the same day. Countrywide courier takes one to three working days.'],
      ['Brands', 'We are not affiliated with the brands of the items we sell.'],
    ],
  },
  returns: {
    title: 'Exchanges and returns',
    sections: [
      ['Seven day exchanges', 'Exchange any unworn piece with its tag within seven days, at the shop or by courier.'],
      ['Refunds', 'If we cannot offer an exchange, we refund to M-Pesa within three working days.'],
      ['Faulty items', 'If something arrives with a fault we missed, we cover the courier both ways.'],
    ],
  },
}

export function Legal() {
  const { page = 'privacy' } = useParams()
  const c = LEGAL[page]
  useEffect(() => {
    if (c) document.title = `${c.title} | All About Linen`
  }, [c])
  if (!c) return <NotFound />
  return (
    <article className="mx-auto max-w-2xl px-4 pt-12 md:pt-16">
      <Link to="/" className="inline-flex items-center gap-2 py-2 text-sm text-mute hover:text-ink"><ArrowLeft size={14} /> Home</Link>
      <h1 className="display mt-6 text-6xl">{c.title}</h1>
      <p className="mt-2 text-xs text-mute">Sample policy. Review with the business before launch.</p>
      {c.sections.map(([h, p]) => (
        <section key={h} className="mt-10">
          <h2 className="text-lg font-semibold">{h}</h2>
          <p className="mt-2 text-mute">{p}</p>
        </section>
      ))}
    </article>
  )
}

export function NotFound() {
  useEffect(() => {
    document.title = 'Page not found | All About Linen'
  }, [])
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ rotate: -12, y: 40, opacity: 0 }} animate={{ rotate: -6, y: 0, opacity: 1 }} transition={{ duration: 1, ease }} className="w-40 overflow-hidden rounded-[24px] shadow-xl">
        <Photo id={U.hangers} alt="Empty wooden hangers" sizes="160px" className="aspect-[4/5] w-full" />
      </motion.div>
      <p className="display mt-10 text-[22vw] leading-none md:text-[12rem]">404</p>
      <p className="display text-4xl">This rail is empty.</p>
      <p className="mt-3 max-w-sm text-mute">The page you are after has moved or sold out. The rest of the shop is still here.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="rounded-full border border-ink px-6 py-3 text-sm font-semibold">Home</Link>
        <Link to="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bone">Shop all</Link>
      </div>
    </div>
  )
}
