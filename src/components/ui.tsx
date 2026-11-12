import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { Heart, Star } from '@phosphor-icons/react'
import { kes, whatsapp, type Product } from '../data/catalog'
import { isSold, lastOnes, soldAgo, stock, totalLeft } from '../data/extras'
import { useShop } from '../store/shop'
import { photo, srcSet } from '../lib/img'

export const ease = [0.16, 1, 0.3, 1] as const

/** Responsive Unsplash photo with a blurred preview that sharpens on load. */
export function Photo({
  id,
  alt,
  className = '',
  sizes = '100vw',
  priority = false,
  widths,
}: {
  id: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  widths?: number[]
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <span className={`relative block overflow-hidden bg-oat ${className}`}>
      <img
        src={photo(id, 40)}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full scale-110 object-cover blur-xl transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />
      {!failed ? (
        <img
          src={photo(id, 900)}
          srcSet={srcSet(id, widths)}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,filter] duration-1000 ease-out-expo ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}`}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-mute">Image unavailable</span>
      )}
    </span>
  )
}

export function Reveal({
  children,
  delay = 0,
  y = 40,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Splits a line into words that rise from a mask, one after another. */
export function SplitHeading({
  text,
  className = '',
  as: Tag = 'h2',
  delay = 0,
}: {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  delay?: number
}) {
  const words = text.split(' ')
  const M = motion[Tag]
  return (
    <M className={className} aria-label={text} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -8% 0px' }}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%' }, show: { y: 0 } }}
            transition={{ duration: 1.1, ease, delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </M>
  )
}

/** Wrapper that tilts its children in 3D toward the pointer. */
export function Tilt({ children, className = '', max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 180, damping: 18 })
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 180, damping: 18 })
  const gx = useTransform(mx, [0, 1], ['0%', '100%'])
  const gy = useTransform(my, [0, 1], ['0%', '100%'])
  const glare = useTransform(
    [gx, gy] as never,
    ([x, y]: string[]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.35), transparent 55%)`,
  )

  return (
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return
          const r = ref.current!.getBoundingClientRect()
          mx.set((e.clientX - r.left) / r.width)
          my.set((e.clientY - r.top) / r.height)
        }}
        onPointerLeave={() => {
          mx.set(0.5)
          my.set(0.5)
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative h-full"
      >
        {children}
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100"
        />
      </motion.div>
    </div>
  )
}

