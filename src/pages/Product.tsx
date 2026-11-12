import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BellRinging, Check, Heart, InstagramLogo, Minus, Moped, Plus, Ruler, ShieldCheck, Sparkle, Storefront, WhatsappLogo, X } from '@phosphor-icons/react'
import { branches, bySlug, delivery, igPost, kes, products, whatsapp } from '../data/catalog'
import { ease, Photo, Price, ProductCard, Reveal, Stars } from '../components/ui'
import { useShop } from '../store/shop'
import { NotFound } from './Misc'
import { isSold, soldAgo, stock } from '../data/extras'
import { ConditionReport, FitFinder, Measurements, Reviews } from '../components/Trust'
import { EtaLine } from '../components/Eta'
import { CommunitySection } from '../components/Community'

const VIEW_LABELS = ['The piece', 'Detail', 'Fabric close up']

export function Product() {
  const { slug } = useParams()
  const p = slug ? bySlug(slug) : undefined
  const [params, setParams] = useSearchParams()
  const colour = p?.colours.find((c) => c.name === params.get('c')) ?? p?.colours[0]
  const [view, setView] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [added, setAdded] = useState(false)
  const [guide, setGuide] = useState(false)
  const [finder, setFinder] = useState(false)
  const add = useShop((s) => s.add)
  const wish = useShop((s) => (p ? s.wishlist.includes(p.id) : false))
  const toggleWish = useShop((s) => s.toggleWish)

  useEffect(() => {
    if (p) document.title = `${p.name} | ${branches[p.branch].house}`
    setSize(p && p.sizes.length === 1 && !p.sold ? p.sizes[0] : null)
    setQty(1)
    setView(0)
    window.scrollTo(0, 0)
  }, [p])

  if (!p || !colour) return <NotFound />
  const b = branches[p.branch]
  const inv = stock(p)
  const sold = isSold(p)
  const sizeOut = !!size && !inv[size]
  const notifyHref = whatsapp(
    sold
      ? `Hi, I missed the ${p.name.replace(/^The /, '')}. Please let me know if a similar piece comes in a future drop.`
      : `Hi, please let me know if the ${p.name.replace(/^The /, '')} in ${colour.name}, size ${size}, comes back.`,
  )
  const styledWith = (p.with ?? []).map((s) => bySlug(s)).filter((x): x is NonNullable<typeof x> => !!x)
  const related = [
    ...styledWith,
    ...products.filter((x) => x.branch === p.branch && x.id !== p.id && !x.sold && x.category !== p.category && !styledWith.includes(x)).slice(0, 4),
  ].slice(0, 4)
  const oneOff = p.sizes.length === 1

  const onAdd = () => {
    if (sold || sizeOut) return
    if (!size) {
      setSizeError(true)
      document.getElementById('size-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    add(p.id, colour.name, size, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8 md:pt-10">
      <nav aria-label="Breadcrumb" className="text-xs text-mute">
        <Link to="/" className="inline-block py-1.5 hover:text-ink">Home</Link> / <Link to={`/shop/${p.branch}`} className="inline-block py-1.5 hover:text-ink">{b.house}</Link> /{' '}
        <Link to={`/shop/${p.branch}?cat=${encodeURIComponent(p.category)}`} className="inline-block py-1.5 hover:text-ink">{p.category}</Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ZoomStage key={view}>
            <Photo id={p.images[view]} alt={`${p.name} in ${colour.name}, ${VIEW_LABELS[view].toLowerCase()}`} sizes="(min-width: 1024px) 55vw, 100vw" priority widths={[600, 900, 1300, 1800]} className="h-full w-full" />
          </ZoomStage>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {p.images.map((id, v) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`overflow-hidden rounded-2xl ring-offset-2 ring-offset-bone transition ${view === v ? 'ring-2 ring-ink' : 'opacity-70 hover:opacity-100'}`}
              >
                <Photo id={id} alt="" sizes="20vw" widths={[300, 500]} className="aspect-[4/3] w-full" />
                <span className="sr-only">{VIEW_LABELS[v]} view</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="pb-10">
          <a href={b.instagram} target="_blank" rel="noopener noreferrer" className="eyebrow inline-block py-2 text-mute hover:text-ink">
            {b.house} · {b.handle}
          </a>
          <h1 className="display mt-3 text-5xl md:text-7xl">{p.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Price p={p} className="text-xl font-semibold" />
            {p.compareAt && (
              <span className="rounded-full bg-clay px-2.5 py-1 text-xs font-bold text-white">
                Save {kes(p.compareAt - p.price)}
              </span>
            )}
            <span className="flex items-center gap-2 text-sm text-mute">
              <Stars rating={p.rating} /> {p.rating} · {b.house}
            </span>
            {oneOff && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-bone">One of one</span>}
          </div>
          <p className="mt-6 max-w-lg text-mute">{p.description}</p>

          {/* Colour */}
          <div className="mt-8">
            <p className="text-sm">
              <span className="font-semibold">Colour</span> <span className="text-mute">· {colour.name}</span>
            </p>
            <div className="mt-3 flex gap-2.5">
              {p.colours.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={c.name === colour.name}
                  onClick={() => setParams({ c: c.name }, { replace: true })}
                  className={`size-10 rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-bone transition hover:scale-110 ${c.name === colour.name ? 'ring-2 ring-ink' : ''}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-8" id="size-picker">
            <div className="flex items-center justify-between text-sm">
              <p>
                <span className="font-semibold">Size</span> <span className="text-mute">· {p.fit}</span>
                {oneOff && p.fits && p.fits.length > 1 && <span className="block text-xs text-mute">Fits {p.fits[0]} to {p.fits[p.fits.length - 1]}</span>}
              </p>
              <span className="flex items-center gap-4">
                <button type="button" onClick={() => setFinder(true)} className="inline-flex items-center gap-1 py-2 font-semibold text-clay underline underline-offset-4">
                  <Sparkle size={14} weight="fill" /> Find my size
                </button>
                <button type="button" onClick={() => setGuide(true)} className="inline-flex items-center gap-1 py-2 font-semibold underline underline-offset-4">
                  <Ruler size={14} /> Guide
                </button>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Size">
              {p.sizes.map((s) => {
                const out = !inv[s]
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    disabled={sold}
                    onClick={() => {
                      setSize(s)
                      setSizeError(false)
                    }}
                    className={`relative rounded-xl border py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${out ? 'text-mute/60' : ''} ${
                      size === s ? (out ? 'border-ink bg-oat text-ink' : 'border-ink bg-ink text-bone') : sizeError ? 'border-clay' : 'border-line hover:border-ink'
                    }`}
                  >
                    {s}
                    {inv[s] === 1 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-clay" aria-hidden />}
                    {inv[s] === 1 && <span className="sr-only"> last one</span>}
                    {out && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-mute/50" aria-hidden />}
                    {out && <span className="sr-only"> sold out</span>}
                  </button>
                )
              })}
            </div>
            <AnimatePresence>
              {sizeError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm text-clay" role="alert">
                  Choose a size first. Not sure? Open the size guide or ask us on WhatsApp.
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p key={`${size}-${sold}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-sm">
                {sold ? (
                  <><span className="size-2 rounded-full bg-mute" /> {soldAgo[p.slug]}. This piece has found a home.</>
                ) : sizeOut ? (
                  <><span className="size-2 rounded-full bg-mute" /> {size} has sold. Get a WhatsApp alert if another comes in.</>
                ) : size && inv[size] === 1 && oneOff ? (
                  <><span className="size-2 animate-pulse rounded-full bg-clay" /> <b className="font-semibold">The only one, in {size}.</b> <span className="text-mute">When it sells, it is gone.</span></>
                ) : size && inv[size] === 1 ? (
                  <><span className="size-2 animate-pulse rounded-full bg-clay" /> <b className="font-semibold">Last one in {size}.</b> <span className="text-mute">When it sells, it is gone.</span></>
                ) : size ? (
                  <><span className="size-2 rounded-full bg-olive" /> <span className="text-mute">{inv[size]} left in {size}. Ready to ship today.</span></>
                ) : (
                  <><span className="size-2 rounded-full bg-clay" /> <span className="text-mute">Dots mark the last piece in a size. Crossed sizes have sold.</span></>
                )}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <div className={`items-center rounded-full border border-line ${oneOff ? 'hidden' : 'flex'}`}>
              <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className="grid size-12 place-items-center disabled:opacity-30"><Minus size={14} /></button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" disabled={qty >= 9} onClick={() => setQty(qty + 1)} className="grid size-12 place-items-center disabled:opacity-30"><Plus size={14} /></button>
            </div>
            {sold || sizeOut ? (
              <a href={notifyHref} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-bone transition hover:bg-ink-2">
                <BellRinging size={16} /> {sold ? 'Find me another' : `Notify me when ${size} is back`}
              </a>
            ) : (
            <button
              type="button"
              onClick={onAdd}
              className="relative flex-1 overflow-hidden rounded-full bg-ink py-4 text-sm font-semibold text-bone transition hover:bg-ink-2 active:scale-[0.99]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={added ? 'a' : 'b'}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="inline-flex items-center gap-2"
                >
                  {added ? <><Check size={16} weight="bold" /> Added to bag</> : <>Add to bag · {kes(p.price * qty)}</>}
                </motion.span>
              </AnimatePresence>
            </button>
            )}
            <button
              type="button"
              onClick={() => toggleWish(p.id)}
              aria-pressed={wish}
              aria-label={wish ? 'Remove from wishlist' : 'Save to wishlist'}
              className="grid size-[52px] shrink-0 place-items-center rounded-full border border-line transition hover:border-ink"
            >
              <Heart size={20} weight={wish ? 'fill' : 'regular'} className={wish ? 'text-clay' : ''} />
            </button>
          </div>
          <a
            href={whatsapp(`Hi, can I get a short video of the ${p.name} (${p.sizes[0]})? ${igPost(p)}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-ink py-3.5 text-sm font-semibold transition hover:bg-ink hover:text-bone"
          >
            <WhatsappLogo size={18} weight="fill" /> Ask for a video of this piece
          </a>
          {p.ig && (
            <a href={igPost(p)} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 py-2 text-xs font-semibold text-mute hover:text-ink">
              <InstagramLogo size={15} /> See the original post on {b.handle}
            </a>
          )}

          {!sold && <EtaLine />}

          <ul className="mt-4 grid gap-3 rounded-[24px] bg-paper p-5 text-sm sm:grid-cols-3">
            <li className="flex gap-3 sm:flex-col sm:gap-2"><Moped size={20} /> <span>Same day in Nairobi if ordered by 2pm</span></li>
            <li className="flex gap-3 sm:flex-col sm:gap-2"><Storefront size={20} /> <span>Collect free from Shop 305</span></li>
            <li className="flex gap-3 sm:flex-col sm:gap-2"><ShieldCheck size={20} /> <span>Grade A ex UK, 7 day exchanges</span></li>
          </ul>

          <div className="mt-8 divide-y divide-line border-y border-line">
            {[
              { t: 'Details', d: `${p.description} Fit: ${p.fit}.` },
              { t: 'Fabric and care', d: `${p.fabric}. Wash cool on a gentle cycle, hang to dry and iron while slightly damp. Linen softens with every wash.` },
              { t: 'Delivery and exchanges', d: `Nairobi delivery KES 350, free over ${kes(delivery.freeOver)}. Countrywide courier KES 550 in one to three days. Exchange any unworn piece within seven days.` },
            ].map((a, i) => (
              <details key={a.t} className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {a.t}
                  <Plus size={16} className="transition-transform duration-500 group-open:rotate-45" />
                </summary>
                <p className="pb-5 text-sm text-mute">{a.d}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Trust and fit */}
      <section className="mt-16 grid gap-4 md:mt-24 lg:grid-cols-2 [&>*]:min-w-0" aria-label="Condition and measurements">
        <Reveal><ConditionReport p={p} /></Reveal>
        <Reveal delay={0.08}><Measurements p={p} selected={size} /></Reveal>
      </section>

      <CommunitySection p={p} />

      <Reviews p={p} />

      {/* Related */}
      <section className="mt-16 md:mt-24">
        <Reveal>
          <h2 className="display text-5xl md:text-6xl">{styledWith.length ? 'Styled with' : 'Complete the look'}</h2>
          {styledWith.length > 0 && <p className="mt-2 text-sm text-mute">Shot together in the same photo. Take the full look before someone else does.</p>}
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {related.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06}>
              <ProductCard p={r} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Mobile sticky add */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-paper/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{p.name}</p>
          <p className="text-xs text-mute">{size ? `Size ${size} · ` : ''}{kes(p.price)}</p>
        </div>
        {sold || sizeOut ? (
          <a href={notifyHref} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bone">
            {sold ? 'Find me another' : 'Notify me'}
          </a>
        ) : (
          <button type="button" onClick={onAdd} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bone">
            {added ? 'Added' : 'Add to bag'}
          </button>
        )}
      </div>

      <AnimatePresence>{guide && <SizeGuide branch={p.branch} onClose={() => setGuide(false)} />}</AnimatePresence>
      <AnimatePresence>
        {finder && (
          <FitFinder
            p={p}
            onClose={() => setFinder(false)}
            onPick={(s) => {
              setSize(s)
              setSizeError(false)
              document.getElementById('size-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/** Main image with a 3D lean and a magnifier that follows the pointer. */
function ZoomStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [z, setZ] = useState<{ x: number; y: number } | null>(null)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease }}
      className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[28px] bg-oat"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = ref.current!.getBoundingClientRect()
        setZ({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
      }}
      onPointerLeave={() => setZ(null)}
    >
      <div
        className="h-full w-full transition-transform duration-500 ease-out-expo"
        style={{
          transformOrigin: z ? `${z.x}% ${z.y}%` : 'center',
          transform: z ? 'scale(1.9)' : 'scale(1)',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

function SizeGuide({ branch, onClose }: { branch: 'men' | 'women' | 'kids'; onClose: () => void }) {
  const rows =
    branch === 'men'
      ? [['S', '36 to 38', '30'], ['M', '39 to 41', '32'], ['L', '42 to 44', '34'], ['XL', '45 to 47', '36'], ['XXL', '48 to 50', '38']]
      : branch === 'women'
        ? [['XS', '31 to 32', '24 to 25'], ['S', '33 to 34', '26 to 27'], ['M', '35 to 36', '28 to 29'], ['L', '37 to 39', '30 to 32'], ['XL', '40 to 42', '33 to 35']]
        : [['2Y', '21', '20'], ['4Y', '22.5', '21'], ['6Y', '24', '22'], ['8Y', '26', '23'], ['10Y', '28', '24'], ['12Y', '30', '25']]
  return (
    <>
      <motion.div className="fixed inset-0 z-[80] bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal
        aria-label="Size guide"
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.5, ease }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-lg -translate-y-1/2 rounded-[28px] bg-paper p-6 md:p-8"
      >
        <div className="flex items-center justify-between">
          <p className="display text-4xl">Size guide</p>
          <button type="button" onClick={onClose} aria-label="Close size guide" className="grid size-10 place-items-center rounded-full bg-black/5"><X size={18} /></button>
        </div>
        <p className="mt-2 text-sm text-mute">Measurements in inches. Between sizes? Size up for a relaxed linen drape.</p>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-mute">
              <th className="py-2 font-medium">Size</th>
              <th className="py-2 font-medium">{branch === 'kids' ? 'Chest' : 'Chest'}</th>
              <th className="py-2 font-medium">Waist</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-b border-line/60">
                {r.map((c, i) => <td key={i} className={`py-2.5 ${i === 0 ? 'font-semibold' : ''}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </>
  )
}
