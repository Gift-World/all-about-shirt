// SAMPLE back office data for the pitch. Orders are built from the real pieces that sold on
// Instagram, so every receipt, report and alert points at stock that actually exists.
// Customer names, phone numbers, payment references and money figures are invented.
import { branches, delivery, kes, products, type Branch, type Product } from './catalog'
import { ESTATES } from './delivery'
import { isSold } from './extras'

const seed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export type PayMethod = 'M-Pesa' | 'M-Pesa on WhatsApp' | 'Card' | 'Cash at Shop 305'
export type PayStatus = 'Paid' | 'Awaiting payment' | 'Refunded'
export type RiderStatus = 'Packing' | 'With rider' | 'Delivered' | 'Collected'

export type OrderItem = { id: string; name: string; size: string; price: number; qty: number }
export type AdminOrder = {
  id: string
  placed: number // epoch ms
  customer: string
  phone: string // masked, never a real number
  estate: string
  landmark: string
  method: PayMethod
  ref: string
  status: PayStatus
  rider: RiderStatus
  deliveryFee: number
  discount: number
  items: OrderItem[]
  viaStylist: boolean
  live?: boolean // placed on this device through the real checkout
}

const CUSTOMERS = [
  ['Brian Otieno', 'Kilimani', 'Yaya Centre, Argwings Kodhek Rd'],
  ['Wanjiru Kamau', 'Runda', 'Mimosa Drive, Gate B'],
  ['Amina Yusuf', 'South B', 'Capital Centre, Mombasa Rd'],
  ['Kevin Mutua', 'Westlands', 'Sarit Centre, Karuna Rd'],
  ['Grace Njeri', 'Karen', 'The Hub Karen, Dagoretti Rd'],
  ['Hassan Abdalla', 'Parklands', 'Diamond Plaza, 4th Parklands Ave'],
  ['Faith Achieng', 'Lavington', 'Valley Arcade, Gitanga Rd'],
  ['Dennis Kiprop', 'Upper Hill', 'Britam Tower reception'],
  ['Mercy Wambui', 'Kileleshwa', 'Kasuku Centre, Mandera Rd'],
  ['Collins Wafula', 'Kasarani', 'Thika Road Mall, gate C'],
  ['Lucy Chebet', 'Syokimau', 'Gateway Mall, Mombasa Rd'],
  ['Samuel Njoroge', 'Lang’ata', 'Galleria Mall, Lang’ata Rd'],
  ['Halima Said', 'Westlands', 'The Mall, Ring Rd'],
  ['Joy Atieno', 'Kilimani', 'Adlife Plaza, Chania Ave'],
] as const

const maskPhone = (r: () => number) => `07${Math.floor(r() * 10)}${Math.floor(r() * 10)} ••• ${String(100 + Math.floor(r() * 900))}`
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
const mpesaRef = (r: () => number) => 'SK' + Array.from({ length: 8 }, () => REF_CHARS[Math.floor(r() * REF_CHARS.length)]).join('')

const fee = (estate: string) => {
  const e = ESTATES.find((x) => x.name === estate)
  return e && e.mins >= 45 ? 450 : 350
}

const line = (p: Product): OrderItem => ({ id: p.id, name: p.name, size: p.sizes[0], price: p.price, qty: 1 })

