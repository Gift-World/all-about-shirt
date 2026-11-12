// Builds the real catalogue from the Instagram captions saved in scripts/ig/<house>.json.
// One product per caption line ("Name || Size || 1500/-"), one size each (every piece is one of one).
// Output: src/data/stock.gen.ts  +  scripts/ig/plan.json (which photos to crop and resize).
// usage: node scripts/build-catalog.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CAP = { men: 54, women: 54, kids: 60 } // photos per house
const SOLD_RE = /❌+\s*SOLD\s*❌+/i
const PRICE_RE = /(\d{3,4})\s*\/-/

const FIX = [
  [/\bcasula\b/gi, 'casual'], [/\bsirt\b/gi, 'shirt'], [/\bcarduroy\b/gi, 'corduroy'], [/\bline shorts\b/gi, 'linen shorts'],
  [/\btye n dye\b/gi, 'tie-dye'], [/\bblue navy\b/gi, 'navy'], [/\bover shirt\b/gi, 'overshirt'], [/\s{2,}/g, ' '],
]
const DROP_WORDS = /^(quality|stylish|classic|rich|soft)\s+/i

const COLOURS = [
  ['navy', /\b(navy|deep blue|midnight)\b/],
  ['cobalt', /\b(cobalt|royal blue|turquoise|teal|denim|blue)\b/],
  ['sky', /\b(sky|light blue|powder blue)\b/],
  ['olive', /\b(olive|jungle green|khaki green|forest|army)\b/],
  ['sage', /\b(sage|mint|green|lime)\b/],
  ['brown', /\b(brown|chocolate|coffee|mocha|tan)\b/],
  ['rust', /\b(rust|burgundy|red|maroon|wine)\b/],
  ['terracotta', /\b(orange|terracotta|mustard|amber)\b/],
  ['blush', /\b(pink|blush|rose|peach)\b/],
  ['lilac', /\b(lavender|lilac|purple)\b/],
  ['black', /\b(black|charcoal)\b/],
  ['stone', /\b(grey|gray|stone|silver)\b/],
  ['sand', /\b(beige|sand|khaki|camel|oatmeal|stone beige)\b/],
  ['oat', /\b(cream|ivory|oat|off ?white|offwhite|ecru|natural)\b/],
  ['white', /\b(white)\b/],
  ['lemon', /\b(yellow|lemon)\b/],
]
// nearest catalogue colour to the measured centre of the photo, for captions without a colour word
const HEX = { white: '#F3EFE6', oat: '#E2D6BF', sand: '#CDB68E', stone: '#ADA392', sage: '#A3AE92', olive: '#6B714E', sky: '#A7C0D3', navy: '#2B3850', cobalt: '#3A5BA0', brown: '#6B4A32', terracotta: '#B5623D', rust: '#934528', blush: '#E0B5A3', lilac: '#B9ADCB', lemon: '#E6D892', black: '#262522' }
const measured = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'ig', 'colours.json'), 'utf8').replace(/^\uFEFF/, ''))
  } catch {
    return {}
  }
})()
function nearest(rgb) {
  if (!rgb) return 'oat'
  let best = 'oat', d = Infinity
  for (const [k, h] of Object.entries(HEX)) {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
    const e = (c[0] - rgb[0]) ** 2 * 0.3 + (c[1] - rgb[1]) ** 2 * 0.59 + (c[2] - rgb[2]) ** 2 * 0.11
    if (e < d) (d = e), (best = k)
  }
  return best
}
const PATTERN = /\b(floral|striped|stripe|pinstripe|checkered|checked|plaid|tie-dye|print|printed|leopard|abstract)\b/i

function category(n) {
  if (/\b(dress)\b/.test(n)) return 'Dresses'
  if (/\b(skirt)\b/.test(n)) return 'Skirts'
  if (/\b(shorts?)\b/.test(n)) return 'Shorts'
  if (/\b(pants|trousers?|culottes|chinos|joggers|cargo)\b/.test(n)) return 'Trousers'
  if (/\b(jacket|blazer|suit|coat|cardigan)\b/.test(n)) return 'Outerwear'
  if (/\b(overshirt)\b/.test(n)) return 'Outerwear'
  if (/\b(top|blouse|cami|tee|t-shirt|tank)\b/.test(n)) return 'Tops'
  if (/\b(set|co-ord)\b/.test(n)) return 'Sets'
  return 'Shirts' // shirts, polos, kanzus and anything with a collar
}
function fabric(n, extra) {
  const t = `${n} ${extra}`.toLowerCase()
  if (/linen blend|linen-blend/.test(t)) return 'Linen blend'
  if (/linen/.test(t)) return /cotton/.test(t) ? 'Linen and cotton' : '100% linen'
  for (const [re, f] of [[/gauze/, 'Cotton gauze'], [/muslin/, 'Cotton muslin'], [/viscose/, 'Viscose'], [/corduroy/, 'Cotton corduroy'], [/denim/, 'Cotton denim'], [/flannel/, 'Brushed flannel'], [/knit/, 'Fine knit'], [/mesh/, 'Open mesh weave'], [/cotton/, '100% cotton']]) if (re.test(t)) return f
  return 'Linen blend'
}

