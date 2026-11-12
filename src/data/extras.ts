// Stock and sizes come from the real Instagram listings. Condition notes, reviews and drop timing are sample data for the pitch.
import { allColours, branches, products, type Branch, type Colour, type Product } from './catalog'
import { U } from '../lib/img'

/* deterministic pseudo random so the mockup looks the same on every load */
const seed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/* ───────────── One of one stock ───────────── */
// Every piece is a single ex UK item, so stock is 1 until it sells.
export const isSold = (p: Product) => !!p.sold
export const SOLD_RECENTLY = new Set(products.filter(isSold).map((p) => p.slug))
const AGO = ['Sold 2 hours ago', 'Sold 6 hours ago', 'Sold this morning', 'Sold yesterday', 'Sold 2 days ago', 'Sold 3 days ago', 'Sold last week']
export const soldAgo: Record<string, string> = Object.fromEntries(
  products.filter(isSold).map((p) => [p.slug, AGO[Math.min(AGO.length - 1, Math.floor(p.addedDaysAgo / 2))]]),
)

export function stock(p: Product): Record<string, number> {
  return Object.fromEntries(p.sizes.map((s) => [s, isSold(p) || p.soldOut?.includes(s) ? 0 : 1]))
}
export const totalLeft = (p: Product) => Object.values(stock(p)).reduce((a, b) => a + b, 0)
export const lastOnes = (p: Product) => Object.entries(stock(p)).filter(([, n]) => n === 1).map(([s]) => s)

/* ───────────── Drops ───────────── */
export const DROP_NO = 8
/** Next Friday 19:00 Nairobi time (UTC+3). */
export function nextDrop(now = new Date()) {
  const d = new Date(now)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 16, 0, 0))
  const day = target.getUTCDay() // 5 = Friday
  let add = (5 - day + 7) % 7
  if (add === 0 && now.getTime() >= target.getTime()) add = 7
  target.setUTCDate(target.getUTCDate() + add)
  return target
}
export const currentDrop = () => products.filter((p) => p.addedDaysAgo <= 7)
export const dropTeasers = [
  { id: U.menLightSuitWall, house: 'All About Linen', hint: 'An oat suit for the December weddings' },
  { id: U.wBlueBuilding, house: 'Lady Linen', hint: 'Whites for Lamu' },
  { id: U.kHands, house: 'Kids Bayke', hint: 'Matching sets for little ones' },
  { id: U.menGroomBeach, house: 'All About Linen', hint: 'Groom and groomsmen' },
  { id: U.wPrint, house: 'Lady Linen', hint: 'Something bolder' },
  { id: U.menDoorway, house: 'All About Linen', hint: 'Evening linen' },
]
export const DROP_COUNT = 23

/* ───────────── Condition report ───────────── */
const NOTES = [
  'No marks, no fading, every original button in place.',
  'Looks unworn. Original care label still attached.',
  'A faint crease from storage that steams out in a minute.',
  'Tiny thread pull on the inner hem, invisible when worn. Priced accordingly.',
  'Softened by washing, which is exactly what you want from linen.',
]
export function condition(p: Product) {
  const r = seed(p.id + 'cond')
  const note = NOTES[Math.floor(r() * NOTES.length)]
  const grade = note.includes('pull') || note.includes('crease') ? 'A' : 'A+'
  const inspected = ['Kevin', 'Mercy', 'Faith', 'Brian'][Math.floor(r() * 4)]
  return {
    grade,
    note,
    inspectedBy: inspected,
    checks: [
      { k: 'Fabric', v: 'No pilling, holes or thinning' },
      { k: 'Colour', v: 'Even, no sun fading or stains' },
      { k: 'Seams', v: 'All seams and hems intact' },
      { k: 'Hardware', v: 'Original buttons and drawcords' },
      { k: 'Freshness', v: 'Washed, steamed and packed by hand' },
    ],
    closeups: [p.images[2], p.images[1]],
  }
}

export const GRADES = [
  { g: 'A+', t: 'Like new', d: 'Looks unworn. Often with tags or original labels.' },
  { g: 'A', t: 'Excellent', d: 'Gently worn, no visible flaws when worn. Any tiny mark is photographed and disclosed.' },
  { g: 'B', t: 'Never sold here', d: 'Anything with stains, holes or fading never reaches the rail.' },
]

