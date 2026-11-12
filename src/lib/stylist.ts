// Demo stylist brain. Reads plain English and builds answers from the real one of one stock.
// In production this is replaced by a call to a real model (for example Claude) with the
// catalog passed as tools, so the conversation layer stays identical.
import { allColours, kes, products, type Branch, type Product } from '../data/catalog'
import { isSold } from '../data/extras'

export type Reply = { text: string; products?: Product[]; actions?: { label: string; to: string }[] }

const has = (t: string, ...w: string[]) => w.some((x) => t.includes(x))

function parseBudget(t: string) {
  // a budget needs a money word or a k: "under 3k", "kes 2500", "budget 4,000", "2500/-"
  const m = t.match(/(?:under|below|less than|max|budget(?: of| is)?|ksh|kes|sh)\s*(\d[\d,.]*)\s*(k|thousand)?|(\d[\d,.]*)\s*(k|thousand|\/-|bob)\b/i)
  if (!m) return undefined
  if (m[3]) {
    m[1] = m[3]
    m[2] = /k|thousand/i.test(m[4]) ? m[4] : ''
  }
  let n = parseFloat(m[1].replace(/,/g, ''))
  if (m[2] || n < 100) n *= 1000
  return n >= 500 ? n : undefined
}

const word = (t: string, re: string) => new RegExp(`\\b(${re})\\b`).test(t)
function whoFor(t: string): Branch[] {
  const out: Branch[] = []
  if (word(t, 'him|his|husband|boyfriend|man|men|mens|groom|groomsmen|dad|father|brother|gentleman|guy')) out.push('men')
  if (word(t, 'her|she|wife|girlfriend|woman|women|womens|lady|ladies|mum|mom|mother|sister|bride|bridesmaid')) out.push('women')
  if (word(t, 'kid|kids|child|children|son|daughter|baby|toddler|boy|girl|page boy|flower girl|little one')) out.push('kids')
  // "me and my wife" means a man is asking, "me and my husband" means a woman is
  const self = word(t, 'me|i|myself|us|we') && word(t, 'and')
  if (self && word(t, 'wife|girlfriend|fiancee') && !out.includes('men')) out.push('men')
  if (self && word(t, 'husband|boyfriend|fiance') && !out.includes('women')) out.push('women')
  if (word(t, 'us|we|our|couple|both of us|us both') && out.length === 0) out.push('men', 'women')
  return out
}

function occasion(t: string) {
  const coast = has(t, 'beach', 'coast', 'diani', 'watamu', 'lamu', 'mombasa', 'malindi', 'kilifi', 'zanzibar')
  if (coast && has(t, 'wedding', 'ceremony', 'reception')) return { k: 'beach-wedding', cats: ['Shirts', 'Tops', 'Trousers', 'Dresses'], line: 'For a beach wedding you want polished but light: soft colours, loose cuts and nothing that traps heat in the sun' }
  if (has(t, 'wedding', 'ceremony', 'reception', 'groom', 'bride')) return { k: 'wedding', cats: ['Shirts', 'Outerwear', 'Tops', 'Trousers'], line: 'For a wedding I lean polished but breathable' }
  if (has(t, 'eid', 'mosque', 'friday prayer', 'idd')) return { k: 'eid', cats: ['Shirts', 'Tops', 'Trousers'], line: 'For Eid I would go long, clean and light' }
  if (has(t, 'beach', 'coast', 'diani', 'watamu', 'lamu', 'mombasa', 'malindi', 'holiday', 'vacation', 'zanzibar')) return { k: 'beach', cats: ['Sets', 'Shirts', 'Shorts', 'Dresses', 'Tops'], line: 'For the coast you want loose cuts and light colours' }
  if (has(t, 'office', 'work', 'meeting', 'interview', 'business')) return { k: 'office', cats: ['Shirts', 'Trousers', 'Tops', 'Outerwear'], line: 'For the office, structure matters more than colour' }
  if (has(t, 'birthday', 'party') && word(t, 'kid|kids|child|son|daughter|boy|girl|little one')) return { k: 'birthday', cats: ['Dresses', 'Sets', 'Shirts'], line: 'For a birthday party, pick something comfy enough to play in and smart enough for the photos' }
  if (has(t, 'date', 'dinner', 'night', 'party', 'rooftop')) return { k: 'evening', cats: ['Shirts', 'Tops', 'Outerwear'], line: 'For an evening out, go darker or go bold' }
  if (has(t, 'church', 'sunday')) return { k: 'church', cats: ['Dresses', 'Shirts', 'Trousers'], line: 'For Sunday service, smart and comfortable' }
  return undefined
}

