import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Faders, X } from '@phosphor-icons/react'
import { allColours, branches, products, type Branch } from '../data/catalog'
import { isSold } from '../data/extras'
import { ease, ProductCard, SplitHeading } from '../components/ui'

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'new', label: 'Newest' },
  { id: 'price-asc', label: 'Price, low to high' },
  { id: 'price-desc', label: 'Price, high to low' },
  { id: 'rating', label: 'Top rated' },
]

const PRICE = [
  { id: 'u1', label: 'Under KES 1,000', test: (n: number) => n < 1000 },
  { id: '1-15', label: 'KES 1,000 to 1,500', test: (n: number) => n >= 1000 && n <= 1500 },
  { id: 'o15', label: 'Over KES 1,500', test: (n: number) => n > 1500 },
]

// size chips in a sensible order: letters, then UK sizes, then waist, then ages
const LETTERS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
const sizeRank = (s: string) => {
  if (LETTERS.includes(s)) return LETTERS.indexOf(s)
  const n = parseInt(s.replace(/\D+/g, ''))
  return s.startsWith('UK') ? 100 + n : s.startsWith('W') ? 200 + n : s.endsWith('Y') ? 300 + n : 999
}
const fitsOf = (p: { fits?: string[]; sizes: string[] }) => (p.fits?.length ? p.fits : p.sizes)