/* ───────────── Measurements of each piece ───────────── */
export type Measure = number | [number, number]
type Row = { label: string; values: Record<string, Measure> }
const toCm = (v: number | number[]): Measure => (Array.isArray(v) ? [Math.round(v[0] * 2.54), Math.round(v[v.length - 1] * 2.54)] : Math.round(v * 2.54))

/** Where a size sits on its scale, 0 for the smallest. Used to estimate pieces listed without a tape measure. */
const LETTERS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
export function sizeIndex(p: Product) {
  const f = p.fits?.[0] ?? p.sizes[0]
  if (LETTERS.includes(f)) return LETTERS.indexOf(f) - 1
  const uk = f.match(/UK (\d+)/)
  if (uk) return (Number(uk[1]) - 8) / 2
  const y = f.match(/^(\d+)Y$/)
  if (y) return (Number(y[1]) - 2) / 2
  return 1
}

export function measurements(p: Product): { rows: Row[]; real: boolean } {
  const s = p.sizes[0]
  const m = p.measure
  if (m && (m.waist || m.hips || m.length)) {
    const rows: Row[] = []
    if (m.waist) rows.push({ label: 'Waist', values: { [s]: toCm(m.waist) } })
    if (m.hips) rows.push({ label: 'Hips', values: { [s]: toCm(m.hips) } })
    if (m.length) rows.push({ label: p.category === 'Trousers' || p.category === 'Shorts' ? 'Length' : 'Back length', values: { [s]: toCm(m.length) } })
    return { rows, real: true }
  }
  const r = seed(p.id + 'm')
  const i = sizeIndex(p)
  const v = (base: number, step: number) => ({ [s]: Math.round(base + i * step + (r() - 0.5) * 2) })
  const c = p.category
  if (p.branch === 'kids') {
    return { rows: c === 'Trousers' || c === 'Shorts' ? [{ label: 'Waist, flat', values: v(25, 1.5) }, { label: 'Length', values: v(c === 'Shorts' ? 30 : 62, c === 'Shorts' ? 2 : 5) }] : [{ label: 'Chest, pit to pit', values: v(31, 2) }, { label: 'Back length', values: v(44, 3.5) }], real: false }
  }
  if (c === 'Trousers' || c === 'Shorts') return { rows: [{ label: 'Waist, flat', values: v(p.branch === 'men' ? 39 : 35, 2.5) }, { label: 'Inside leg', values: v(c === 'Shorts' ? 18 : 78, 0.5) }], real: false }
  return { rows: [{ label: 'Chest, pit to pit', values: v(p.branch === 'men' ? 53 : 49, 3) }, { label: 'Back length', values: v(p.branch === 'men' ? 74 : 66, 1.5) }, { label: 'Sleeve', values: v(61, 1) }], real: false }
}

/* ───────────── Fit finder ───────────── */
// Every piece is one of one, so the finder answers "will THIS piece fit me?" and points to others that will.
export type FitPref = 'snug' | 'regular' | 'relaxed'
export type FitVerdict = { verdict: 'yes' | 'roomy' | 'snug' | 'no'; yourSize: string; size: string; headline: string; note: string; others: Product[] }

const range = (v?: number | number[]) => (v === undefined ? undefined : Array.isArray(v) ? [v[0], v[v.length - 1]] : [v, v])
const LBL = (p: Product, v: number) => (p.branch === 'kids' ? `${Math.round(v)}Y` : p.branch === 'women' && !isBottom(p) ? `UK ${Math.round(v / 2) * 2}` : isBottom(p) ? `W${Math.round(v)}` : LETTERS[Math.max(0, Math.min(7, Math.round(v)))])
const isBottom = (p: Product) => p.category === 'Trousers' || p.category === 'Shorts' || p.category === 'Skirts'

/** The customer on the same scale the piece is labelled in. */
function personOn(p: Product, o: { height: number; weight: number; age?: number }) {
  if (p.branch === 'kids') return o.age ?? 8
  if (isBottom(p)) {
    // waist in inches from height and weight
    return p.branch === 'men' ? 0.33 * o.weight + 9.5 + (175 - o.height) * 0.04 : 0.3 * o.weight + 9 + (165 - o.height) * 0.04
  }
  if (p.branch === 'men') {
    const score = o.weight + (o.height - 175) * 0.35
    return score < 58 ? 0 : score < 66 ? 1 : score < 76 ? 2 : score < 86 ? 3 : score < 97 ? 4 : score < 108 ? 5 : 6
  }
  const score = o.weight + (o.height - 165) * 0.3
  return 8 + Math.max(0, Math.round((score - 48) / 6)) * 2 // UK size
}
function pieceOn(p: Product): [number, number] | undefined {
  if (p.branch === 'kids') {
    const a = p.fits?.map((f) => parseInt(f)).filter((n) => !Number.isNaN(n))
    return a?.length ? [Math.min(...a), Math.max(...a)] : undefined
  }
  if (isBottom(p)) return range(p.measure?.waist) as [number, number] | undefined
  if (p.branch === 'men') {
    const a = (p.fits ?? []).map((f) => LETTERS.indexOf(f)).filter((n) => n >= 0)
    return a.length ? [Math.min(...a), Math.max(...a)] : undefined
  }
  const a = (p.fits ?? []).map((f) => Number(f.replace('UK ', ''))).filter((n) => !Number.isNaN(n))
  return a.length ? [Math.min(...a), Math.max(...a)] : undefined
}