function colourIn(t: string) {
  const alias: Record<string, string> = { white: 'Chalk white', cream: 'Oat', beige: 'Sand', green: 'Sage', blue: 'Sky', black: 'Charcoal', pink: 'Blush', orange: 'Terracotta', red: 'Rust', yellow: 'Lemon', grey: 'Stone', gray: 'Stone' }
  for (const [k, v] of Object.entries(alias)) if (t.includes(k)) return v
  return allColours.find((c) => t.includes(c.name.toLowerCase()))?.name
}

const available = (p: Product) => !isSold(p)
const ITEMS: [string, string][] = [['shirt', 'Shirts'], ['dress', 'Dresses'], ['trouser', 'Trousers'], ['pants', 'Trousers'], ['short', 'Shorts'], ['skirt', 'Skirts'], ['jacket', 'Outerwear'], ['overshirt', 'Outerwear'], ['blazer', 'Outerwear'], ['top', 'Tops']]


/** "size L", "W34", "uk 12", "age 8" → a size the pieces are tagged with. */
function sizeIn(t: string) {
  const w = t.match(/\bw\s?(\d{2})\b/)
  if (w) return `W${Number(w[1]) % 2 ? Number(w[1]) + 1 : w[1]}`
  const uk = t.match(/\b(?:uk|size)\s?(\d{1,2})\b/)
  if (uk && Number(uk[1]) >= 4) return `UK ${Number(uk[1]) % 2 ? Number(uk[1]) + 1 : uk[1]}`
  const age = t.match(/\b(?:age|aged)\s?(\d{1,2})\b|\b(\d{1,2})\s?(?:years?|yrs?)\s?old\b/)
  if (age) return `${age[1] ?? age[2]}Y`
  const l = t.match(/\b(?:size|in)\s(xs|s|m|l|xl|xxl|2xl|3xl)\b/)
  if (l) return l[1].toUpperCase().replace('XXL', '2XL')
  return undefined
}
// shirt size to the waist that usually goes with it, so "size L" can also pick trousers
const WAIST: Record<string, string[]> = { XS: ['W26', 'W28'], S: ['W28', 'W30'], M: ['W30', 'W32'], L: ['W32', 'W34'], XL: ['W34', 'W36'], '2XL': ['W36', 'W38', 'W40'], '3XL': ['W40', 'W42', 'W44'] }
const isBottom = (p: Product) => p.category === 'Trousers' || p.category === 'Shorts' || p.category === 'Skirts'
function fitsSize(p: Product, s?: string) {
  if (!s) return true
  const tags = p.fits?.length ? p.fits : p.sizes
  if (tags.includes(s)) return true
  if (s.startsWith('W')) return !isBottom(p) // a waist says nothing about tops
  if (isBottom(p) && WAIST[s]) return WAIST[s].some((w) => tags.includes(w))
  return false
}
const TOPS = ['Shirts', 'Tops', 'Outerwear', 'Dresses']
const BOTTOMS = ['Trousers', 'Shorts', 'Skirts']
const NEUTRAL = ['Chalk white', 'Oat', 'Sand', 'Stone', 'Charcoal', 'Navy', 'Chocolate']
const pickBest = (list: Product[], cats: string[] | undefined, n: number) => {
  const rank = (p: Product) => {
    const i = cats ? cats.indexOf(p.category) : 0
    return (i === -1 ? 9 : i) * 10 - p.rating
  }
  return [...list].sort((a, b) => rank(a) - rank(b)).slice(0, n)
}