/** Button that leans toward the cursor. */
export function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 220, damping: 15 })
  const y = useSpring(0, { stiffness: 220, damping: 15 })
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={`inline-block ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = ref.current!.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * 0.25)
        y.set((e.clientY - r.top - r.height / 2) * 0.3)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} weight={i <= Math.round(rating) ? 'fill' : 'regular'} aria-hidden />
      ))}
    </span>
  )
}

export function Price({ p, className = '' }: { p: Product; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span>{kes(p.price)}</span>
      {p.compareAt && <s className="text-mute text-[0.85em]">{kes(p.compareAt)}</s>}
    </span>
  )
}

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const [colour, setColour] = useState(p.colours[0])
  const [hover, setHover] = useState(false)
  const add = useShop((s) => s.add)
  const wish = useShop((s) => s.wishlist.includes(p.id))
  const toggleWish = useShop((s) => s.toggleWish)
  const sold = isSold(p)
  const left = totalLeft(p)
  const ones = lastOnes(p)
  const inv = stock(p)
  const scarcity = sold ? null : p.sizes.length === 1 ? `${p.sizes[0]} · one of one` : left <= 3 ? `Last ${left} ${left === 1 ? 'piece' : 'pieces'}` : ones.length ? `1 left in ${ones[0]}` : null

  return (
    <article
      className="group relative"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      data-priority={priority || undefined}
    >
      <Tilt max={7} className="rounded-[22px]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-oat">
          <Link to={`/product/${p.slug}?c=${encodeURIComponent(colour.name)}`} className="absolute inset-0 block rounded-[22px]" aria-label={`${p.name}, ${colour.name}`} data-cursor="View">
            <Photo id={p.images[0]} alt={`${p.name} in ${colour.name}`} sizes="(min-width: 1024px) 25vw, 50vw" priority={priority} className="absolute inset-0 h-full w-full transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.06]" />
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: hover ? 1 : 0, scale: hover ? 1 : 1.08 }}
              transition={{ duration: 0.9, ease }}
            >
              {hover && <Photo id={p.images[1]} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="h-full w-full" />}
            </motion.div>
          </Link>

          {sold && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bone/70 p-4 text-center backdrop-blur-[2px]" style={{ transform: 'translateZ(20px)' }}>
              <span className="display text-3xl md:text-4xl">Sold</span>
              <span className="text-[11px] text-mute">{soldAgo[p.slug]}</span>
              <a
                href={whatsapp(`Hi, I missed the ${p.name.replace(/^The /, '')}. Please let me know if a similar piece comes in a future drop.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-ink px-3 py-2 text-[11px] font-semibold text-bone transition hover:bg-ink-2 sm:px-4 sm:text-xs"
              >
                Find me another
              </a>
            </div>
          )}
          {scarcity && (
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold text-bone backdrop-blur sm:bottom-3 sm:left-3 sm:text-[11px] md:group-hover:opacity-0" style={{ transform: 'translateZ(30px)' }}>
              <span className="size-1.5 rounded-full bg-clay" />
              {scarcity}
            </span>
          )}

          {p.badge && !sold && (
            <span className="eyebrow pointer-events-none absolute top-2.5 left-2.5 max-w-[calc(100%-3.75rem)] truncate rounded-full bg-paper/85 px-2 py-1 text-[9px] tracking-[0.14em] backdrop-blur sm:top-3 sm:left-3 sm:px-2.5 sm:text-[11px] sm:tracking-[0.22em]" style={{ transform: 'translateZ(30px)' }}>
              {p.badge}
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleWish(p.id)}
            aria-pressed={wish}
            aria-label={wish ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
            className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-paper/85 backdrop-blur transition hover:scale-110 active:scale-95 sm:top-3 sm:right-3"
          >
            <Heart size={16} weight={wish ? 'fill' : 'regular'} className={wish ? 'text-clay' : ''} />
          </button>

          {/* quick add */}
          <div hidden={sold} className="absolute inset-x-3 bottom-3 translate-y-[120%] rounded-2xl bg-paper/90 p-2 backdrop-blur-md transition-transform duration-500 ease-out-expo group-focus-within:translate-y-0 group-hover:translate-y-0 max-md:hidden">
            <p className="eyebrow px-1 pb-1.5 text-mute">Quick add</p>
            <div className="flex flex-wrap gap-1">
              {p.sizes.map((s) => {
                const out = !inv[s]
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={out}
                    title={inv[s] === 1 ? `Last one in ${s}` : undefined}
                    onClick={() => add(p.id, colour.name, s)}
                    className="min-w-9 rounded-lg px-2 py-1.5 text-xs font-semibold transition hover:bg-ink hover:text-bone disabled:cursor-not-allowed disabled:text-mute/50 disabled:line-through disabled:hover:bg-transparent"
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Tilt>

      <div className="mt-2 flex flex-col gap-0.5 px-1 sm:mt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold sm:text-sm">
            <Link to={`/product/${p.slug}`} className="inline-block py-1 hover:underline underline-offset-4">
              {p.name}
            </Link>
          </h3>
          <p className="truncate text-xs text-mute">
            {p.category} · {colour.name}
          </p>
        </div>
        <Price p={p} className="shrink-0 text-[13px] font-semibold sm:text-sm" />
      </div>
      <div className="mt-1 -ml-1.5 flex" role="radiogroup" aria-label="Colour">
        {p.colours.map((c) => (
          <button
            key={c.name}
            type="button"
            role="radio"
            aria-checked={c.name === colour.name}
            aria-label={c.name}
            onClick={() => setColour(c)}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setColour(c)}
            className="grid size-7 place-items-center rounded-full"
          >
            <span
              className={`size-4 rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-bone transition ${c.name === colour.name ? 'ring-2 ring-ink' : ''}`}
              style={{ background: c.hex }}
            />
          </button>
        ))}
      </div>
    </article>
  )
}
