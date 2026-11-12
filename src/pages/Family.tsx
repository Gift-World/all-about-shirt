import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShareNetwork, Sparkle, WarningCircle } from '@phosphor-icons/react'
import { branches, kes, type Product } from '../data/catalog'
import { BUNDLE_RATE, familyColours, OCCASIONS, optionsFor, ROLE_BRANCH, ROLE_LABEL, stock, type Role } from '../data/extras'
import { ease, Photo, SplitHeading } from '../components/ui'
import { useShop } from '../store/shop'

type Member = { key: string; role: Role; label: string }

export function Family() {
  useEffect(() => {
    document.title = 'Dress the family | All About Linen'
  }, [])
  const colours = useMemo(familyColours, [])
  const [occasion, setOccasion] = useState<string>(OCCASIONS[0].id)
  const [colour, setColour] = useState(colours[0]?.name ?? 'Chalk white')
  const [him, setHim] = useState(1)
  const [her, setHer] = useState(1)
  const [kids, setKids] = useState(2)
  const [pick, setPick] = useState<Record<string, number>>({})
  const [sizes, setSizes] = useState<Record<string, string>>({})
  const [missing, setMissing] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const addBundle = useShop((s) => s.addBundle)

  const members: Member[] = useMemo(() => {
    const m: Member[] = []
    if (him) m.push({ key: 'him', role: 'him', label: 'Him' })
    if (her) m.push({ key: 'her', role: 'her', label: 'Her' })
    for (let i = 0; i < kids; i++) m.push({ key: `kid${i}`, role: 'kid', label: kids > 1 ? `Little one ${i + 1}` : 'Little one' })
    return m
  }, [him, her, kids])

  const optionsByRole = useMemo(
    () => ({
      him: optionsFor('him', colour, occasion),
      her: optionsFor('her', colour, occasion),
      kid: optionsFor('kid', colour, occasion),
    }),
    [colour, occasion],
  )

  // reset picks when the look changes
  useEffect(() => {
    setPick({})
    setSizes({})
    setMissing([])
    setDone(false)
  }, [colour, occasion])

  // every piece is one of one, so two people can never share the same item
  const used = new Set<string>()
  const chosen = members
    .map((m) => {
      let opts = optionsByRole[m.role].filter((p) => !used.has(p.id))
      // a second child when only one piece in this shade exists: offer the closest pieces in other shades
      if (!opts.length && m.role === 'kid') opts = optionsFor('kid', '', occasion, true).filter((p) => !used.has(p.id))
      if (!opts.length) return null
      const i = (pick[m.key] ?? 0) % opts.length
      used.add(opts[i].id)
      return { m, p: opts[i], count: opts.length, i }
    })
    .filter(Boolean) as { m: Member; p: Product; count: number; i: number }[]
  const sizeOf = (c: { m: Member; p: Product }) => sizes[c.m.key] || (c.p.sizes.length === 1 ? c.p.sizes[0] : '')

  const subtotal = chosen.reduce((a, c) => a + c.p.price, 0)
  const houses = new Set(chosen.map((c) => c.p.branch)).size
  const qualifies = chosen.length >= 3 && houses >= 2
  const saving = qualifies ? Math.round(subtotal * BUNDLE_RATE) : 0
  const occ = OCCASIONS.find((o) => o.id === occasion)!

  const addAll = () => {
    const miss = chosen.filter((c) => !sizeOf(c)).map((c) => c.m.key)
    setMissing(miss)
    if (miss.length) {
      document.getElementById(`member-${miss[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    addBundle(
      `family-${colour}-${occasion}`,
      chosen.map((c) => ({ id: c.p.id, colour: c.p.colours[0].name, size: sizeOf(c) })),
    )
    setDone(true)
  }

  const shareText =
    `Our ${occ.label.toLowerCase()} look from All About Linen, all in ${colour.toLowerCase()}:\n` +
    chosen.map((c) => `• ${c.m.label}: ${c.p.name} (${kes(c.p.price)})`).join('\n') +
    `\nTotal ${kes(subtotal - saving)}${saving ? ` after the family saving of ${kes(saving)}` : ''}.`

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-10 md:px-8 md:pt-16">
      {/* Intro */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5 text-clay"><Sparkle size={12} weight="fill" /> Only at All About Linen</p>
          <SplitHeading as="h1" text="Dress the whole family." className="display mt-3 text-6xl md:text-[7.5rem]" />
        </div>
        <p className="max-w-md text-mute lg:justify-self-end">
          One colour, three houses, one photo you will frame. Pick the occasion and the shade, and we match him, her and the little ones. Bundles of three or more save {Math.round(BUNDLE_RATE * 100)}%.
        </p>
      </div>

      {/* Step 1: occasion */}
      <section className="mt-14" aria-label="Occasion">
        <Step n={1} title="What is the occasion?" />
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {OCCASIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOccasion(o.id)}
              aria-pressed={occasion === o.id}
              className={`group relative aspect-[4/3] overflow-hidden rounded-[22px] text-left ring-offset-4 ring-offset-bone transition ${occasion === o.id ? 'ring-2 ring-ink' : ''}`}
            >
              <Photo id={o.photo} alt="" sizes="(min-width: 768px) 25vw, 50vw" widths={[400, 700]} className="h-full w-full transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-bone md:p-4">
                <span className="display block text-2xl md:text-3xl">{o.label}</span>
                <span className="text-xs text-bone/75">{o.note}</span>
              </span>
              {occasion === o.id && (
                <motion.span layoutId="occ-check" className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-bone text-ink">
                  <Check size={14} weight="bold" />
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 & 3 */}
      <section className="mt-12 grid gap-10 md:grid-cols-2" aria-label="Colour and family">
        <div>
          <Step n={2} title="Choose your shade" />
          <div className="mt-5 flex flex-wrap gap-3">
            {colours.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColour(c.name)}
                aria-pressed={colour === c.name}
                className={`flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-1.5 text-sm font-semibold transition ${colour === c.name ? 'border-ink bg-ink text-bone' : 'border-line hover:border-ink'}`}
              >
                <span className="size-8 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">Shown: shades all three houses carry right now.</p>
        </div>
        <div>
          <Step n={3} title="Who is coming?" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Counter label="Him" value={him} set={setHim} max={1} />
            <Counter label="Her" value={her} set={setHer} max={1} />
            <Counter label="Kids" value={kids} set={setKids} max={4} />
          </div>
        </div>
      </section>

      {/* Portrait */}
      <section className="mt-16" aria-label="Your family look">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-mute">{occ.label} · {colour}</p>
            <h2 className="display mt-2 text-5xl md:text-7xl">Your family look</h2>
          </div>
          <p className="text-sm text-mute">Use the arrows to swap a piece. Pick a size for everyone.</p>
        </div>

        {members.length === 0 ? (
          <div className="mt-8 rounded-[28px] bg-paper px-6 py-16 text-center">
            <p className="display text-4xl">Add someone to the picture</p>
            <p className="mt-2 text-sm text-mute">Use the counters above to add him, her or the little ones.</p>
          </div>
        ) : (
          <LayoutGroup>
            <motion.div layout className="no-scrollbar -mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-4 md:overflow-visible md:px-0" data-lenis-prevent-wheel>
              <AnimatePresence mode="popLayout">
                {members.map((m, idx) => {
                  const c = chosen.find((x) => x.m.key === m.key)
                  return (
                    <motion.article
                      key={m.key}
                      id={`member-${m.key}`}
                      layout
                      initial={{ opacity: 0, y: 30, rotate: idx % 2 ? 2 : -2 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.6, ease }}
                      className={`w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-auto ${m.role === 'kid' ? 'md:mt-16' : ''}`}
                    >
                      <p className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span>{m.label}</span>
                        <span className="text-mute">{branches[ROLE_BRANCH[m.role]].house}</span>
                      </p>
                      {c ? (
                        <MemberCard
                          c={c}
                          colour={colour}
                          size={sizeOf(c)}
                          missing={missing.includes(m.key)}
                          onSize={(s) => {
                            setSizes({ ...sizes, [m.key]: s })
                            setMissing(missing.filter((k) => k !== m.key))
                            setDone(false)
                          }}
                          onSwap={(d) => {
                            setPick({ ...pick, [m.key]: (c.i + d + c.count) % c.count })
                            setSizes({ ...sizes, [m.key]: '' })
                            setDone(false)
                          }}
                        />
                      ) : (
                        <div className="grid aspect-[3/4] place-items-center rounded-[22px] bg-paper p-6 text-center text-sm text-mute">
                          Nothing in {colour.toLowerCase()} for {ROLE_LABEL[m.role].toLowerCase().replace('for ', '')} right now. Try another shade.
                        </div>
                      )}
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </section>

      {/* Summary */}
      {chosen.length > 0 && (
        <section className="sticky bottom-3 z-30 mt-10 md:bottom-6" aria-label="Family bundle summary">
          <div className="flex flex-col gap-4 rounded-[24px] bg-ink p-4 text-bone shadow-2xl lg:flex-row lg:items-center lg:justify-between lg:p-5">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {chosen.slice(0, 5).map((c) => (
                  <Photo key={c.m.key} id={c.p.images[0]} alt="" sizes="48px" widths={[120]} className="size-11 rounded-full ring-2 ring-ink" />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold">
                  {chosen.length} pieces · {kes(subtotal - saving)}
                  {saving > 0 && <s className="ml-2 font-normal text-bone/50">{kes(subtotal)}</s>}
                </p>
                <p className={`text-xs ${saving ? 'text-sand' : 'text-bone/60'}`}>
                  {saving ? `Family saving ${kes(saving)} applied in your bag` : 'Add 3 pieces from 2 houses to save 10%'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/25 px-4 py-3 text-sm font-semibold transition hover:bg-white/10 lg:flex-none"
              >
                <ShareNetwork size={16} /> <span className="hidden sm:inline">Share with the family</span><span className="sm:hidden">Share</span>
              </a>
              <button type="button" onClick={addAll} className="inline-flex flex-[2] items-center justify-center gap-2 rounded-full bg-bone px-5 py-3 text-sm font-semibold text-ink transition hover:bg-oat lg:flex-none">
                {done ? <><Check size={16} weight="bold" /> Added to bag</> : 'Add the family to bag'}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {missing.length > 0 && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-clay px-3 py-1.5 text-xs font-semibold text-white">
                <WarningCircle size={14} /> Pick a size for {missing.length === 1 ? 'one more person' : `${missing.length} people`}.
              </motion.p>
            )}
          </AnimatePresence>
        </section>
      )}

      <p className="mt-16 text-center text-sm text-mute">
        Need a hand? <Link to="/visit" className="py-2 font-semibold underline underline-offset-4">Book a family fitting at Shop 305</Link>
      </p>
    </div>
  )
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <p className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-semibold text-bone">{n}</span>
      <span className="display text-3xl">{title}</span>
    </p>
  )
}

function Counter({ label, value, set, max }: { label: string; value: number; set: (n: number) => void; max: number }) {
  return (
    <div className="rounded-[20px] border border-line bg-paper p-3 text-center">
      <p className="text-xs font-semibold text-mute">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" aria-label={`Fewer ${label}`} disabled={value <= 0} onClick={() => set(value - 1)} className="grid size-9 place-items-center rounded-full border border-line transition hover:border-ink disabled:opacity-30">
          <Minus size={12} />
        </button>
        <span className="display text-3xl tabular-nums" aria-live="polite">{value}</span>
        <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => set(value + 1)} className="grid size-9 place-items-center rounded-full border border-line transition hover:border-ink disabled:opacity-30">
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}

function MemberCard({
  c,
  colour,
  size,
  missing,
  onSize,
  onSwap,
}: {
  c: { p: Product; count: number; i: number }
  colour: string
  size?: string
  missing: boolean
  onSize: (s: string) => void
  onSwap: (d: number) => void
}) {
  const inv = stock(c.p)
  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-oat">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={c.p.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.5, ease }} className="absolute inset-0">
            <Link to={`/product/${c.p.slug}?c=${encodeURIComponent(colour)}`} data-cursor="View">
              <Photo id={c.p.images[1]} alt={`${c.p.name} in ${colour}`} sizes="(min-width: 768px) 22vw, 68vw" className="h-full w-full" />
            </Link>
          </motion.div>
        </AnimatePresence>
        {c.count > 1 && (
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
            <button type="button" aria-label="Previous piece" onClick={() => onSwap(-1)} className="grid size-9 place-items-center rounded-full bg-paper/90 backdrop-blur transition hover:scale-105">
              <ArrowLeft size={14} />
            </button>
            <span className="rounded-full bg-paper/90 px-2 py-1 text-[10px] font-semibold backdrop-blur">
              {c.i + 1} / {c.count}
            </span>
            <button type="button" aria-label="Next piece" onClick={() => onSwap(1)} className="grid size-9 place-items-center rounded-full bg-paper/90 backdrop-blur transition hover:scale-105">
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight">{c.p.name}</p>
        <p className="shrink-0 text-sm font-semibold">{kes(c.p.price)}</p>
      </div>
      <div className={`mt-2 flex flex-wrap gap-1 rounded-xl ${missing ? 'ring-2 ring-clay ring-offset-2 ring-offset-bone' : ''}`} role="radiogroup" aria-label={`Size for ${c.p.name}`}>
        {c.p.sizes.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={size === s}
            disabled={!inv[s]}
            onClick={() => onSize(s)}
            className={`min-w-10 rounded-lg border px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:text-mute/40 disabled:line-through ${size === s ? 'border-ink bg-ink text-bone' : 'border-line hover:border-ink'}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