export function recommendSize(p: Product, o: { height: number; weight: number; age?: number; pref: FitPref }): FitVerdict {
  const you = personOn(p, o)
  const piece = pieceOn(p)
  const step = p.branch === 'kids' ? 1 : isBottom(p) ? 2 : p.branch === 'women' ? 2 : 1
  const want = you + (o.pref === 'relaxed' ? step : o.pref === 'snug' ? -step : 0)
  const yourSize = LBL(p, want)
  const others = products
    .filter((x) => x.id !== p.id && !isSold(x) && x.branch === p.branch && x.category === p.category)
    .filter((x) => {
      const r = pieceOn(x)
      return r && want >= r[0] - step / 2 && want <= r[1] + step / 2
    })
    .slice(0, 4)
  const size = p.sizes[0]
  if (!piece) return { verdict: 'yes', yourSize, size, headline: 'Likely a fit', note: `We don’t have a measurement for this one. Ask us on WhatsApp and we will measure it for you.`, others }
  // elastic and drawstring waists stretch
  const give = /elastic|drawstring|smock/i.test(p.description) ? step : 0
  const lo = piece[0] - step / 2
  const hi = piece[1] + step / 2 + give
  if (want >= lo && want <= hi) return { verdict: 'yes', yourSize, size, headline: 'This piece fits you', note: `You are about a ${yourSize} and this one is ${size}${give ? ', with a stretchy waist for extra room' : ''}. ${o.pref === 'relaxed' ? 'You asked for an easy drape, and that is how it will sit.' : 'Expect a clean, true fit.'}`, others }
  if (want < lo && want >= lo - step * 1.5) return { verdict: 'roomy', yourSize, size, headline: 'A little roomy on you', note: `You are about a ${yourSize} and this one is ${size}. Great if you like linen loose and breezy, or pick one closer to your size below.`, others }
  if (want > hi && want <= hi + step) return { verdict: 'snug', yourSize, size, headline: 'Could be snug', note: `You are about a ${yourSize} and this one is ${size}. Linen gives a little, but you may prefer one of these.`, others }
  return { verdict: 'no', yourSize, size, headline: `Not your size`, note: `You are about a ${yourSize} and this one is ${size}. Here are pieces on the rail that will fit you.`, others }
}