const sentence = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** "Size 12/14" "W34 H44 L41" "M-L(Slimfit)" "Age 10-12 W24 L28" → { label, fits[], measure } */
function size(raw, house, cat) {
  const t = raw.replace(/\s+/g, ' ').trim()
  const num = (re) => {
    const m = t.match(re)
    if (!m) return undefined
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : undefined
    return b ? [a, b] : a
  }
  const W = num(/\bw\s*(\d{2})(?:\s*[-–]\s*(\d{2}))?/i)
  const H = num(/\bh\s*(\d{2})(?:\s*[-–]\s*(\d{2}))?/i)
  const L = num(/\bl\s*(\d{2})(?:\s*[-–]\s*(\d{2}))?/i)
  const measure = {}
  if (W) measure.waist = W
  if (H) measure.hips = H
  if (L) measure.length = L
  const slim = /slim/i.test(t)
  if (house === 'kids') {
    const a = t.match(/age\s*(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?/i)
    if (a) {
      const lo = Number(a[1]), hi = a[2] ? Number(a[2]) : lo
      const fits = []
      for (let y = lo; y <= hi; y++) fits.push(`${y}Y`)
      return { label: lo === hi ? `${lo}Y` : `${lo}–${hi}Y`, fits, measure, slim }
    }
    if (W) {
      return { label: `W${Array.isArray(W) ? W.join('–') : W}`, fits: [], measure, slim }
    }
    return { label: 'One size', fits: [], measure, slim }
  }
  // waist-sized bottoms
  if (W && (cat === 'Trousers' || cat === 'Shorts' || cat === 'Skirts')) {
    const ws = Array.isArray(W) ? W : [W]
    const fits = []
    for (let w = ws[0]; w <= ws[ws.length - 1]; w += 1) if (w % 2 === 0) fits.push(`W${w}`)
    if (!fits.length) fits.push(`W${ws[0] + 1}`)
    return { label: `W${ws.join('–')}`, fits, measure, slim }
  }
  // UK numeric (women)
  const uk = t.match(/(?:size\s*)?\b(\d{1,2})(?:\s*[/\-–]\s*(\d{1,2}))?\b/i)
  if (house === 'women' && uk && Number(uk[1]) >= 4 && Number(uk[1]) <= 30) {
    const a = Number(uk[1]), b = uk[2] ? Number(uk[2]) : a
    const fits = []
    for (let s = a; s <= b; s += 2) fits.push(`UK ${s}`)
    return { label: a === b ? `UK ${a}` : `UK ${a}/${b}`, fits, measure, slim }
  }
  // letter sizes, men and women
  const ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
  const norm = (s) => s.toUpperCase().replace('XXXL', '3XL').replace('XXL', '2XL')
  const clean = norm(t.replace(/size/i, '').replace(/\(.*?\)/g, '').replace(/\s/g, ''))
  let m = clean.match(/^(\d)?-?(\d)XL$/) // 2-3XL
  if (m && m[1]) return { label: `${m[1]}XL–${m[2]}XL`, fits: [`${m[1]}XL`, `${m[2]}XL`], measure, slim }
  m = clean.match(/^(XS|S|M|L|XL|2XL|3XL|4XL)(?:[-–/](XS|S|M|L|XL|2XL|3XL|4XL))?/)
  if (m) {
    const a = ORDER.indexOf(m[1]), b = m[2] ? ORDER.indexOf(m[2]) : a
    const fits = ORDER.slice(a, b + 1)
    return { label: a === b ? m[1] : `${m[1]}–${m[2]}`, fits, measure, slim }
  }
  return { label: t.replace(/^size\s*/i, '') || 'One size', fits: [], measure, slim }
}

function parseCaption(alt, house) {
  const GARMENT = /\b(shirt|shirts|pants|trousers?|top|dress|skirt|shorts?|jacket|overshirt|polo|cardigan|culottes|set|tee|blouse|cami|chinos|joggers|kanzu|tunic)\b/i
  const SIZEISH = /\b(w\s?\d{2}|size|age\s?\d|uk\s?\d|\d?x{0,3}l\b|\bs\b|\bm\b)/i
  const isItem = (l) => GARMENT.test(l.split('|')[0]) && (SIZEISH.test(l) || PRICE_RE.test(l))
  const lines = alt.replace(/[❌✅]+\s*RSVD\s*[❌✅]+/gi, '').split('\n').map((l) => l.trim())
  // kids and some women captions put the size or price on their own lines: glue them back onto the item line
  const glued = []
  let lastItem = -1
  for (const l of lines) {
    const barePrice = /^\d{3,4}\s*\/-/.test(l)
    const bareSize = /^(w\s?\d{2}|age\s?\d)/i.test(l) && !PRICE_RE.test(l) && lastItem === glued.length - 1
    if ((barePrice || bareSize) && lastItem >= 0 && !PRICE_RE.test(glued[lastItem])) {
      glued[lastItem] += ` ${l}`
      continue
    }
    glued.push(l)
    if (isItem(l)) lastItem = glued.length - 1
  }
  const items = []
  const prose = []
  let cur = null
  for (const line of glued) {
    if (!line) continue
    if (PRICE_RE.test(line) && /[a-z]/i.test(line.replace(SOLD_RE, '').replace(/price\s*:?/i, ''))) {
      const sold = SOLD_RE.test(line)
      let s = line.replace(SOLD_RE, ' ').trim()
      const price = Number(s.match(PRICE_RE)[1])
      const [head, tail = ''] = s.split(PRICE_RE).filter((_, i) => i !== 1)
      let parts = head.split(/\|\|?/).map((x) => x.trim()).filter(Boolean)
      let name = parts[0]
      let sizeRaw = parts.slice(1).join(' ')
      // kids: "Blue Denim pants (W24 L30)" or "Linen pants |W30 L35"
      const paren = name.match(/\(([^)]+)\)/)
      if (paren) {
        sizeRaw = `${paren[1]} ${sizeRaw}`
        name = name.replace(paren[0], '')
      }
      const age = name.match(/\bage\s*\d.*$/i)
      if (age) {
        sizeRaw = `${age[0]} ${sizeRaw}`
        name = name.replace(age[0], '')
      }
      // "Black linen pants W40 H52 L39": size written straight after the name
      const inline = name.match(/\s(w\s?\d{2}\b.*)$/i)
      if (inline) {
        sizeRaw = `${inline[1]} ${sizeRaw}`
        name = name.replace(inline[0], '')
      }
      for (const [re, to] of FIX) name = name.replace(re, to)
      name = name.replace(DROP_WORDS, '').replace(DROP_WORDS, '').replace(/[|:\-–\s]+$/, '').trim()
      if (!name || !GARMENT.test(name) || name.split(/\s+/).length < 2) continue
      cur = { name: sentence(name), sizeRaw: sizeRaw.trim(), price, sold, features: [], tail: tail.trim() }
      if (cur.tail) cur.features.push(...cur.tail.split(/\|\|?/).map((x) => x.trim()).filter(Boolean))
      items.push(cur)
    } else if (/^#|dm to order|^price/i.test(line)) {
      continue
    } else if (line.includes('||') && cur) {
      cur.features.push(...line.split('||').map((x) => x.trim()).filter(Boolean))
    } else if (line.length > 18 && !line.startsWith('@')) {
      const clean = line.replace(/\p{Extended_Pictographic}|\u200d|\ufe0f/gu, '').trim()
      if (cur) cur.story = cur.story ? `${cur.story} ${clean}` : clean
      else prose.push(line)
    }
  }
  if (!items.length && SOLD_RE.test(alt) && house !== 'kids') return { items, prose }
  return { items, prose }
}