/** Orders built from the pieces that really sold, newest first, plus a few still being paid for. */
function buildOrders(): AdminOrder[] {
  const r = seed('orders')
  const sold = products.filter(isSold).sort((a, b) => a.addedDaysAgo - b.addedDaysAgo)
  const out: AdminOrder[] = []
  let i = 0
  let hoursAgo = 2
  while (i < sold.length) {
    // pieces shot together are often bought together
    const p = sold[i]
    const partner = p.with?.map((s) => sold.find((x) => x.slug === s)).find(Boolean)
    const items = partner && !out.some((o) => o.items.some((it) => it.id === partner.id)) ? [p, partner] : [p]
    if (out.some((o) => o.items.some((it) => it.id === p.id))) {
      i++
      continue
    }
    const [customer, estate, landmark] = CUSTOMERS[out.length % CUSTOMERS.length]
    const m = r()
    const method: PayMethod = m < 0.62 ? 'M-Pesa' : m < 0.86 ? 'M-Pesa on WhatsApp' : m < 0.95 ? 'Card' : 'Cash at Shop 305'
    const pickup = method === 'Cash at Shop 305'
    const sub = items.reduce((a, x) => a + x.price, 0)
    out.push({
      id: `AAL-${String(10480 - out.length * 3)}`,
      placed: Date.now() - hoursAgo * 3600000,
      customer,
      phone: maskPhone(r),
      estate: pickup ? 'Shop 305' : estate,
      landmark: pickup ? 'Collected at Platinum Plaza, Shop 305' : landmark,
      method,
      ref: method === 'Card' ? `CARD-${4000 + Math.floor(r() * 5000)}` : method === 'Cash at Shop 305' ? 'CASH' : mpesaRef(r),
      status: 'Paid',
      rider: pickup ? 'Collected' : out.length < 2 ? 'With rider' : out.length < 3 ? 'Packing' : 'Delivered',
      deliveryFee: pickup || sub >= delivery.freeOver ? 0 : fee(estate),
      discount: out.length % 5 === 3 ? Math.round(sub * 0.1) : 0,
      items: items.map(line),
      viaStylist: r() < 0.38,
    })
    hoursAgo += 3 + Math.floor(r() * 9)
    i++
  }
  // two fresh orders still waiting for M-Pesa confirmation
  const open = products.filter((p) => !isSold(p)).slice(2, 4)
  open.forEach((p, k) => {
    const [customer, estate, landmark] = CUSTOMERS[(out.length + k) % CUSTOMERS.length]
    out.unshift({
      id: `AAL-${10483 + k}`,
      placed: Date.now() - (k + 1) * 25 * 60000,
      customer,
      phone: maskPhone(r),
      estate,
      landmark,
      method: 'M-Pesa on WhatsApp',
      ref: 'Waiting for code',
      status: 'Awaiting payment',
      rider: 'Packing',
      deliveryFee: fee(estate),
      discount: 0,
      items: [line(p)],
      viaStylist: k === 0,
    })
  })
  // one refund, so the ledger shows the full picture
  const last = out[out.length - 1]
  if (last) last.status = 'Refunded'
  return out
}
export const SAMPLE_ORDERS = buildOrders()

export const orderSubtotal = (o: AdminOrder) => o.items.reduce((a, it) => a + it.price * it.qty, 0)
export const orderTotal = (o: AdminOrder) => Math.max(0, orderSubtotal(o) + o.deliveryFee - o.discount)

/* ───────────── Sales over time (sample) ───────────── */
export type Period = '7D' | '30D' | '90D' | 'YTD'
type Day = { date: Date; revenue: number; orders: number; stylist: number; mpesa: number }