/* ───────────── Reviews with customer photos ───────────── */
const NAMES: Record<Branch, string[]> = {
  men: ['Brian Otieno', 'Kevin Mutua', 'Hassan Abdalla', 'Dennis Kiprop', 'Collins Wafula', 'Samuel Njoroge'],
  women: ['Wanjiru Kamau', 'Grace Njeri', 'Amina Yusuf', 'Faith Achieng', 'Mercy Wambui', 'Lucy Chebet'],
  kids: ['Aisha Mohamed', 'Joy Atieno', 'Esther Mwangi', 'Ruth Nduta', 'Zawadi Ochieng', 'Halima Said'],
}
const PLACES = ['Kilimani', 'Westlands', 'Karen', 'Runda', 'South B', 'Kileleshwa', 'Mombasa', 'Nyali', 'Kisumu', 'Nakuru', 'Lavington', 'Syokimau']
const TEXTS = [
  'The linen is properly heavy, not the thin stuff you find downtown. They sent me measurements before I paid and it fit exactly.',
  'Wore it to a wedding in Diani and stayed cool all afternoon. Four people asked where it was from.',
  'Delivered the same evening to my office. Looks brand new, you would never know it was ex UK.',
  'I was unsure about sizing, used the size finder and it was spot on. Already ordered a second colour.',
  'Softer after the first wash. Exactly the relaxed fit I wanted.',
  'The condition report was honest. They pointed out a tiny mark I could not even find.',
]
const CUSTOMER_PHOTOS: Record<Branch, string[]> = {
  men: [U.menCreamSky, U.menDoorway, U.menKanzuBlue, U.menLightSuitWall],
  women: [U.wShirtGolden, U.wRailing, U.wBlueBuilding, U.wWhiteSitting],
  kids: [U.kBeachWalk, U.kRunning, U.kBoySmile, U.kHands],
}
export type Review = {
  name: string
  place: string
  rating: number
  size: string
  height: string
  fit: 'Runs small' | 'True to size' | 'Runs large'
  text: string
  photo?: string
  date: string
  helpful: number
}
export function reviewsFor(p: Product) {
  const r = seed(p.id + 'rev')
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const days = [3, 9, 16, 24, 38, 51]
  const list: Review[] = days.slice(0, 4).map((d, i) => {
    const date = new Date(Date.now() - d * 86400000)
    return {
      name: NAMES[p.branch][(i + Math.floor(r() * 6)) % 6],
      place: pick(PLACES),
      rating: r() < 0.82 ? 5 : 4,
      size: p.sizes[0],
      height: p.branch === 'kids' ? `Age ${2 + Math.floor(r() * 9)}` : `${p.branch === 'men' ? 170 + Math.floor(r() * 18) : 158 + Math.floor(r() * 16)} cm`,
      fit: r() < 0.74 ? 'True to size' : r() < 0.6 ? 'Runs large' : 'Runs small',
      text: TEXTS[(i + Math.floor(r() * TEXTS.length)) % TEXTS.length],
      photo: i < 2 ? CUSTOMER_PHOTOS[p.branch][(i + Math.floor(r() * 4)) % 4] : undefined,
      date: date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
      helpful: Math.floor(r() * 24) + 2,
    }
  })
  const fitSplit = { small: 6 + Math.floor(r() * 6), large: 5 + Math.floor(r() * 7) }
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: star === 5 ? 78 + Math.floor(r() * 10) : star === 4 ? 9 + Math.floor(r() * 6) : star === 3 ? 2 : star === 2 ? 1 : 0,
  }))
  return { list, fit: { ...fitSplit, true: 100 - fitSplit.small - fitSplit.large }, breakdown }
}

/* ───────────── Dress the family ───────────── */
export const OCCASIONS = [
  { id: 'wedding', label: 'Wedding guests', note: 'Coast or garden ceremony', photo: U.menGroomBeach },
  { id: 'eid', label: 'Eid', note: 'Prayers, lunch and visits', photo: U.menKanzuSand },
  { id: 'christmas', label: 'Christmas photos', note: 'The family portrait', photo: U.kBeachPair },
  { id: 'holiday', label: 'Beach holiday', note: 'Diani, Watamu, Lamu', photo: U.wBeachBeige },
] as const

export type Role = 'him' | 'her' | 'kid'
export const ROLE_BRANCH: Record<Role, Branch> = { him: 'men', her: 'women', kid: 'kids' }
export const ROLE_LABEL: Record<Role, string> = { him: 'For him', her: 'For her', kid: 'For the kids' }

/** Colours that every house carries, so the whole family can match. */
export function familyColours(): Colour[] {
  return allColours.filter((c) =>
    (['men', 'women', 'kids'] as Branch[]).every((b) => products.some((p) => p.branch === b && !isSold(p) && p.colours.some((x) => x.name === c.name))),
  )
}
export function optionsFor(role: Role, colour: string, occasion: string, anyColour = false) {
  const b = ROLE_BRANCH[role]
  const list = products.filter((p) => p.branch === b && !isSold(p) && (anyColour || p.colours.some((c) => c.name === colour)))
  // occasion leaning: smarter pieces first for weddings and Eid, easy pieces for the beach
  const smart = ['Tailoring', 'Dresses', 'Sets', 'Shirts', 'Outerwear', 'Tops', 'Trousers']
  const easy = ['Sets', 'Shirts', 'Shorts', 'Dresses', 'Tops', 'Trousers', 'Skirts', 'Outerwear']
  const order = occasion === 'holiday' ? easy : smart
  const rank = (p: Product) => {
    const i = order.indexOf(p.category)
    return i === -1 ? 99 : i
  }
  return [...list].sort((a, c) => rank(a) - rank(c))
}
export const BUNDLE_RATE = 0.1
export const houseOf = (p: Product) => branches[p.branch].house