const TEMPLATES = {
  Shirts: [
    (i) => `A ${i}, hand picked from a UK bale and pressed at Shop 305. Wear it buttoned for the office or open over a tee on the weekend.`,
    (i) => `Light on the skin and easy to wear, this ${i} breathes in the Nairobi heat and only gets softer with every wash.`,
    (i) => `Clean collar, relaxed drape. This ${i} is one of one, so the size you see is the only one we have.`,
  ],
  Trousers: [
    (i) => `${sentence(i)} with an easy leg and room to move. Pair them with any shirt on the rail for a full linen look.`,
    (i) => `Breezy ${i} that keep you cool from the matatu to the meeting. Measured flat before listing.`,
  ],
  Shorts: [(i) => `${sentence(i)} cut for the coast and long weekends.`],
  Tops: [(i) => `A light ${i}. Tuck it into wide legs or wear it loose over shorts.`],
  Dresses: [(i) => `A ${i} you can throw on with sandals and be done.`],
  Skirts: [(i) => `A soft ${i} that moves when you do.`],
  Outerwear: [(i) => `A ${i} for cool Nairobi mornings and evenings out. Layers easily over a shirt or tee.`],
  Sets: [(i) => `A matching ${i}. Wear it together or split it up.`],
}
const FIT = { Shirts: 'Relaxed through the body', Trousers: 'Straight leg', Shorts: 'Above the knee', Tops: 'Relaxed', Dresses: 'Easy, relaxed', Skirts: 'Elastic waist', Outerwear: 'Roomy, layers over a shirt', Sets: 'Relaxed' }

