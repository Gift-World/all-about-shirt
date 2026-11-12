import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  Bag,
  FacebookLogo,
  Heart,
  InstagramLogo,
  MagnifyingGlass,
  MapPin,
  Minus,
  Plus,
  Trash,
  WhatsappLogo,
  X, LockSimple } from '@phosphor-icons/react'
import { branches, byId, delivery, kes, products, store, whatsapp, type Branch } from '../data/catalog'
import { cartTotals, useShop, maxQty } from '../store/shop'
import { U } from '../lib/img'
import { ease, Photo } from './ui'

const NAV: { to: string; label: string; branch?: Branch }[] = [
  { to: '/shop/men', label: 'Men', branch: 'men' },
  { to: '/shop/women', label: 'Women', branch: 'women' },
  { to: '/shop/kids', label: 'Kids', branch: 'kids' },
  { to: '/drop', label: 'Drops' },
  { to: '/family', label: 'Family' },
  { to: '/match', label: 'Match' },
  { to: '/visit', label: 'Visit us' },
]

/* ───────────── Header ───────────── */
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mega, setMega] = useState<Branch | null>(null)
  const [menu, setMenu] = useState(false)
  const { pathname, search } = useLocation()
  const lines = useShop((s) => s.lines)
  const wishCount = useShop((s) => s.wishlist.length)
  const openCart = useShop((s) => s.openCart)
  const openSearch = useShop((s) => s.openSearch)
  const { count } = cartTotals(lines)
  const overHero = pathname === '/' && !scrolled

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    setMenu(false)
    setMega(null)
  }, [pathname])

  return (
    <>
      <div className="bg-ink text-bone">
        <div className="no-scrollbar flex h-8 items-center overflow-hidden whitespace-nowrap">
          <div className="flex animate-marquee gap-12 pr-12 text-[11px] font-medium tracking-wide">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex gap-12" aria-hidden={k === 1}>
                <span>Free delivery in Nairobi over {kes(delivery.freeOver)}</span>
                <span>·</span>
                <span>Next drop Friday 7pm · one of each</span>
                <span>·</span>
                <span>Pay with M-Pesa, card or on pickup</span>
                <span>·</span>
                <span>Ex UK curated, checked piece by piece</span>
                <span>·</span>
                <span>Visit us at {store.shop}</span>
                <span>·</span>
                <span>Men · Women · Kids</span>
                <span>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-colors duration-500 ${
          overHero && !mega ? 'bg-transparent' : 'bg-bone/80 backdrop-blur-xl'
        }`}
        onMouseLeave={() => setMega(null)}
      >
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onMouseEnter={() => setMega(n.branch ?? null)}
                onFocus={() => setMega(n.branch ?? null)}
                className={({ isActive }) => {
                  const on = n.to.includes('?') ? pathname === '/shop' && search.includes('sort=new') : isActive
                  return `relative rounded-full px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-black/5 ${
                    on ? 'after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-ink' : ''
                  }`
                }}
                aria-current={undefined}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMenu(true)}
            className="justify-self-start rounded-full px-1 py-2 text-[13px] font-semibold lg:hidden"
            aria-expanded={menu}
          >
            Menu
          </button>

          <Link to="/" className="flex flex-col items-center leading-none" aria-label={`${store.name} home`}>
            <span className="display text-[26px] md:text-[30px]">All About Linen</span>
            <span className="eyebrow mt-0.5 text-[9px] text-mute">Nairobi · Ex UK curated</span>
          </Link>

          <div className="flex items-center justify-self-end gap-0.5">
            <IconBtn label="Search" onClick={() => openSearch(true)}>
              <MagnifyingGlass size={20} />
            </IconBtn>
            <Link to="/wishlist" className="relative hidden size-10 place-items-center rounded-full transition hover:bg-black/5 sm:grid" aria-label={`Wishlist, ${wishCount} items`}>
              <Heart size={20} />
              {wishCount > 0 && <Badge n={wishCount} />}
            </Link>
            <IconBtn label={`Bag, ${count} items`} onClick={() => openCart(true)}>
              <Bag size={20} />
              <AnimatePresence>{count > 0 && <Badge n={count} key={count} />}</AnimatePresence>
            </IconBtn>
          </div>
        </div>

        <AnimatePresence>{mega && <MegaMenu branch={mega} />}</AnimatePresence>
      </header>

      <AnimatePresence>{menu && <MobileMenu onClose={() => setMenu(false)} />}</AnimatePresence>
    </>
  )
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="relative grid size-10 place-items-center rounded-full transition hover:bg-black/5 active:scale-95">
      {children}
    </button>
  )
}

function Badge({ n }: { n: number }) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-white"
    >
      {n}
    </motion.span>
  )
}

function MegaMenu({ branch }: { branch: Branch }) {
  const b = branches[branch]
  const items = products.filter((p) => p.branch === branch)
  const cats = [...new Set(items.map((p) => p.category))]
  const featured = items.slice(0, 3)
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease }}
      className="absolute inset-x-0 top-full hidden border-y border-line bg-bone/95 backdrop-blur-xl lg:block"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-[220px_1fr] gap-12 px-8 py-8">
        <div>
          <p className="eyebrow text-mute">{b.house}</p>
          <ul className="mt-4 space-y-1">
            <li>
              <Link to={`/shop/${branch}`} className="display text-3xl hover:text-clay">
                Shop all
              </Link>
            </li>
            {cats.map((c) => (
              <li key={c}>
                <Link to={`/shop/${branch}?cat=${encodeURIComponent(c)}`} className="display text-3xl transition-colors hover:text-clay">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {featured.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} className="group">
              <div className="aspect-[5/4] overflow-hidden rounded-2xl">
                <Photo id={p.images[0]} alt={p.name} sizes="(min-width: 768px) 20vw, 40vw" className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-2 text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-mute">{kes(p.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [])
  const links = [...NAV, { to: '/wishlist', label: 'Wishlist' }]
  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.7, ease }}
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-ink px-6 pt-5 pb-8 text-bone"
      data-lenis-prevent
      role="dialog"
      aria-modal
      aria-label="Menu"
    >
      <div className="flex items-center justify-between">
        <span className="display text-2xl">All About Linen</span>
        <button type="button" onClick={onClose} aria-label="Close menu" className="grid size-10 place-items-center rounded-full bg-white/10">
          <X size={20} />
        </button>
      </div>
      <ul className="mt-[min(3.5rem,5svh)] flex-1 space-y-[min(0.5rem,1svh)]">
        {links.map((l, i) => (
          <motion.li
            key={l.to}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease }}
          >
            <Link to={l.to} onClick={onClose} className="display block text-[min(3.75rem,7.6svh)] leading-[1.05]">
              {l.label}
            </Link>
          </motion.li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-bone/70">
        <span className="flex items-center gap-3"><MapPin size={16} /> {store.shop}</span>
        <Link to="/admin" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-full border border-bone/20 px-3 py-1.5 text-xs font-semibold hover:border-bone hover:text-bone">
          <LockSimple size={13} /> Owner login
        </Link>
      </div>
    </motion.div>
  )
}

/* ───────────── Cart drawer ───────────── */
export function CartDrawer() {
  const open = useShop((s) => s.cartOpen)
  const setOpen = useShop((s) => s.openCart)
  const lines = useShop((s) => s.lines)
  const setQty = useShop((s) => s.setQty)
  const remove = useShop((s) => s.remove)
  const navigate = useNavigate()
  const { subtotal, count, bundleSaving } = cartTotals(lines)
  const left = Math.max(0, delivery.freeOver - subtotal)
  const pct = Math.min(100, (subtotal / delivery.freeOver) * 100)

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [setOpen])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-label="Shopping bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease }}
            className="fixed top-0 right-0 bottom-0 z-[90] flex w-full max-w-[440px] flex-col bg-paper"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="display text-3xl">Your bag <span className="font-sans text-sm text-mute">({count})</span></h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close bag" className="grid size-10 place-items-center rounded-full hover:bg-black/5">
                <X size={20} />
              </button>
            </div>

            {lines.length > 0 && (
              <div className="border-b border-line px-6 py-4">
                <p className="text-xs font-medium">
                  {left > 0 ? (
                    <>You are <b>{kes(left)}</b> away from free Nairobi delivery</>
                  ) : (
                    <>You have unlocked <b>free Nairobi delivery</b></>
                  )}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                  <motion.div className="h-full origin-left bg-olive" initial={false} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.8, ease }} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="aspect-square w-40 overflow-hidden rounded-full">
                    <Photo id={U.foldedStack} alt="" sizes="160px" className="h-full w-full" />
                  </div>
                  <p className="display mt-6 text-3xl">Your bag is empty</p>
                  <p className="mt-2 max-w-xs text-sm text-mute">Every piece is one of one. Start with what landed this week before it sells.</p>
                  <div className="mt-6 flex gap-2">
                    {(['men', 'women', 'kids'] as Branch[]).map((b) => (
                      <Link key={b} to={`/shop/${b}`} onClick={() => setOpen(false)} className="rounded-full border border-ink px-4 py-2 text-xs font-semibold transition hover:bg-ink hover:text-bone">
                        {branches[b].label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => {
                      const p = byId(l.id)!
                      return (
                        <motion.li
                          key={l.key}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.4, ease }}
                          className="flex gap-4 py-4"
                        >
                          <Link to={`/product/${p.slug}`} onClick={() => setOpen(false)} className="w-24 shrink-0 overflow-hidden rounded-xl">
                            <Photo id={p.images[0]} alt={p.name} sizes="(min-width: 768px) 20vw, 40vw" className="aspect-[4/5] w-full" />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex justify-between gap-2">
                              <p className="truncate text-sm font-semibold">{p.name}</p>
                              <p className="text-sm font-semibold">{kes(p.price * l.qty)}</p>
                            </div>
                            <p className="mt-0.5 text-xs text-mute">
                              {branches[p.branch].house} · {l.colour} · Size {l.size}
                              {l.bundle && <span className="ml-1.5 rounded-full bg-oat px-1.5 py-0.5 text-[10px] font-semibold text-ink">Family look</span>}
                            </p>
                            <div className="mt-auto flex items-center justify-between pt-3">
                              {maxQty(l.id) === 1 ? (
                                <span className="rounded-full bg-oat px-2.5 py-1 text-[11px] font-semibold">One of one</span>
                              ) : (
                              <div className="flex items-center rounded-full border border-line">
                                <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.key, l.qty - 1)} className="grid size-8 place-items-center disabled:opacity-30" disabled={l.qty <= 1}>
                                  <Minus size={12} />
                                </button>
                                <span className="w-6 text-center text-xs font-semibold" aria-live="polite">{l.qty}</span>
                                <button type="button" aria-label="Increase quantity" onClick={() => setQty(l.key, l.qty + 1)} className="grid size-8 place-items-center disabled:opacity-30" disabled={l.qty >= 9}>
                                  <Plus size={12} />
                                </button>
                              </div>
                              )}
                              <button type="button" onClick={() => remove(l.key)} className="inline-flex items-center gap-1 text-xs text-mute hover:text-clay">
                                <Trash size={14} /> Remove
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-line px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">{kes(subtotal)}</span>
                </div>
                {bundleSaving > 0 && (
                  <div className="mt-1 flex justify-between text-sm text-olive">
                    <span>Family saving</span>
                    <span className="font-semibold">−{kes(bundleSaving)}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-mute">Delivery calculated at checkout. Pay with M-Pesa, card or on pickup.</p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate('/checkout')
                  }}
                  className="group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-bone transition hover:bg-ink-2 active:scale-[0.99]"
                >
                  Checkout
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={whatsapp(
                    'Hi All About Linen, I would like to order:\n' +
                      lines.map((l) => `• ${byId(l.id)?.name} (${l.colour}, ${l.size}) x${l.qty}`).join('\n'),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink py-3.5 text-sm font-semibold transition hover:bg-ink hover:text-bone"
                >
                  <WhatsappLogo size={18} weight="fill" /> Order this bag on WhatsApp
                </a>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ───────────── Search ───────────── */
export function SearchOverlay() {
  const open = useShop((s) => s.searchOpen)
  const setOpen = useShop((s) => s.openSearch)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return products
      .filter((p) =>
        [p.name, p.category, branches[p.branch].label, branches[p.branch].house, ...p.colours.map((c) => c.name)]
          .join(' ')
          .toLowerCase()
          .includes(t),
      )
      .slice(0, 6)
  }, [q])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [setOpen])

  const go = (path: string) => {
    setOpen(false)
    setQ('')
    navigate(path)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] bg-bone/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal
          aria-label="Search"
        >
          <div className="mx-auto max-w-4xl px-4 pt-6 md:pt-16">
            <div className="flex justify-end">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="grid size-10 place-items-center rounded-full hover:bg-black/5">
                <X size={22} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`)
              }}
              className="mt-4 flex items-center gap-4 border-b-2 border-ink pb-3"
            >
              <MagnifyingGlass size={28} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search shirts, dresses, sage…"
                className="display w-full bg-transparent text-4xl outline-none placeholder:text-mute/50 md:text-6xl"
                aria-label="Search products"
              />
            </form>

            {!q && (
              <div className="mt-8">
                <p className="eyebrow text-mute">Popular</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['White linen', 'Wrap dress', 'Trousers', 'Kids set', 'Sage', 'Blazer'].map((t) => (
                    <button key={t} type="button" onClick={() => setQ(t.split(' ')[0])} className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q && results.length === 0 && (
              <p className="mt-10 text-mute">
                Nothing matches “{q}”. Try a colour like sand, or a piece like shirt.
              </p>
            )}

            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {results.map((p, i) => (
                <motion.li key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }}>
                  <button type="button" onClick={() => go(`/product/${p.slug}`)} className="group w-full text-left">
                    <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                      <Photo id={p.images[0]} alt={p.name} sizes="(min-width: 768px) 20vw, 40vw" className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-mute">{kes(p.price)}</p>
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────── Toast ───────────── */
export function Toast() {
  const toast = useShop((s) => s.toast)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-bone shadow-2xl"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────── Footer ───────────── */
export function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'error' | 'done'>('idle')
  return (
    <footer className="mt-24 bg-ink text-bone">
      <div className="mx-auto max-w-[1440px] px-4 pt-20 pb-10 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="display text-5xl md:text-6xl">Stay in the loop.</p>
            <p className="mt-3 max-w-sm text-sm text-bone/60">New arrivals land every week. Get first pick before they hit Instagram.</p>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                setState(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'done' : 'error')
              }}
              className="mt-6 max-w-md"
            >
              {state === 'done' ? (
                <p className="rounded-full bg-white/10 px-5 py-4 text-sm">You are on the list. Watch your inbox on Friday.</p>
              ) : (
                <>
                  <div className={`flex rounded-full border p-1 ${state === 'error' ? 'border-clay' : 'border-white/20'}`}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setState('idle')
                      }}
                      placeholder="you@email.com"
                      aria-label="Email address"
                      aria-invalid={state === 'error'}
                      className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-bone/40"
                    />
                    <button className="rounded-full bg-bone px-5 py-3 text-sm font-semibold text-ink transition hover:bg-oat">Join</button>
                  </div>
                  {state === 'error' && <p className="mt-2 px-4 text-xs text-blush">Enter a valid email, like name@gmail.com.</p>}
                </>
              )}
            </form>
          </div>
          {(['men', 'women', 'kids'] as Branch[]).map((k) => {
            const b = branches[k]
            return (
              <div key={k}>
                <p className="eyebrow text-bone/50">{b.house}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li><Link to={`/shop/${k}`} className="hover:text-sand">Shop {b.label.toLowerCase()}</Link></li>
                  <li><Link to={`/shop/${k}?sort=new`} className="hover:text-sand">New arrivals</Link></li>
                  <li>
                    <a href={b.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-sand">
                      <InstagramLogo size={14} /> {b.handle}
                    </a>
                  </li>
                </ul>
              </div>
            )
          })}
        </div>

        <div className="mt-16 grid gap-8 border-t border-white/10 pt-8 text-sm text-bone/60 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-bone">{store.shop}, {store.city}</p>
            <p>{store.hours}</p>
            <a href={`tel:+${store.phoneIntl}`} className="hover:text-bone">{store.phoneDisplay}</a>
          </div>
          <div className="flex items-start gap-4">
            <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-bone"><FacebookLogo size={16} /> AllaboutLinen</a>
            <a href={whatsapp()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-bone"><WhatsappLogo size={16} /> WhatsApp</a>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            <Link to="/legal/privacy" className="hover:text-bone">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-bone">Terms</Link>
            <Link to="/legal/returns" className="hover:text-bone">Returns</Link>
            <Link to="/admin" className="inline-flex items-center gap-1 hover:text-bone"><LockSimple size={13} /> Owner login</Link>
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        <p className="display translate-y-[18%] text-center text-[12.5vw] leading-none whitespace-nowrap text-bone/[0.06] select-none" aria-hidden>
          All About Linen
        </p>
      </div>
    </footer>
  )
}
