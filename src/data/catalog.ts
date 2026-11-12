import { U } from '../lib/img'
import { REAL } from './stock.gen'

// Products are the real pieces from the three Instagram houses (see scripts/build-catalog.mjs).
// Ratings, reviews, drops and delivery details are still sample data for the pitch.

export type Branch = 'men' | 'women' | 'kids'

export type Colour = { name: string; hex: string }

export type Product = {
  id: string
  slug: string
  name: string
  branch: Branch
  category: string
  price: number
  compareAt?: number
  colours: Colour[]
  sizes: string[]
  soldOut?: string[]
  rating: number
  reviews: number
  badge?: 'New' | 'Last pieces' | 'Bestseller' | 'Grade A'
  fabric: string
  fit: string
  description: string
  /** Photos: [the piece, detail crop, fabric close up]. Local paths or Unsplash IDs. */
  images: string[]
  addedDaysAgo: number
  /** Standard sizes this one piece fits. */
  fits?: string[]
  measure?: RealSeed['measure']
  sold?: boolean
  /** Instagram post code the piece was listed in. */
  ig?: string
  /** Slugs of pieces styled with it in the same photo. */
  with?: string[]
}

export const C = {
  white: { name: 'Chalk white', hex: '#F3EFE6' },
  oat: { name: 'Oat', hex: '#E2D6BF' },
  sand: { name: 'Sand', hex: '#CDB68E' },
  stone: { name: 'Stone', hex: '#ADA392' },
  sage: { name: 'Sage', hex: '#A3AE92' },
  olive: { name: 'Olive', hex: '#6B714E' },
  sky: { name: 'Sky', hex: '#A7C0D3' },
  navy: { name: 'Navy', hex: '#2B3850' },
  cobalt: { name: 'Cobalt', hex: '#3A5BA0' },
  brown: { name: 'Chocolate', hex: '#6B4A32' },
  terracotta: { name: 'Terracotta', hex: '#B5623D' },
  rust: { name: 'Rust', hex: '#934528' },
  blush: { name: 'Blush', hex: '#E0B5A3' },
  lilac: { name: 'Lilac', hex: '#B9ADCB' },
  lemon: { name: 'Lemon', hex: '#E6D892' },
  black: { name: 'Charcoal', hex: '#262522' },
} satisfies Record<string, Colour>

export const branches: Record<
  Branch,
  {
    key: Branch
    house: string
    label: string
    handle: string
    instagram: string
    blurb: string
    tint: string
    accent: string
    cover: string
    campaign: string
  }
> = {
  men: {
    key: 'men',
    house: 'All About Linen',
    label: 'Men',
    handle: '@all_aboutlinen',
    instagram: 'https://www.instagram.com/all_aboutlinen/',
    blurb: 'Ex UK linen shirts and trousers, one of each, that keep their cool from boardroom to beach.',
    tint: '#E2D6BF',
    accent: '#6B714E',
    cover: U.menDoorway,
    campaign: U.menBlueLawn,
  },
  women: {
    key: 'women',
    house: 'Lady Linen',
    label: 'Women',
    handle: '@lady_linen',
    instagram: 'https://www.instagram.com/lady_linen/',
    blurb: 'Wide leg linen trousers, easy shirts and soft tops, measured by hand and listed one at a time.',
    tint: '#E0B5A3',
    accent: '#B5623D',
    cover: U.wWhiteDress,
    campaign: U.wRailing,
  },
  kids: {
    key: 'kids',
    house: 'Kids Bayke',
    label: 'Kids',
    handle: '@kids_bayke',
    instagram: 'https://www.instagram.com/kids_bayke/',
    blurb: 'Breathable linen shirts, trousers and overshirts for boys, from age 2 to 16.',
    tint: '#A7C0D3',
    accent: '#2B3850',
    cover: U.kBeachPair,
    campaign: U.kBoySmile, // Kids Bayke stocks boys' linen
  },
}

export const store = {
  name: 'All About Linen',
  domain: 'allaboutlinen.co.ke',
  shop: 'Platinum Plaza, Shop 305',
  city: 'Nairobi',
  phoneDisplay: '0702 228 340',
  phoneIntl: '254702228340',
  facebook: 'https://www.facebook.com/search/top?q=AllaboutLinen',
  hours: 'Mon to Sat, 9:00 to 19:00 · Sun, 11:00 to 17:00',
  followers: '5,033',
}

export const whatsapp = (msg = 'Hi All About Linen, I have a question about an item.') =>
  `https://wa.me/${store.phoneIntl}?text=${encodeURIComponent(msg)}`

/** One caption line from Instagram, as written by scripts/build-catalog.mjs. */
export type RealSeed = {
  slug: string
  name: string
  branch: Branch
  category: string
  price: number
  colour: keyof typeof C
  pattern?: string
  /** The exact size of this one piece, as labelled in the post. */
  size: string
  /** Standard sizes this piece fits, used by the shop filter and size finder. */
  fits: string[]
  /** Inches from the caption: waist, hips, length. A pair means a stretch range. */
  measure?: { waist?: number | number[]; hips?: number | number[]; length?: number | number[] }
  sold?: boolean
  fabric: string
  fit: string
  description: string
  /** Instagram post code. */
  ig: string
  /** Photo base path without extension. */
  img: string
  /** Position in the house feed, newest first. */
  order: number
  /** Position within its post when one photo shows several pieces. */
  k?: number
  /** Slugs of the pieces photographed in the same post. */
  with?: string[]
}