const products = []
const plan = []
const editorial = { men: [], women: [], kids: [] }
const used = new Set()

for (const house of ['men', 'women', 'kids']) {
  const posts = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'ig', `${house}.json`), 'utf8'))
  let photos = 0
  posts.forEach((post, order) => {
    const { items, prose } = parseCaption(post.alt || '', house)
    const img = `/p/${house}/${post.code}`
    if (!items.length) {
      if (editorial[house].length < 8 && post.alt && !post.reel) {
        editorial[house].push({ id: `${img}.jpg`, caption: (prose[0] || '').replace(/[#@].*$/, '').trim().slice(0, 120) })
        plan.push({ house, code: post.code, crops: false })
      }
      return
    }
    if (photos >= CAP[house]) return
    photos++
    plan.push({ house, code: post.code, crops: true })
    const group = []
    items.forEach((it, k) => {
      const cat = category(it.name.toLowerCase())
      const sz = size(it.sizeRaw, house, cat)
      const col = COLOURS.find(([, re]) => re.test(it.name.toLowerCase()))?.[0] ?? (items.length === 1 ? nearest(measured[post.code]) : 'oat')
      const pattern = it.name.match(PATTERN)?.[1]?.toLowerCase()
      const fab = fabric(it.name, it.features.join(' '))
      const fitFeature = it.features.find((f) => /fit|silhouette|cut|leg\b/i.test(f))
      const t = TEMPLATES[cat] ?? TEMPLATES.Shirts
      const base = t[(order + k) % t.length](it.name.toLowerCase())
      const featureText = it.features.filter((f) => f !== fitFeature).slice(0, 4).join(', ')
      const description = [it.story, featureText ? `${sentence(featureText)}.` : '', it.story || featureText ? '' : base].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
      let slug = slugify(`${it.name} ${sz.label}`)
      while (used.has(slug)) slug += '-2'
      used.add(slug)
      const p = {
        slug,
        name: it.name,
        branch: house,
        category: cat,
        price: it.price,
        colour: col,
        pattern: pattern || undefined,
        size: sz.label,
        fits: sz.fits,
        measure: Object.keys(sz.measure).length ? sz.measure : undefined,
        sold: it.sold || undefined,
        fabric: fab,
        fit: fitFeature ? sentence(fitFeature) : sz.slim ? 'Slim fit' : FIT[cat],
        description,
        ig: post.code,
        img,
        order,
        k,
      }
      group.push(p)
      products.push(p)
    })
    if (group.length > 1) for (const p of group) p.with = group.filter((x) => x !== p).map((x) => x.slug)
  })
}

const banner = '// GENERATED by scripts/build-catalog.mjs from the public Instagram posts of @all_aboutlinen, @lady_linen and @kids_bayke.\n// Do not edit by hand. Re-run the script after new posts.\n'
fs.writeFileSync(
  path.join(root, 'src', 'data', 'stock.gen.ts'),
  `${banner}import type { RealSeed } from './catalog'\n\nexport const REAL: RealSeed[] = ${JSON.stringify(products, null, 1)}\n\nexport const EDITORIAL = ${JSON.stringify(editorial, null, 1)} as const\n`,
)
fs.writeFileSync(path.join(root, 'scripts', 'ig', 'plan.json'), JSON.stringify(plan))
const by = (h) => products.filter((p) => p.branch === h)
console.log('products', products.length, 'men', by('men').length, 'women', by('women').length, 'kids', by('kids').length, 'sold', products.filter((p) => p.sold).length, 'photos', plan.length)