const DAYS: Day[] = (() => {
  const r = seed('days')
  const out: Day[] = []
  const today = new Date()
  const start = new Date(today.getFullYear(), 0, 1)
  const total = Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1
  for (let d = total - 1; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 86400000)
    const growth = 0.55 + 0.45 * ((total - d) / total) // the year has been building up
    const friday = date.getDay() === 5 ? 1.9 : date.getDay() === 6 ? 1.4 : date.getDay() === 0 ? 0.7 : 1
    const orders = Math.max(1, Math.round((3 + r() * 4) * growth * friday))
    const revenue = Math.round(orders * (1900 + r() * 1100) / 10) * 10
    const stylist = Math.round(revenue * (d < 60 ? 0.3 + r() * 0.12 : 0.05 + r() * 0.05))
    out.push({ date, revenue, orders, stylist, mpesa: Math.round(orders * (0.82 + r() * 0.1)) })
  }
  return out
})()

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function metrics(period: Period) {
  const n = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : DAYS.length
  const days = DAYS.slice(-n)
  const prev = DAYS.slice(-2 * n, -n)
  const sum = (a: Day[], k: keyof Omit<Day, 'date'>) => a.reduce((x, d) => x + d[k], 0)
  const revenue = sum(days, 'revenue')
  const prevRevenue = sum(prev, 'revenue')
  const orders = sum(days, 'orders')
  // bucket for the chart
  let buckets: { label: string; revenue: number; stylist: number }[]
  if (period === '7D') buckets = days.map((d) => ({ label: d.date.toLocaleDateString('en-KE', { weekday: 'short' }), revenue: d.revenue, stylist: d.stylist }))
  else if (period === '30D' || period === '90D') {
    const size = period === '30D' ? 7 : 15
    buckets = []
    for (let i = days.length; i > 0; i -= size) {
      const chunk = days.slice(Math.max(0, i - size), i)
      buckets.unshift({ label: chunk[0].date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), revenue: sum(chunk, 'revenue'), stylist: sum(chunk, 'stylist') })
    }
  } else {
    const by = new Map<number, Day[]>()
    for (const d of days) by.set(d.date.getMonth(), [...(by.get(d.date.getMonth()) ?? []), d])
    buckets = [...by.entries()].map(([m, a]) => ({ label: MONTHS[m], revenue: sum(a, 'revenue'), stylist: sum(a, 'stylist') }))
  }
  return {
    revenue,
    change: prev.length ? Math.round(((revenue - prevRevenue) / Math.max(1, prevRevenue)) * 1000) / 10 : null,
    orders,
    aov: Math.round(revenue / Math.max(1, orders)),
    stylist: sum(days, 'stylist'),
    mpesaShare: Math.round((sum(days, 'mpesa') / Math.max(1, orders)) * 100),
    buckets,
  }
}