export function think(raw: string, ctx: { lastBranches?: Branch[] }): Reply & { branches?: Branch[] } {
  const t = ` ${raw.toLowerCase()} `

  if (has(t, 'hello', 'hi ', 'hey', 'habari', 'jambo', 'niaje') && t.trim().length < 18) {
    return { text: 'Habari! I am Amani, your linen stylist. Tell me the occasion, who it is for and a rough budget, and I will put a look together from what is on the rail right now.' }
  }
  const h = t.match(/(\d{3})\s*cm/)
  const w = t.match(/(\d{2,3})\s*kg/)
  if ((h && w) || word(t, 'what size|which size|my size|sizing|size guide|fit me|measurements|measure me')) {
    if (h && w) {
      const score = Number(w[1]) + (Number(h[1]) - 175) * 0.35
      const s = score < 64 ? 'S' : score < 74 ? 'M' : score < 85 ? 'L' : score < 97 ? 'XL' : 'XXL'
      return { text: `At ${h[1]} cm and ${w[1]} kg you are most likely a ${s} in our men’s shirts. Linen relaxes as you wear it, so if you sit between two sizes, take the smaller one for a sharp fit or the bigger one for that easy drape. Every product page has exact measurements of the actual piece too.` }
    }
    return { text: 'Happy to help with size. Tell me your height in cm and weight in kg, for example “178 cm, 80 kg”, and whether you like a snug or relaxed fit. Or tap “Find my size” on any product page.' }
  }
  if (word(t, 'shop|store|location|located|address|visit|hours|open|opening') && has(t, 'where', 'when', 'hours', 'open', 'address', 'visit', 'located')) {
    return { text: 'You will find us at Platinum Plaza, Shop 305, Nairobi CBD. We are open Monday to Saturday 9am to 7pm and Sunday 11am to 5pm. Come try everything on, or book a family fitting.', actions: [{ label: 'Directions and hours', to: '/visit' }] }
  }
  if (has(t, 'deliver', 'delivery', 'shipping', 'how long', 'when will', 'rider')) {
    return { text: 'Nairobi orders placed before 2pm arrive the same day, usually within 90 minutes of packing. Countrywide courier takes one to three days. You can also choose Try at home: the rider waits 15 minutes and you only pay for what you keep.', actions: [{ label: 'See checkout options', to: '/checkout' }] }
  }
  if (has(t, 'return', 'exchange', 'refund')) {
    return { text: 'Any unworn piece can be exchanged within seven days at Shop 305 or by courier. With Try at home you can hand things back to the rider on the spot.' }
  }
  if (has(t, 'drop', 'new stock', 'new arrivals', 'friday')) {
    return { text: 'New pieces land every Friday at 7pm and most come in one size only. Join the WhatsApp alert list and you get a private link 30 minutes early.', actions: [{ label: 'See the next drop', to: '/drop' }] }
  }
  if (has(t, 'ex uk', 'ex-uk', 'second hand', 'secondhand', 'used', 'condition', 'grade')) {
    return { text: 'Ex UK means each piece is sourced from the United Kingdom and checked by hand. We only sell Grade A+ and A. Every product page has a condition report with the inspector’s note and close up photos, so you know exactly what you are getting.' }
  }

  const occ = occasion(t)
  const budget = parseBudget(t)
  const colour = colourIn(t)
  let who = whoFor(t)
  if (!who.length && ctx.lastBranches?.length) who = ctx.lastBranches
  const family = has(t, 'family', 'everyone', 'all of us', 'matching', 'couple', 'us both', 'both of us')
  if (family && who.length < 2) who = ['men', 'women', 'kids']
  if (!who.length && !occ && !colour && !sizeIn(t) && !ITEMS.some(([w]) => word(t, `${w}|${w}s`))) {
    return {
      text: 'I can build you a look in seconds. Try something like “beach wedding in Watamu for my husband, under 3k” or “matching Eid outfits for the whole family in white”.',
    }
  }
  const guessed = !who.length
  if (guessed) who = ['men', 'women']

  const wantCat = ITEMS.find(([w]) => word(t, `${w}|${w}s`))?.[1]
  const size = sizeIn(t)
  const girl = who.includes('kids') && word(t, 'girl|girls|daughter|flower girl')
  const pool = (b: Branch, cats?: string[], strict = false) => {
    let list = products.filter((p) => p.branch === b && available(p))
    if (cats) {
      const c = list.filter((p) => cats.includes(p.category))
      if (c.length || strict) list = c
    }
    const sized = list.filter((p) => fitsSize(p, size))
    if (sized.length) list = sized
    return list
  }
  const narrow = (list: Product[], cap?: number, prefer?: string[]) => {
    if (colour) {
      const c = list.filter((p) => p.colours.some((x) => x.name === colour))
      if (c.length) list = c
    } else if (prefer) {
      const c = list.filter((p) => prefer.includes(p.colours[0].name))
      if (c.length) list = c
    }
    if (cap) {
      const c = list.filter((p) => p.price <= cap)
      if (c.length) list = c
    }
    return list
  }

  let picks: Product[] = []
  let outfit = false
  if (who.length === 1 && !wantCat) {
    // a full look: a top in the colour asked for, a neutral bottom to ground it, plus one alternative top
    const each = budget ? budget / 2 : undefined
    const tops = pickBest(narrow(pool(who[0], TOPS, true), each), occ?.cats, 2)
    const bottom = pickBest(narrow(pool(who[0], BOTTOMS, true), each, NEUTRAL), occ?.cats, 1)
    picks = [tops[0], bottom[0], tops[1]].filter(Boolean)
    outfit = !!(tops[0] && bottom[0])
  } else {
    picks = who.flatMap((b) => pickBest(narrow(pool(b, wantCat ? [wantCat] : undefined), budget ? budget / who.length : undefined), occ?.cats, who.length > 1 ? 1 : 3))
  }
  const total = outfit ? picks[0].price + picks[1].price : picks.slice(0, who.length > 1 ? picks.length : 1).reduce((a, p) => a + p.price, 0)

  const parts: string[] = []
  parts.push(occ ? `${occ.line}.` : outfit ? 'Here is a full look from what is on the rail right now.' : 'Here is what I would pull from the rail.')
  if (girl) parts.push('Kids Bayke is all boys’ linen at the moment, so these are for him. Tell us on WhatsApp and we will look out for girls’ pieces in the next drop.')
  if (outfit) parts.push(`The ${picks[0].name.toLowerCase()} with the ${picks[1].name.toLowerCase()} comes to ${kes(total)}${budget ? `, inside your ${kes(budget)} budget` : ''}.`)
  if (colour) parts.push(picks.some((p) => p.colours[0].name === colour) ? `I kept it in ${colour.toLowerCase()}.` : `Nothing in ${colour.toLowerCase()}${size ? ` in ${size}` : ''} right now, so these are the closest on the rail.`)
  if (size) parts.push(`Everything here fits ${size}.`)
  if (guessed) parts.push('Here is one for him and one for her. Tell me who it is for and I will narrow it down.')
  else if (who.length > 1) parts.push(`One piece for each of you, ${kes(total)} together${who.length >= 3 ? ', and with 3 pieces from different houses you save 10% as a family bundle' : ''}.`)
  else if (budget && !outfit) parts.push(`All within your ${kes(budget)} budget.`)
  if (picks[0] && !guessed) parts.push(`Every piece is one of one, so if you like the ${picks[0].name.toLowerCase()} in ${picks[0].sizes[0]}, do not wait.`)

  const actions = [] as { label: string; to: string }[]
  if (who.length >= 2) actions.push({ label: 'Build the full family look', to: '/family' })
  if (who.length === 1) actions.push({ label: `See all ${who[0] === 'men' ? 'menswear' : who[0] === 'women' ? 'womenswear' : 'kidswear'}`, to: `/shop/${who[0]}${colour ? `?colour=${encodeURIComponent(colour)}` : ''}` })
  return { text: parts.join(' '), products: picks, actions, branches: who }
}

export const STARTERS = [
  'Beach wedding in Diani for my husband, under 3k',
  'Matching Eid outfits for the whole family in white',
  'Office look in size L, I like navy',
  'What size am I? 178 cm, 80 kg',
]