// House level ratings: every piece is one of one, so reviews belong to the house, not the item.
const HOUSE_RATING: Record<Branch, { rating: number; reviews: number }> = {
  men: { rating: 4.9, reviews: 1184 },
  women: { rating: 4.8, reviews: 726 },
  kids: { rating: 4.9, reviews: 227 },
}

// Pieces shot together share a photo: list the first of each post first so twins never sit side by side.
const HOUSE_ORDER: Branch[] = ['men', 'women', 'kids']
const ordered = [...REAL].sort((a, b) => HOUSE_ORDER.indexOf(a.branch) - HOUSE_ORDER.indexOf(b.branch) || (a.k ?? 0) - (b.k ?? 0) || a.order - b.order)

export const products: Product[] = ordered.map((s) => ({
  id: s.slug,
  slug: s.slug,
  name: s.name,
  branch: s.branch,
  category: s.category,
  price: s.price,
  colours: [C[s.colour]],
  sizes: [s.size],
  fits: s.fits,
  measure: s.measure,
  sold: s.sold,
  rating: HOUSE_RATING[s.branch].rating,
  reviews: HOUSE_RATING[s.branch].reviews,
  badge: s.order < 6 && !s.sold ? 'New' : undefined,
  fabric: s.fabric,
  fit: s.fit,
  description: s.description,
  // the second piece in a shared photo leads with the detail crop, so the two cards look different
  images: s.k ? [`${s.img}-d.jpg`, `${s.img}.jpg`, `${s.img}-f.jpg`] : [`${s.img}.jpg`, `${s.img}-d.jpg`, `${s.img}-f.jpg`],
  addedDaysAgo: Math.floor(s.order / 5),
  ig: s.ig,
  with: s.with,
}))

export const bySlug = (slug: string) => products.find((p) => p.slug === slug)
export const byId = (id: string) => products.find((p) => p.id === id)

/** Available pieces taken in turn from each house, skipping repeat colours, for editorial rows. */
export function featured(n: number, skip = 0, houses: Branch[] = ['men', 'women', 'kids']) {
  const queues = houses.map((b) => products.filter((p) => p.branch === b && !p.sold))
  const out: Product[] = []
  const seen = new Set<string>()
  for (let i = skip; out.length < n && i < 200; i++) {
    const q = queues[i % queues.length]
    const p = q.find((x) => !out.includes(x) && !seen.has(`${x.branch}${x.colours[0].name}${x.category}`))
    if (p) {
      out.push(p)
      seen.add(`${p.branch}${p.colours[0].name}${p.category}`)
    }
  }
  return out
}

/** Colours that are actually on the rail, in palette order. */
export const allColours = Object.values(C).filter((c) => products.some((p) => p.colours[0].name === c.name))
export const igPost = (p: Product) => (p.ig ? `https://www.instagram.com/p/${p.ig}/` : branches[p.branch].instagram)

export const kes = (n: number) => `KES ${n.toLocaleString('en-KE')}`

export const delivery = {
  freeOver: 5000,
  options: [
    { id: 'pickup', label: 'Collect at Shop 305', note: 'Ready in 2 hours', fee: 0 },
    { id: 'nairobi', label: 'Nairobi delivery', note: 'Same day if ordered by 2pm', fee: 350 },
    { id: 'tryhome', label: 'Try at home · Nairobi', note: 'Rider waits 15 minutes. Pay only for what you keep.', fee: 450 },
    { id: 'kenya', label: 'Countrywide courier', note: '1 to 3 working days', fee: 550 },
  ],
}

export const reviews = [
  { name: 'Brian Otieno', where: 'Kilimani', house: 'All About Linen', text: 'Bought a cobalt linen shirt for a wedding in Diani. Four people asked where it was from. The fabric is properly heavy, not the thin stuff you find downtown.', rating: 5 },
  { name: 'Wanjiru Kamau', where: 'Runda', house: 'Lady Linen', text: 'They sent me the exact waist and length of the wide legs before I paid. It fit exactly like they said. Delivery was the same evening.', rating: 5 },
  { name: 'Aisha Mohamed', where: 'Mombasa', house: 'Kids Bayke', text: 'Ordered linen shirts for both my boys for Eid. Courier to Mombasa took two days and the linen is so soft after washing.', rating: 5 },
  { name: 'Kevin Mutua', where: 'Westlands', house: 'All About Linen', text: 'The beige linen pants are the most comfortable thing I own. I went back the next Friday for a black pair.', rating: 4 },
  { name: 'Grace Njeri', where: 'Karen', house: 'Lady Linen', text: 'Wide leg trousers that actually reach the floor on a tall girl. Shop 305 is worth the climb.', rating: 5 },
]