/* ───────────── Expenses (sample) ───────────── */
export type Expense = { id: string; date: string; category: ExpenseCategory; desc: string; amount: number }
export const EXPENSE_CATEGORIES = ['Ex UK bale restock', 'Rider payouts', 'Packaging and tags', 'Steaming and repairs', 'Instagram ads', 'Shop 305 rent', 'Airtime and data'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
const dayLabel = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
export const SAMPLE_EXPENSES: Expense[] = [
  { id: 'e1', date: dayLabel(0), category: 'Rider payouts', desc: 'Same day runs: Kilimani, Westlands, Karen', amount: 2100 },
  { id: 'e2', date: dayLabel(1), category: 'Ex UK bale restock', desc: 'Mixed linen bale, 45 kg, Gikomba', amount: 38500 },
  { id: 'e3', date: dayLabel(2), category: 'Instagram ads', desc: 'Friday drop boost, @lady_linen', amount: 1500 },
  { id: 'e4', date: dayLabel(3), category: 'Packaging and tags', desc: 'Kraft mailers and woven tags, 200 pcs', amount: 4200 },
  { id: 'e5', date: dayLabel(5), category: 'Steaming and repairs', desc: 'Buttons and small hem repairs, 9 pieces', amount: 1350 },
  { id: 'e6', date: dayLabel(9), category: 'Shop 305 rent', desc: 'Platinum Plaza, monthly', amount: 25000 },
  { id: 'e7', date: dayLabel(12), category: 'Airtime and data', desc: 'WhatsApp business line', amount: 1000 },
]

/* ───────────── Stylist intelligence (sample counts, real answers) ───────────── */
export const STYLIST_QUESTIONS = [
  { q: 'Beach wedding in Diani for my husband, under 3k', asked: 184 },
  { q: 'Office look in size L, I like navy', asked: 141 },
  { q: 'Wide leg pants for me size W30', asked: 122 },
  { q: 'Matching Eid outfits for the whole family in white', asked: 97 },
  { q: 'Birthday party for my son, 6 years old, budget 2000', asked: 63 },
  { q: 'Date night outfit for him in black', asked: 58 },
]
export const STYLIST_HOURS = [2, 1, 1, 0, 0, 1, 2, 4, 6, 7, 8, 8, 9, 8, 7, 7, 8, 9, 11, 13, 14, 12, 8, 4] // share of chats per hour

/* ───────────── Fittings, exchanges ───────────── */
export type Visit = { id: string; client: string; phone: string; when: string; focus: string; status: 'Booked' | 'Confirmed' | 'Done' }
export const SAMPLE_VISITS: Visit[] = [
  { id: 'FIT-118', client: 'Dennis Kiprop', phone: '0733 ••• 117', when: 'Today, 3:30pm', focus: 'Groom party: 5 linen shirts, L to 3XL, plus beige pants', status: 'Confirmed' },
  { id: 'FIT-117', client: 'The Wambugu family', phone: '0711 ••• 809', when: 'Tomorrow, 11:00am', focus: 'Dress the family in white: him, her and two boys aged 6 and 10', status: 'Booked' },
  { id: 'FIT-116', client: 'Grace Njeri', phone: '0720 ••• 823', when: 'Sat, 2:00pm', focus: 'Wide legs: tries W30 to W34 from the latest drop', status: 'Booked' },
  { id: 'FIT-115', client: 'Kevin Mutua', phone: '0798 ••• 609', when: 'Yesterday, 5:00pm', focus: 'Office shirts in XL', status: 'Done' },
]
export type Swap = { id: string; client: string; action: string; status: 'Rider to collect' | 'At Shop 305' | 'Done' }
export const SAMPLE_SWAPS: Swap[] = [
  { id: 'EX-41', client: 'Brian Otieno', action: 'Exchange W32 navy pants for a W34 pair from the rail', status: 'Rider to collect' },
  { id: 'TH-40', client: 'Wanjiru Kamau', action: 'Try at home: kept 2 of 3 pieces, rider returning 1 shirt', status: 'At Shop 305' },
  { id: 'EX-39', client: 'Amina Yusuf', action: 'Store credit KES 1,650 for UK 12 shirt, chose a UK 14', status: 'Done' },
]

/* ───────────── VIP size book ───────────── */
export type Vip = { id: string; name: string; phone: string; house: Branch; sizes: string[]; notes: string; spend: number; orders: number }
export const SAMPLE_VIPS: Vip[] = [
  { id: 'v1', name: 'Hon. Samuel Karanja', phone: '0721 ••• 882', house: 'men', sizes: ['3XL'], notes: 'Muthaiga. Long sleeve linen for work, no prints', spend: 18400, orders: 14 },
  { id: 'v2', name: 'Brian Otieno', phone: '0733 ••• 117', house: 'men', sizes: ['XL', 'W34'], notes: 'Kilimani. Buys a shirt and pants every Friday drop', spend: 15600, orders: 11 },
  { id: 'v3', name: 'Kevin Mutua', phone: '0798 ••• 609', house: 'men', sizes: ['L', 'W32'], notes: 'Westlands. Navy, olive, white', spend: 9900, orders: 7 },
  { id: 'v4', name: 'Grace Njeri', phone: '0720 ••• 823', house: 'women', sizes: ['W30', 'W32'], notes: 'Karen. Wide legs only, 5′10″, needs L40+', spend: 13200, orders: 8 },
  { id: 'v5', name: 'Wanjiru Kamau', phone: '0711 ••• 390', house: 'women', sizes: ['UK 14', 'W34'], notes: 'Runda. Shirts in bright colours', spend: 11800, orders: 9 },
  { id: 'v6', name: 'Faith Achieng', phone: '0722 ••• 441', house: 'women', sizes: ['UK 12'], notes: 'Lavington. Sleeveless tops for the coast', spend: 7200, orders: 6 },
  { id: 'v7', name: 'Aisha Mohamed', phone: '0712 ••• 556', house: 'kids', sizes: ['10Y', '12Y'], notes: 'Mombasa, courier. Twins, buys two of everything close in style', spend: 8600, orders: 10 },
  { id: 'v8', name: 'Joy Atieno', phone: '0745 ••• 228', house: 'kids', sizes: ['6Y'], notes: 'Kilimani. Smart shirts for church', spend: 4300, orders: 5 },
]

/** Pieces on the rail right now that fit a VIP, so the drop alert lists real stock. */
export const piecesFor = (v: Vip) =>
  products.filter((p) => !isSold(p) && p.branch === v.house && (p.fits?.length ? p.fits : p.sizes).some((s) => v.sizes.includes(s)))

/* ───────────── Caption parser (same rules as scripts/build-catalog.mjs, one line at a time) ───────────── */
export type Draft = { name: string; size: string; price: number; category: string; colour: string; sold: boolean; house: Branch }
const COLOUR_WORDS: [string, RegExp][] = [
  ['Navy', /navy|deep blue/], ['Cobalt', /cobalt|royal blue|turquoise|teal|blue/], ['Olive', /olive|jungle green/], ['Sage', /sage|mint|green|lime/],
  ['Chocolate', /brown|chocolate|coffee/], ['Rust', /rust|burgundy|red|maroon/], ['Terracotta', /orange|terracotta|mustard/], ['Blush', /pink|blush|peach/],
  ['Lilac', /lavender|lilac|purple/], ['Charcoal', /black|charcoal/], ['Stone', /grey|gray/], ['Sand', /beige|sand|khaki|oatmeal/], ['Oat', /cream|ivory|off ?white/],
  ['Chalk white', /white/], ['Lemon', /yellow|lemon/],
]
export function parseCaption(text: string, house: Branch): Draft[] {
  const out: Draft[] = []
  const lines = text.split('\n').map((l) => l.trim())
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i]
    if (/^\d{3,4}\s*\/-/.test(lines[i + 1] ?? '') && !/\d{3,4}\s*\/-/.test(l)) l = `${l} ${lines[++i]}`
    const m = l.match(/(\d{3,4})\s*\/-/)
    if (!m) continue
    const sold = /sold/i.test(l)
    const head = l.replace(/[❌✅]+\s*(sold|rsvd)\s*[❌✅]+/gi, '').split(m[0])[0]
    const parts = head.split(/\|\|?/).map((s) => s.trim()).filter(Boolean)
    const name = (parts[0] ?? '').replace(/^(quality|stylish|classic)\s+/i, '').trim()
    if (name.split(/\s+/).length < 2) continue
    const t = name.toLowerCase()
    const category = /pants|trouser|culotte/.test(t) ? 'Trousers' : /shorts?\b/.test(t) ? 'Shorts' : /dress/.test(t) ? 'Dresses' : /skirt/.test(t) ? 'Skirts' : /top|blouse|cami/.test(t) ? 'Tops' : /jacket|overshirt|cardigan/.test(t) ? 'Outerwear' : 'Shirts'
    out.push({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      size: parts.slice(1).join(' ').replace(/^size\s*/i, '') || 'Ask',
      price: Number(m[1]),
      category,
      colour: COLOUR_WORDS.find(([, re]) => re.test(t))?.[0] ?? 'Check photo',
      sold,
      house,
    })
  }
  return out
}
export const SAMPLE_CAPTION = `Navy linen shirt || Size L || 1200/-
Beige linen pants || W34 L41 || 1500/-
❌SOLD❌ Olive green linen pants || W32 L38 || 1500/-`