export function Shop() {
  const { branch } = useParams<{ branch?: Branch }>()
  const valid = branch && branch in branches ? branch : undefined
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const cat = params.get('cat')
  const colour = params.get('colour')
  const size = params.get('size')
  const price = params.get('price')
  const sort = params.get('sort') ?? 'featured'
  const q = params.get('q')

  // brief skeleton for perceived loading when the view changes
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 380)
    return () => clearTimeout(t)
  }, [valid, cat, colour, size, price, sort, q])

  useEffect(() => {
    document.title = `${valid ? branches[valid].house : 'Shop all'} | All About Linen`
  }, [valid])

  const scope = useMemo(() => products.filter((p) => !valid || p.branch === valid), [valid])
  const cats = useMemo(() => [...new Set(scope.map((p) => p.category))], [scope])
  const sizes = useMemo(() => [...new Set(scope.filter((p) => !isSold(p)).flatMap(fitsOf))].sort((a, b) => sizeRank(a) - sizeRank(b)), [scope])
  const colours = useMemo(() => allColours.filter((c) => scope.some((p) => p.colours.some((x) => x.name === c.name))), [scope])

  const list = useMemo(() => {
    let l = scope.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!colour || p.colours.some((c) => c.name === colour)) &&
        (!size || (fitsOf(p).includes(size) && !isSold(p))) &&
        (!price || PRICE.find((x) => x.id === price)?.test(p.price)) &&
        (!q ||
          [p.name, p.category, p.description, ...p.colours.map((c) => c.name)].join(' ').toLowerCase().includes(q.toLowerCase())),
    )
    if (sort === 'new') l = [...l].sort((a, b) => a.addedDaysAgo - b.addedDaysAgo)
    if (sort === 'price-asc') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price)
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating)
    return [...l].sort((a, b) => Number(isSold(a)) - Number(isSold(b)))
  }, [scope, cat, colour, size, price, sort, q])

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v === null || next.get(k) === v) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }
  const active = [cat && ['cat', cat], colour && ['colour', colour], size && ['size', `Size ${size}`], price && ['price', PRICE.find((x) => x.id === price)?.label], q && ['q', `“${q}”`]].filter(Boolean) as [string, string][]

  const b = valid ? branches[valid] : null

  const Filters = (
    <div className="space-y-8">
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Chip key={c} on={cat === c} onClick={() => set('cat', c)}>{c}</Chip>
          ))}
        </div>
      </Group>
      <Group title="Colour">
        <div className="grid grid-cols-6 gap-2">
          {colours.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => set('colour', c.name)}
              aria-pressed={colour === c.name}
              title={c.name}
              aria-label={c.name}
              className={`relative aspect-square rounded-full ring-1 ring-black/10 transition hover:scale-110 ${colour === c.name ? 'ring-2 ring-ink ring-offset-2 ring-offset-bone' : ''}`}
              style={{ background: c.hex }}
            >
              {colour === c.name && <Check size={12} weight="bold" className="absolute inset-0 m-auto mix-blend-difference text-white" />}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <Chip key={s} on={size === s} onClick={() => set('size', s)}>{s}</Chip>
          ))}
        </div>
      </Group>
      <Group title="Price">
        <div className="flex flex-col gap-2">
          {PRICE.map((p) => (
            <Chip key={p.id} on={price === p.id} onClick={() => set('price', p.id)} block>{p.label}</Chip>
          ))}
        </div>
      </Group>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-10 md:px-8 md:pt-16">
      {/* House header */}
      <div className="relative overflow-hidden rounded-[32px] px-6 py-12 md:px-12 md:py-20" style={{ background: b?.tint ?? '#E2D6BF' }}>
        <div className="relative z-10 max-w-2xl">
          <nav aria-label="Breadcrumb" className="text-xs text-ink/60">
            <Link to="/" className="inline-block py-1.5 hover:text-ink">Home</Link> / <Link to="/shop" className="inline-block py-1.5 hover:text-ink">Shop</Link>
            {b && <> / <span className="text-ink">{b.label}</span></>}
          </nav>
          <SplitHeading as="h1" key={valid ?? 'all'} text={b ? b.house : q ? `Results for “${q}”` : 'Shop all linen'} className="display mt-4 text-6xl md:text-8xl" />
          <p className="mt-4 max-w-md text-ink/70">{b ? b.blurb : 'Every piece across All About Linen, Lady Linen and Kids Bayke.'}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {[{ k: undefined, label: 'All' }, ...(['men', 'women', 'kids'] as Branch[]).map((k) => ({ k, label: branches[k].label }))].map((t) => (
            <Link
              key={t.label}
              to={t.k ? `/shop/${t.k}` : '/shop'}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${valid === t.k ? 'bg-ink text-bone' : 'bg-paper/60 hover:bg-paper'}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mt-8 flex items-center justify-between gap-4 bg-bone/85 px-4 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-semibold lg:hidden">
            <Faders size={16} /> Filter{active.length ? ` (${active.length})` : ''}
          </button>
          <p className="hidden text-sm text-mute lg:block">{list.length} pieces</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {active.map(([k, label]) => (
              <button key={k} type="button" onClick={() => set(k, null)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-bone">
                {label} <X size={12} />
              </button>
            ))}
            {active.length > 1 && (
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="shrink-0 text-xs font-semibold underline underline-offset-4">
                Clear all
              </button>
            )}
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <span className="hidden text-mute sm:inline">Sort</span>
          <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? null : e.target.value)} className="rounded-full border border-line bg-paper px-3 py-2 text-sm font-semibold">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-36">{Filters}</div>
        </aside>

        <section aria-label="Products" aria-busy={loading}>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[4/5] animate-pulse rounded-[22px] bg-oat" />
                  <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-oat" />
                  <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-oat" />
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center rounded-[28px] bg-paper px-6 py-20 text-center">
              <p className="display text-4xl">Nothing on this rail yet</p>
              <p className="mt-2 max-w-sm text-sm text-mute">No pieces match these filters. Remove one, or ask the shop on WhatsApp. New stock lands every week.</p>
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bone">
                Clear filters
              </button>
            </div>
          ) : (
            <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.6, ease, delay: Math.min(i, 8) * 0.04 }}
                  >
                    <ProductCard p={p} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </section>
      </div>

      {/* mobile filter sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div className="fixed inset-0 z-[80] bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal
              aria-label="Filters"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.55, ease }}
              className="fixed inset-x-0 bottom-0 z-[90] max-h-[85svh] overflow-y-auto rounded-t-[28px] bg-paper p-6"
              data-lenis-prevent
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="display text-3xl">Filter</p>
                <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid size-10 place-items-center rounded-full bg-black/5"><X size={18} /></button>
              </div>
              {Filters}
              <button type="button" onClick={() => setFiltersOpen(false)} className="mt-8 w-full rounded-full bg-ink py-4 text-sm font-semibold text-bone">
                Show {list.length} pieces
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3 text-mute">{title}</p>
      {children}
    </div>
  )
}

function Chip({ on, onClick, children, block }: { on: boolean; onClick: () => void; children: React.ReactNode; block?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${block ? 'text-left' : ''} ${on ? 'border-ink bg-ink text-bone' : 'border-line hover:border-ink'}`}
    >
      {children}
    </button>
  )
}