/* ───────────── Reports from the real catalogue ───────────── */
export function catalogueReport() {
  const live = products.filter((p) => !isSold(p))
  const sold = products.filter(isSold)
  const byHouse = (['men', 'women', 'kids'] as Branch[]).map((b) => {
    const all = products.filter((p) => p.branch === b)
    const s = all.filter(isSold)
    return { house: branches[b].house, branch: b, listed: all.length, sold: s.length, value: all.filter((p) => !isSold(p)).reduce((a, p) => a + p.price, 0), sellThrough: Math.round((s.length / Math.max(1, all.length)) * 100) }
  })
  const count = (list: Product[], key: (p: Product) => string) => {
    const m = new Map<string, number>()
    for (const p of list) m.set(key(p), (m.get(key(p)) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  return {
    live: live.length,
    sold: sold.length,
    railValue: live.reduce((a, p) => a + p.price, 0),
    byHouse,
    soldSizes: count(sold, (p) => p.sizes[0]).slice(0, 8),
    railSizes: count(live, (p) => p.sizes[0]).slice(0, 8),
    soldColours: count(sold, (p) => p.colours[0].name).slice(0, 6),
    categories: count(live, (p) => p.category),
    oldest: [...live].sort((a, b) => b.addedDaysAgo - a.addedDaysAgo).slice(0, 5),
  }
}

export const money = kes
