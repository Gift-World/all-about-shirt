// Owner back office for the pitch: /admin
// Everything here runs in the browser on sample data built around the real catalogue.
// A live version would read orders from the checkout, M-Pesa (Daraja) callbacks and a database.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft, ArrowsClockwise, ChartBar, Check, DownloadSimple, InstagramLogo, LockSimple, MagnifyingGlass, Moped, Plus, Printer, Receipt,
  Sparkle, Storefront, Trash, UsersThree, WhatsappLogo, Wallet, Package, CalendarCheck,
} from '@phosphor-icons/react'
import { branches, byId, delivery, products, store, type Branch, type Product } from '../data/catalog'
import { isSold } from '../data/extras'
import { think } from '../lib/stylist'
import { Photo } from '../components/ui'
import type { Order } from './Checkout'
import {
  catalogueReport, EXPENSE_CATEGORIES, metrics, money, orderSubtotal, orderTotal, parseCaption, piecesFor, SAMPLE_CAPTION, SAMPLE_EXPENSES,
  SAMPLE_ORDERS, SAMPLE_SWAPS, SAMPLE_VIPS, SAMPLE_VISITS, STYLIST_HOURS, STYLIST_QUESTIONS,
  type AdminOrder, type Draft, type Expense, type ExpenseCategory, type PayMethod, type Period, type RiderStatus, type Swap, type Visit,
} from '../data/admin'

const PIN = '2540' // demo PIN for the pitch. Real protection needs a login on a server.
const STORE_KEY = 'aal-admin-v1'
const SITE = 'https://allaboutlinen-ke.vercel.app'

type Tab = 'overview' | 'payments' | 'receipts' | 'reports' | 'stylist' | 'inventory' | 'visits' | 'vips'
const TABS: { id: Tab; label: string; icon: typeof ChartBar }[] = [
  { id: 'overview', label: 'Overview', icon: ChartBar },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: ChartBar },
  { id: 'stylist', label: 'AI stylist', icon: Sparkle },
  { id: 'inventory', label: 'Stock and IG', icon: Package },
  { id: 'visits', label: 'Fittings and swaps', icon: CalendarCheck },
  { id: 'vips', label: 'VIP size book', icon: UsersThree },
]

type Saved = { orders: AdminOrder[]; expenses: Expense[]; visits: Visit[]; swaps: Swap[]; drafts: Draft[]; soldOverride: Record<string, boolean> }
const fresh = (): Saved => ({ orders: SAMPLE_ORDERS, expenses: SAMPLE_EXPENSES, visits: SAMPLE_VISITS, swaps: SAMPLE_SWAPS, drafts: [], soldOverride: {} })
function load(): Saved {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw) }
  } catch {
    /* storage blocked: use fresh sample data */
  }
  return fresh()
}

/** The order placed through the real checkout on this device, shown at the top of the ledger. */
function liveOrder(): AdminOrder | null {
  try {
    const o = JSON.parse(sessionStorage.getItem('aal-order') || 'null') as Order | null
    if (!o) return null
    const method: PayMethod = /m-?pesa/i.test(o.pay) ? 'M-Pesa' : /card/i.test(o.pay) ? 'Card' : 'Cash at Shop 305'
    return {
      id: o.id,
      placed: Date.parse(o.placed) || Date.now(),
      customer: o.name || 'Website customer',
      phone: o.phone ? `${o.phone.replace(/\D/g, '').slice(0, 4)} ••• ${o.phone.replace(/\D/g, '').slice(-3)}` : '—',
      estate: o.area ?? 'Nairobi',
      landmark: o.area ? `${o.area} (from checkout)` : 'From checkout',
      method,
      ref: method === 'M-Pesa' ? 'STK sent' : method === 'Card' ? 'Card' : 'Pay on pickup',
      status: method === 'Cash at Shop 305' ? 'Awaiting payment' : 'Paid',
      rider: 'Packing',
      deliveryFee: o.fee,
      discount: o.discount,
      items: o.lines.map((l) => {
        const p = byId(l.id)
        return { id: l.id, name: p?.name ?? l.id, size: l.size, price: p?.price ?? 0, qty: l.qty }
      }),
      viaStylist: false,
      live: true,
    }
  } catch {
    return null
  }
}

const when = (t: number) => {
  const d = new Date(t)
  const today = new Date().toDateString() === d.toDateString()
  return `${today ? 'Today' : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })}`
}
/** Opens WhatsApp with the message ready. The owner picks the chat, so no number is ever stored here. */
const openWhatsApp = (text: string) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

/* ═════════════ Gate ═════════════ */
export function Admin() {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem('aal-admin') === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.title = 'Owner studio | All About Linen'
  }, [])
  const unlock = () => {
    try {
      sessionStorage.setItem('aal-admin', '1')
    } catch {
      /* ignore */
    }
    setOpen(true)
  }
  const lock = () => {
    try {
      sessionStorage.removeItem('aal-admin')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }
  return open ? <Studio onLock={lock} /> : <PinGate onUnlock={unlock} />
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [wrong, setWrong] = useState(false)
  const submit = (v: string) => {
    if (v === PIN) onUnlock()
    else if (v.length >= 4) {
      setWrong(true)
      setTimeout(() => {
        setWrong(false)
        setPin('')
      }, 700)
    }
  }
  return (
    <div className="grid min-h-svh place-items-center bg-ink px-4 text-bone">
      <motion.div animate={wrong ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-sm rounded-[28px] bg-paper p-8 text-center text-ink">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink text-bone"><LockSimple size={24} /></span>
        <p className="eyebrow mt-6 text-mute">All About Linen</p>
        <h1 className="display mt-2 text-5xl">Owner studio</h1>
        <p className="mt-2 text-sm text-mute">Enter your 4 digit PIN.</p>
        <div className="mt-6 flex justify-center gap-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`size-3.5 rounded-full transition ${wrong ? 'bg-clay' : i < pin.length ? 'bg-ink' : 'bg-line'}`} />
          ))}
        </div>
        <input
          autoFocus
          inputMode="numeric"
          type="password"
          maxLength={4}
          value={pin}
          aria-label="PIN"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            setPin(v)
            submit(v)
          }}
          className="mt-5 w-full rounded-full border border-line bg-bone px-4 py-3 text-center font-mono text-2xl tracking-[0.6em] outline-none focus:border-ink"
        />
        <p className="mt-4 text-xs text-mute">Demo PIN for the pitch: <b className="font-mono text-ink">{PIN}</b></p>
        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 py-2 text-xs font-semibold text-mute hover:text-ink"><ArrowLeft size={13} /> Back to the shop</Link>
      </motion.div>
    </div>
  )
}

/* ═════════════ Studio ═════════════ */
function Studio({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState<Period>('30D')
  const [data, setData] = useState<Saved>(load)
  const [toast, setToast] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data))
    } catch {
      /* ignore */
    }
  }, [data])

  const live = useMemo(liveOrder, [])
  const orders = useMemo(() => (live && !data.orders.some((o) => o.id === live.id) ? [live, ...data.orders] : data.orders), [live, data.orders])
  const m = useMemo(() => metrics(period), [period])
  const report = useMemo(catalogueReport, [])
  const notify = (t: string) => {
    setToast(t)
    setTimeout(() => setToast((x) => (x === t ? null : x)), 2800)
  }
  const patch = (p: Partial<Saved>) => setData((d) => ({ ...d, ...p }))
  const setOrder = (id: string, fn: (o: AdminOrder) => AdminOrder) =>
    patch({ orders: (data.orders.some((o) => o.id === id) ? data.orders : orders).map((o) => (o.id === id ? fn(o) : o)) })
  const openReceipt = (id: string) => {
    setReceiptId(id)
    setTab('receipts')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const ctx: Ctx = { orders, setOrder, notify, openReceipt, data, patch, period, m, report }

  return (
    <div className="min-h-svh bg-bone text-ink">
      <style>{`@media print { body * { visibility: hidden !important; } #receipt, #receipt * { visibility: visible !important; } #receipt { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; } }`}</style>

      {/* top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-4 py-2.5 text-xs text-bone md:px-8 print:hidden">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-olive px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">Owner studio</span>
          <span className="hidden text-bone/60 sm:inline">{store.shop}, {store.city}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-bone/20 px-2.5 py-0.5 text-[10px] text-bone/70 md:inline">Sample data · real catalogue</span>
          <Link to="/" className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-bone/10"><Storefront size={14} /> Shop</Link>
          <button type="button" onClick={onLock} className="inline-flex items-center gap-1 rounded-full bg-bone/10 px-3 py-1 hover:bg-bone/20"><LockSimple size={14} /> Lock</button>
        </div>
      </div>

      {/* header */}
      <header className="border-b border-line bg-paper px-4 pt-6 md:px-8 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-mute">{branches.men.house} · {branches.women.house} · {branches.kids.house}</p>
            <h1 className="display mt-1 text-5xl md:text-6xl">Owner studio</h1>
            <p className="mt-1 text-sm text-mute">Payments, receipts, money in and out, stylist insights, stock and your best customers in one place.</p>
          </div>
          <div className="flex rounded-full border border-line bg-bone p-1" role="radiogroup" aria-label="Period">
            {(['7D', '30D', '90D', 'YTD'] as Period[]).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${period === p ? 'bg-ink text-bone' : 'text-mute hover:text-ink'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <nav className="no-scrollbar mx-auto mt-6 flex max-w-7xl gap-1 overflow-x-auto" aria-label="Studio sections">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id}
              className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-semibold transition ${tab === t.id ? 'text-ink' : 'text-mute hover:text-ink'}`}
            >
              <span className="font-mono text-[10px] text-mute">{String(i + 1).padStart(2, '0')}</span>
              <t.icon size={15} className="hidden sm:block" />
              {t.label}
              {tab === t.id && <motion.span layoutId="tab-line" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ink" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">
        {/* KPI strip */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
          <Kpi label={`Revenue · ${period}`} value={money(m.revenue)} note={m.change === null ? 'First period' : `${m.change >= 0 ? '+' : ''}${m.change}% on the period before`} good={(m.change ?? 0) >= 0} />
          <Kpi label="Orders" value={m.orders.toLocaleString('en-KE')} note={`${money(m.aov)} average · ${m.mpesaShare}% M-Pesa`} />
          <Kpi label="Sold with the AI stylist" value={money(m.stylist)} note={`${Math.round((m.stylist / Math.max(1, m.revenue)) * 100)}% of revenue`} good />
          <Kpi label="On the rail now" value={`${report.live} pieces`} note={`${money(report.railValue)} at full price · ${report.sold} sold`} />
        </section>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {tab === 'overview' && <Overview {...ctx} />}
            {tab === 'payments' && <Payments {...ctx} />}
            {tab === 'receipts' && <Receipts {...ctx} selected={receiptId ?? orders[0]?.id} onSelect={setReceiptId} />}
            {tab === 'reports' && <Reports {...ctx} />}
            {tab === 'stylist' && <StylistIntel {...ctx} />}
            {tab === 'inventory' && <Inventory {...ctx} />}
            {tab === 'visits' && <Visits {...ctx} />}
            {tab === 'vips' && <Vips {...ctx} />}
          </motion.div>
        </AnimatePresence>

        <p className="pb-6 text-center text-[11px] text-mute print:hidden">
          Pitch demo. Orders, payments and customers are sample data built from the real pieces on {branches.men.handle}, {branches.women.handle} and {branches.kids.handle}. Changes are saved on this device only.{' '}
          <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => { setData(fresh()); notify('Sample data reset') }}>Reset sample data</button>
        </p>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm text-bone shadow-2xl print:hidden" role="status">
            <Check size={16} className="text-sand" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type Ctx = {
  orders: AdminOrder[]
  setOrder: (id: string, fn: (o: AdminOrder) => AdminOrder) => void
  notify: (t: string) => void
  openReceipt: (id: string) => void
  data: Saved
  patch: (p: Partial<Saved>) => void
  period: Period
  m: ReturnType<typeof metrics>
  report: ReturnType<typeof catalogueReport>
}

/* ═════════════ Shared bits ═════════════ */
function Kpi({ label, value, note, good }: { label: string; value: string; note: string; good?: boolean }) {
  return (
    <div className="rounded-[22px] bg-paper p-4 md:p-5">
      <p className="text-[11px] font-semibold tracking-wider text-mute uppercase">{label}</p>
      <p className="display mt-2 text-3xl md:text-4xl">{value}</p>
      <p className={`mt-1 text-xs ${good ? 'font-semibold text-olive' : 'text-mute'}`}>{note}</p>
    </div>
  )
}
function Card({ title, sub, right, children, className = '' }: { title: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-[24px] bg-paper p-5 md:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-3xl">{title}</h2>
          {sub && <p className="mt-0.5 text-xs text-mute">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition'
const field = 'w-full rounded-xl border border-line bg-bone px-3 py-2 text-sm outline-none focus:border-ink'

function StatusPill({ s }: { s: string }) {
  const tone = s === 'Paid' || s === 'Delivered' || s === 'Done' || s === 'Collected' ? 'bg-olive/15 text-olive' : s === 'Refunded' ? 'bg-ink/10 text-mute line-through' : s === 'Awaiting payment' ? 'bg-clay/15 text-clay' : 'bg-oat text-ink'
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${tone}`}>{s}</span>
}
const RIDER_NEXT: Record<RiderStatus, RiderStatus> = { Packing: 'With rider', 'With rider': 'Delivered', Delivered: 'Delivered', Collected: 'Collected' }

const clientMessage = (o: AdminOrder) =>
  `Habari ${o.customer.split(' ')[0]}, thank you for shopping with All About Linen.\n\nOrder ${o.id}\n${o.items.map((i) => `• ${i.name} (${i.size}) ${money(i.price * i.qty)}`).join('\n')}\nTotal ${money(orderTotal(o))} · ${o.method}${o.ref && !/waiting/i.test(o.ref) ? ` · ${o.ref}` : ''}\n\nTrack your rider: ${SITE}/track/${o.id}`
const riderMessage = (o: AdminOrder) =>
  `ALL ABOUT LINEN · RIDER BRIEF\nOrder ${o.id}\nPick up: ${store.shop}\nDrop: ${o.landmark}, ${o.estate}\nClient: ${o.customer} (${o.phone})\nParcel: ${o.items.map((i) => `${i.name} ${i.size}`).join(', ')}\nPayment: ${o.status}${o.status === 'Awaiting payment' ? ' · collect before handing over' : ''}`

function OrderActions({ o, setOrder, notify, openReceipt }: { o: AdminOrder } & Pick<Ctx, 'setOrder' | 'notify' | 'openReceipt'>) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <button type="button" className={`${btn} bg-olive text-bone hover:bg-olive/90`} onClick={() => { openWhatsApp(clientMessage(o)); notify(`Receipt and tracking link ready for ${o.customer}`) }}>
        <WhatsappLogo size={14} weight="fill" /> Client
      </button>
      {o.rider !== 'Collected' && (
        <button type="button" className={`${btn} bg-oat hover:bg-sand`} onClick={() => { openWhatsApp(riderMessage(o)); setOrder(o.id, (x) => ({ ...x, rider: x.rider === 'Packing' ? 'With rider' : x.rider })); notify(`Rider brief sent for ${o.id}`) }}>
          <Moped size={14} /> Rider
        </button>
      )}
      <button type="button" className={`${btn} bg-ink text-bone hover:bg-ink-2`} onClick={() => openReceipt(o.id)}>
        <Receipt size={14} /> Receipt
      </button>
    </div>
  )
}

/* ═════════════ 01 Overview ═════════════ */
function Overview({ orders, setOrder, notify, openReceipt, m, period, report }: Ctx) {
  const max = Math.max(...m.buckets.map((b) => b.revenue), 1)
  const active = orders.filter((o) => o.status !== 'Refunded').slice(0, 8)
  const toDeliver = orders.filter((o) => o.rider === 'Packing' || o.rider === 'With rider').length
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Sales" sub={`${period} · bars are revenue, the darker part was sold through the AI stylist`} className="lg:col-span-2">
        <div className="flex h-56 items-end gap-1.5 md:gap-2" role="img" aria-label="Revenue chart">
          {m.buckets.map((b, i) => (
            <div key={i} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">{money(b.revenue)}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: `${(b.revenue / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.03 }} className="relative w-full overflow-hidden rounded-t-lg bg-oat">
                <span className="absolute inset-x-0 bottom-0 bg-olive" style={{ height: `${(b.stylist / Math.max(1, b.revenue)) * 100}%` }} />
              </motion.div>
              <span className="w-full truncate text-center text-[10px] text-mute">{b.label}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Today" sub="What needs you right now">
        <ul className="space-y-3 text-sm">
          <Todo n={orders.filter((o) => o.status === 'Awaiting payment').length} label="orders waiting for M-Pesa" />
          <Todo n={toDeliver} label="parcels to pack or out with riders" />
          <Todo n={report.oldest.length} label="pieces on the rail for over a month" />
          <Todo n={SAMPLE_VISITS.filter((v) => v.status !== 'Done').length} label="fittings booked at Shop 305" />
        </ul>
        <div className="mt-5 rounded-2xl bg-bone p-4 text-xs">
          <p className="font-semibold">Next drop · Friday 7pm</p>
          <p className="mt-1 text-mute">Your VIPs get the link 30 minutes early. Send it from the VIP size book.</p>
        </div>
      </Card>

      <Card title="Dispatch" sub="Live orders. Tap the rider status to move it on." className="lg:col-span-3">
        <div className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] tracking-wider text-mute uppercase">
                <th className="py-2 pr-3 font-semibold">Order</th>
                <th className="py-2 pr-3 font-semibold">Client and drop</th>
                <th className="py-2 pr-3 font-semibold">Pieces</th>
                <th className="py-2 pr-3 text-right font-semibold">Total</th>
                <th className="py-2 pr-3 font-semibold">Rider</th>
                <th className="py-2 text-right font-semibold">Send</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {active.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="py-3 pr-3">
                    <p className="font-mono text-xs font-semibold">{o.id}</p>
                    <p className="text-[11px] text-mute">{when(o.placed)}</p>
                    {o.live && <span className="mt-1 inline-block rounded-full bg-clay px-2 py-0.5 text-[10px] font-semibold text-white">From checkout</span>}
                  </td>
                  <td className="py-3 pr-3">
                    <p className="font-semibold">{o.customer}</p>
                    <p className="text-xs text-mute">{o.landmark}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex -space-x-2">
                      {o.items.map((it) => {
                        const p = byId(it.id)
                        return p ? <Photo key={it.id} id={p.images[0]} alt={it.name} sizes="40px" widths={[120]} className="size-10 rounded-full ring-2 ring-paper" /> : null
                      })}
                    </div>
                    <p className="mt-1 max-w-[220px] truncate text-xs text-mute">{o.items.map((i) => `${i.name} ${i.size}`).join(', ')}</p>
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold tabular-nums">{money(orderTotal(o))}</td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      disabled={o.rider === 'Delivered' || o.rider === 'Collected'}
                      onClick={() => { setOrder(o.id, (x) => ({ ...x, rider: RIDER_NEXT[x.rider] })); notify(`${o.id}: ${RIDER_NEXT[o.rider]}`) }}
                      className="inline-flex items-center gap-1 disabled:cursor-default"
                      title="Move to the next step"
                    >
                      <StatusPill s={o.rider} />
                      {o.rider !== 'Delivered' && o.rider !== 'Collected' && <ArrowsClockwise size={12} className="text-mute" />}
                    </button>
                  </td>
                  <td className="py-3"><OrderActions o={o} setOrder={setOrder} notify={notify} openReceipt={openReceipt} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
function Todo({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`display grid size-10 shrink-0 place-items-center rounded-full text-xl ${n ? 'bg-ink text-bone' : 'bg-bone text-mute'}`}>{n}</span>
      <span className="text-mute">{label}</span>
    </li>
  )
}

/* ═════════════ 02 Payments ═════════════ */
function Payments({ orders, setOrder, notify, openReceipt }: Ctx) {
  const [q, setQ] = useState('')
  const [method, setMethod] = useState<'all' | PayMethod>('all')
  const [status, setStatus] = useState<'all' | AdminOrder['status']>('all')
  const [verifying, setVerifying] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const list = orders.filter((o) => {
    const hay = `${o.id} ${o.customer} ${o.phone} ${o.landmark} ${o.ref} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase()
    return (!q || hay.includes(q.toLowerCase())) && (method === 'all' || o.method === method) && (status === 'all' || o.status === status)
  })
  const paid = orders.filter((o) => o.status === 'Paid')
  const byMethod = (['M-Pesa', 'M-Pesa on WhatsApp', 'Card', 'Cash at Shop 305'] as PayMethod[]).map((k) => ({ k, total: paid.filter((o) => o.method === k).reduce((a, o) => a + orderTotal(o), 0) }))
  const all = byMethod.reduce((a, x) => a + x.total, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {byMethod.map((x) => (
          <div key={x.k} className="rounded-[20px] bg-paper p-4">
            <p className="text-[11px] font-semibold tracking-wider text-mute uppercase">{x.k}</p>
            <p className="display mt-1 text-2xl">{money(x.total)}</p>
            <div className="mt-2 h-1 rounded-full bg-line"><div className="h-1 rounded-full bg-ink" style={{ width: `${(x.total / Math.max(1, all)) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <Card
        title="Payments ledger"
        sub="Every shilling in, matched to the M-Pesa code or card reference."
        right={
          <button type="button" className={`${btn} border border-line hover:border-ink`} onClick={() => downloadCsv('all-about-linen-payments.csv', [['Order', 'Date', 'Client', 'Method', 'Reference', 'Status', 'Total'], ...list.map((o) => [o.id, new Date(o.placed).toISOString(), o.customer, o.method, o.ref, o.status, orderTotal(o)])])}>
            <DownloadSimple size={14} /> Export CSV
          </button>
        }
      >
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <MagnifyingGlass size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, M-Pesa code, estate or piece" className={`${field} pl-9`} aria-label="Search payments" />
          </label>
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={field} aria-label="Payment method">
            <option value="all">All methods</option>
            {byMethod.map((x) => <option key={x.k}>{x.k}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={field} aria-label="Status">
            <option value="all">All statuses</option>
            <option>Paid</option>
            <option>Awaiting payment</option>
            <option>Refunded</option>
          </select>
        </div>
        <div className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] tracking-wider text-mute uppercase">
                <th className="py-2 pr-3 font-semibold">Order</th>
                <th className="py-2 pr-3 font-semibold">Client</th>
                <th className="py-2 pr-3 font-semibold">Method and reference</th>
                <th className="py-2 pr-3 text-right font-semibold">Total</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {list.map((o) => (
                <tr key={o.id}>
                  <td className="py-3 pr-3"><p className="font-mono text-xs font-semibold">{o.id}</p><p className="text-[11px] text-mute">{when(o.placed)}</p></td>
                  <td className="py-3 pr-3"><p className="font-semibold">{o.customer}</p><p className="text-xs text-mute">{o.phone} · {o.estate}</p></td>
                  <td className="py-3 pr-3"><p className="text-xs font-semibold">{o.method}</p><p className="font-mono text-xs text-mute">{o.ref}</p></td>
                  <td className="py-3 pr-3 text-right font-semibold tabular-nums">{money(orderTotal(o))}</td>
                  <td className="py-3 pr-3"><StatusPill s={o.status} /></td>
                  <td className="py-3">
                    {verifying === o.id ? (
                      <form
                        className="flex justify-end gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (code.trim().length < 8) return
                          setOrder(o.id, (x) => ({ ...x, status: 'Paid', ref: code.trim().toUpperCase() }))
                          notify(`${o.id} marked paid · ${code.trim().toUpperCase()}`)
                          setVerifying(null)
                          setCode('')
                        }}
                      >
                        <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="M-Pesa code" className="w-32 rounded-full border border-line bg-bone px-3 py-1.5 font-mono text-xs uppercase outline-none focus:border-ink" aria-label="M-Pesa confirmation code" />
                        <button type="submit" className={`${btn} bg-olive text-bone`}>Confirm</button>
                      </form>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        {o.status === 'Awaiting payment' && (
                          <button type="button" className={`${btn} bg-clay text-white`} onClick={() => setVerifying(o.id)}>Enter M-Pesa code</button>
                        )}
                        <OrderActions o={o} setOrder={setOrder} notify={notify} openReceipt={openReceipt} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} className="py-10 text-center text-mute">No payments match.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-mute">Live version: M-Pesa STK push and payment callbacks through Safaricom Daraja fill this in automatically, so codes never need typing.</p>
      </Card>
    </div>
  )
}

/* ═════════════ 03 Receipts ═════════════ */
function Receipts({ orders, setOrder, notify, selected, onSelect }: Ctx & { selected?: string; onSelect: (id: string) => void }) {
  const o = orders.find((x) => x.id === selected) ?? orders[0]
  const [addId, setAddId] = useState('')
  const rail = useMemo(() => products.filter((p) => !isSold(p)), [])
  if (!o) return null
  const sub = orderSubtotal(o)
  const total = orderTotal(o)
  const add = () => {
    const p = byId(addId)
    if (!p) return
    if (o.items.some((i) => i.id === p.id)) return notify('That piece is already on this receipt. It is one of one.')
    setOrder(o.id, (x) => ({ ...x, items: [...x.items, { id: p.id, name: p.name, size: p.sizes[0], price: p.price, qty: 1 }] }))
    notify(`Added ${p.name} (${p.sizes[0]})`)
    setAddId('')
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <Card title="Receipt builder" sub="Pick an order, adjust it, then print or send." className="lg:col-span-5 print:hidden">
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-mute">Order</span>
            <select value={o.id} onChange={(e) => onSelect(e.target.value)} className={field}>
              {orders.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.customer} · {money(orderTotal(x))}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 block sm:col-span-1">
              <span className="mb-1 block text-xs font-semibold text-mute">Client name</span>
              <input value={o.customer} onChange={(e) => setOrder(o.id, (x) => ({ ...x, customer: e.target.value }))} className={field} />
            </label>
            <label className="col-span-2 block sm:col-span-1">
              <span className="mb-1 block text-xs font-semibold text-mute">Estate</span>
              <input value={o.estate} onChange={(e) => setOrder(o.id, (x) => ({ ...x, estate: e.target.value }))} className={field} />
            </label>
            <label className="col-span-2 block">
              <span className="mb-1 block text-xs font-semibold text-mute">Landmark</span>
              <input value={o.landmark} onChange={(e) => setOrder(o.id, (x) => ({ ...x, landmark: e.target.value }))} className={field} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-mute">Delivery</span>
              <select value={o.deliveryFee} onChange={(e) => setOrder(o.id, (x) => ({ ...x, deliveryFee: Number(e.target.value) }))} className={field}>
                {[...new Set([0, ...delivery.options.map((d) => d.fee), o.deliveryFee])].map((f) => <option key={f} value={f}>{f ? money(f) : 'Free'}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-mute">Discount (KES)</span>
              <input type="number" min={0} value={o.discount} onChange={(e) => setOrder(o.id, (x) => ({ ...x, discount: Math.max(0, Number(e.target.value)) }))} className={field} />
            </label>
          </div>
          <div className="rounded-2xl bg-bone p-3">
            <p className="text-xs font-semibold">Pieces</p>
            <ul className="mt-2 space-y-1.5">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2 text-xs">
                  <span className="min-w-0 truncate">{it.name} · {it.size}</span>
                  <button type="button" aria-label={`Remove ${it.name}`} disabled={o.items.length <= 1} onClick={() => setOrder(o.id, (x) => ({ ...x, items: x.items.filter((i) => i.id !== it.id) }))} className="text-mute hover:text-clay disabled:opacity-30"><Trash size={14} /></button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <select value={addId} onChange={(e) => setAddId(e.target.value)} className={`${field} py-1.5 text-xs`} aria-label="Add a piece from the rail">
                <option value="">Add a piece from the rail…</option>
                {(['men', 'women', 'kids'] as Branch[]).map((b) => (
                  <optgroup key={b} label={branches[b].house}>
                    {rail.filter((p) => p.branch === b).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.sizes[0]} · {money(p.price)}</option>)}
                  </optgroup>
                ))}
              </select>
              <button type="button" onClick={add} disabled={!addId} className={`${btn} shrink-0 bg-ink text-bone disabled:opacity-40`}><Plus size={14} /> Add</button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] bg-paper p-3 print:hidden">
          <span className="px-2 text-xs text-mute">Preview</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${btn} bg-ink text-bone`} onClick={() => window.print()}><Printer size={14} /> Print or save PDF</button>
            <button type="button" className={`${btn} bg-olive text-bone`} onClick={() => { openWhatsApp(clientMessage(o)); notify(`Receipt ready to send to ${o.customer}`) }}><WhatsappLogo size={14} weight="fill" /> Send to client</button>
            <button type="button" className={`${btn} bg-oat`} onClick={() => { openWhatsApp(riderMessage(o)); notify('Rider brief ready') }}><Moped size={14} /> Brief rider</button>
          </div>
        </div>

        <article id="receipt" className="rounded-[24px] border border-line bg-white p-6 text-ink md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
            <div>
              <p className="display text-4xl leading-none">All About Linen</p>
              <p className="eyebrow mt-2 text-[10px] text-mute">Nairobi · Ex UK curated</p>
              <p className="mt-3 text-xs text-mute">{store.shop}, {store.city}<br />{store.phoneDisplay} · allaboutlinen.co.ke</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold tracking-wider text-mute uppercase">Sales receipt</p>
              <p className="mt-1 font-mono text-lg font-semibold">{o.id}</p>
              <p className="text-xs text-mute">{new Date(o.placed).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              <span className="mt-2 inline-block"><StatusPill s={o.status} /></span>
            </div>
          </div>
          <div className="grid gap-4 border-b border-line py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-mute uppercase">Billed and delivered to</p>
              <p className="mt-1 font-semibold">{o.customer}</p>
              <p className="text-xs text-mute">{o.phone}</p>
              <p className="text-xs text-mute">{o.landmark}{o.estate && !o.landmark.includes(o.estate) ? `, ${o.estate}` : ''}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold tracking-wider text-mute uppercase">Payment</p>
              <p className="mt-1 font-semibold">{o.method}</p>
              <p className="font-mono text-xs">{o.ref}</p>
            </div>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] tracking-wider text-mute uppercase">
                <th className="pb-2 font-semibold">Piece</th>
                <th className="pb-2 text-center font-semibold">Size</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {o.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5">{it.name}<span className="block text-[11px] text-mute">One of one · ex UK, Grade A</span></td>
                  <td className="py-2.5 text-center font-semibold">{it.size}</td>
                  <td className="py-2.5 text-right tabular-nums">{money(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 space-y-1.5 border-t-2 border-ink pt-4 text-sm">
            <Row k="Subtotal" v={money(sub)} />
            <Row k="Delivery" v={o.deliveryFee ? money(o.deliveryFee) : 'Free'} />
            {o.discount > 0 && <Row k="Discount" v={`− ${money(o.discount)}`} />}
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="font-semibold">{o.status === 'Paid' ? 'Total paid' : 'Total due'}</dt>
              <dd className="display text-3xl">{money(total)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4 text-[11px] text-mute">
            <p className="max-w-sm">Exchanges within 7 days on unworn pieces at Shop 305. Track this order at {SITE.replace('https://', '')}/track/{o.id}</p>
            <p className="max-w-[220px] sm:text-right">This is a sales receipt, not a tax invoice. KRA eTIMS invoices can be issued once the shop’s eTIMS account is connected.</p>
          </div>
        </article>
      </div>
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-mute"><dt>{k}</dt><dd className="tabular-nums">{v}</dd></div>
}

/* ═════════════ 04 Reports ═════════════ */
function Reports({ data, patch, notify, m, period, report }: Ctx) {
  const [cat, setCat] = useState<ExpenseCategory>('Rider payouts')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const spent = data.expenses.reduce((a, e) => a + e.amount, 0)
  const cogs = Math.round(m.revenue * 0.34) // bale cost per piece runs about a third of the selling price
  const scale = period === '7D' ? 7 / 30 : period === '30D' ? 1 : period === '90D' ? 3 : new Date().getMonth() + 1
  const overheads = Math.round(spent * scale)
  const net = m.revenue - cogs - overheads
  const maxSold = Math.max(...report.soldSizes.map(([, n]) => n), 1)
  const maxRail = Math.max(...report.railSizes.map(([, n]) => n), 1)
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Profit and loss" sub={`${period} · sample figures`}>
        <dl className="space-y-2 text-sm">
          <PlRow k="Sales" v={m.revenue} />
          <PlRow k="Cost of stock (bales, about 34%)" v={-cogs} />
          <PlRow k="Running costs (logged expenses)" v={-overheads} />
          <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
            <dt className="font-semibold">Net profit</dt>
            <dd className={`display text-4xl ${net >= 0 ? 'text-olive' : 'text-clay'}`}>{money(net)}</dd>
          </div>
          <p className="text-xs text-mute">Margin {Math.round((net / Math.max(1, m.revenue)) * 100)}%. Running costs scale with the period from the monthly log below.</p>
        </dl>
      </Card>

      <Card title="Sell through by house" sub="From the real catalogue">
        <ul className="space-y-4">
          {report.byHouse.map((h) => (
            <li key={h.branch}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">{h.house}</span>
                <span className="text-xs text-mute">{h.sold} of {h.listed} sold · {money(h.value)} on the rail</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-line"><motion.div initial={{ width: 0 }} animate={{ width: `${h.sellThrough}%` }} transition={{ duration: 0.8 }} className="h-2 rounded-full bg-ink" /></div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Sizes: demand and supply" sub="Which sizes sold, against what is still on the rail. Buy more of what sells.">
        <div className="grid gap-6 sm:grid-cols-2">
          <SizeBars title="Sold" rows={report.soldSizes} max={maxSold} tone="bg-olive" />
          <SizeBars title="On the rail" rows={report.railSizes} max={maxRail} tone="bg-sand" />
        </div>
        <p className="mt-4 rounded-2xl bg-bone p-3 text-xs">
          <b className="font-semibold">Buying tip:</b> {report.soldColours.slice(0, 3).map(([c]) => c.toLowerCase()).join(', ')} pieces sell fastest. Ask the bale dealer for more of these.
        </p>
      </Card>

      <Card title="Slow movers" sub="Longest on the rail. Restyle, reshoot or mark down.">
        <ul className="space-y-2">
          {report.oldest.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Photo id={p.images[0]} alt="" sizes="48px" widths={[120]} className="size-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-mute">{p.sizes[0]} · {money(p.price)} · listed {p.addedDaysAgo} days ago</p>
              </div>
              <span className="rounded-full bg-oat px-2.5 py-1 text-[11px] font-semibold">Try {money(Math.round((p.price * 0.85) / 50) * 50)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Expense log"
        sub="Bales, riders, packaging, rent and ads"
        className="lg:col-span-2"
        right={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-bone px-3 py-1.5 text-xs">Logged <b className="text-clay">{money(spent)}</b></span>
            <button type="button" className={`${btn} border border-line hover:border-ink`} onClick={() => downloadCsv('all-about-linen-expenses.csv', [['Date', 'Category', 'Description', 'Amount'], ...data.expenses.map((e) => [e.date, e.category, e.desc, e.amount])])}><DownloadSimple size={14} /> CSV</button>
          </div>
        }
      >
        <form
          className="mb-4 grid gap-2 md:grid-cols-[200px_1fr_140px_auto]"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Number(amount)
            if (!desc.trim() || !(n > 0)) return
            patch({ expenses: [{ id: `e${Date.now()}`, date: new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), category: cat, desc: desc.trim(), amount: n }, ...data.expenses] })
            notify(`Logged ${money(n)} · ${cat}`)
            setDesc('')
            setAmount('')
          }}
        >
          <select value={cat} onChange={(e) => setCat(e.target.value as ExpenseCategory)} className={field} aria-label="Category">
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What was it for?" className={field} aria-label="Description" />
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="KES" className={field} aria-label="Amount in KES" />
          <button type="submit" className={`${btn} bg-ink py-2 text-bone`}><Plus size={14} /> Log expense</button>
        </form>
        <div className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
          <table className="w-full min-w-[560px] text-left text-sm">
            <tbody className="divide-y divide-line/60">
              {data.expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 pr-3 text-xs whitespace-nowrap text-mute">{e.date}</td>
                  <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">{e.category}</td>
                  <td className="py-2.5 pr-3 text-mute">{e.desc}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold whitespace-nowrap text-clay tabular-nums">− {money(e.amount)}</td>
                  <td className="py-2.5 text-right">
                    <button type="button" aria-label={`Delete ${e.desc}`} onClick={() => patch({ expenses: data.expenses.filter((x) => x.id !== e.id) })} className="text-mute hover:text-clay"><Trash size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
function PlRow({ k, v }: { k: string; v: number }) {
  return <div className="flex justify-between"><dt className="text-mute">{k}</dt><dd className={`font-semibold tabular-nums ${v < 0 ? 'text-clay' : ''}`}>{v < 0 ? `− ${money(-v)}` : money(v)}</dd></div>
}
function SizeBars({ title, rows, max, tone }: { title: string; rows: [string, number][]; max: number; tone: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wider text-mute uppercase">{title}</p>
      <ul className="space-y-1.5">
        {rows.map(([s, n]) => (
          <li key={s} className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0 font-semibold">{s}</span>
            <span className="h-2 flex-1 rounded-full bg-line"><span className={`block h-2 rounded-full ${tone}`} style={{ width: `${(n / max) * 100}%` }} /></span>
            <span className="w-5 text-right tabular-nums text-mute">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ═════════════ 05 AI stylist ═════════════ */
function StylistIntel({ m, period }: Ctx) {
  const [q, setQ] = useState(STYLIST_QUESTIONS[0].q)
  const [asked, setAsked] = useState(STYLIST_QUESTIONS[0].q)
  const answer = useMemo(() => think(asked, {}), [asked])
  const peak = Math.max(...STYLIST_HOURS)
  const chats = Math.round((m.stylist / 2400) * 3.1)
  const late = Math.round((STYLIST_HOURS.slice(20).concat(STYLIST_HOURS.slice(0, 6)).reduce((a, b) => a + b, 0) / STYLIST_HOURS.reduce((a, b) => a + b, 0)) * 100)
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-[24px] bg-ink p-6 text-bone lg:col-span-2">
        <p className="eyebrow text-sand">Amani · AI stylist</p>
        <p className="display mt-3 text-5xl">{chats.toLocaleString('en-KE')} chats</p>
        <p className="mt-1 text-sm text-bone/70">{period} · turned into {money(m.stylist)} of sales</p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-bone/10 p-3"><p className="display text-3xl">{late}%</p><p className="text-xs text-bone/70">of chats after 8pm, when the shop is shut</p></div>
          <div className="rounded-2xl bg-bone/10 p-3"><p className="display text-3xl">7 in 10</p><p className="text-xs text-bone/70">size questions answered without a WhatsApp from you</p></div>
        </div>
        <p className="mt-6 text-xs font-semibold">When people chat</p>
        <div className="mt-2 flex h-20 items-end gap-0.5" role="img" aria-label="Chats by hour of day">
          {STYLIST_HOURS.map((h, i) => <span key={i} title={`${i}:00`} className={`flex-1 rounded-t ${i >= 20 || i < 6 ? 'bg-sand' : 'bg-bone/40'}`} style={{ height: `${(h / peak) * 100}%` }} />)}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-bone/50"><span>midnight</span><span>noon</span><span>11pm</span></div>
        <p className="mt-6 text-[11px] text-bone/50">The demo runs on a built in stylist that reads the live catalogue. Production swaps in a large language model (for example Claude) with the same catalogue as its tools.</p>
      </section>

      <Card title="What customers ask" sub="Tap one to see exactly what Amani answers from today’s rail" className="lg:col-span-3">
        <ul className="divide-y divide-line/60">
          {STYLIST_QUESTIONS.map((s) => (
            <li key={s.q}>
              <button type="button" onClick={() => { setQ(s.q); setAsked(s.q) }} className={`flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm transition hover:text-ink ${asked === s.q ? 'font-semibold' : 'text-mute'}`}>
                <span>“{s.q}”</span>
                <span className="shrink-0 rounded-full bg-bone px-2 py-0.5 text-[11px] tabular-nums">{s.asked}×</span>
              </button>
            </li>
          ))}
        </ul>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) setAsked(q.trim()) }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} className={field} aria-label="Ask as a customer" placeholder="Ask as a customer…" />
          <button type="submit" className={`${btn} shrink-0 bg-ink px-4 text-bone`}><Sparkle size={14} weight="fill" /> Ask</button>
        </form>
        <div className="mt-4 rounded-2xl bg-bone p-4">
          <p className="text-sm leading-relaxed">{answer.text}</p>
          {answer.products && answer.products.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {answer.products.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="group min-w-0">
                  <Photo id={p.images[0]} alt={p.name} sizes="160px" widths={[300]} className="aspect-[4/5] w-full rounded-xl" />
                  <p className="mt-1 truncate text-xs font-semibold group-hover:underline">{p.name}</p>
                  <p className="text-[11px] text-mute">{p.sizes[0]} · {money(p.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

/* ═════════════ 06 Stock and Instagram ═════════════ */
function Inventory({ data, patch, notify, report }: Ctx) {
  const [house, setHouse] = useState<'all' | Branch>('all')
  const [state, setState] = useState<'rail' | 'sold' | 'all'>('rail')
  const [q, setQ] = useState('')
  const [caption, setCaption] = useState(SAMPLE_CAPTION)
  const [capHouse, setCapHouse] = useState<Branch>('men')
  const preview = useMemo(() => parseCaption(caption, capHouse), [caption, capHouse])
  const sold = (p: Product) => data.soldOverride[p.id] ?? isSold(p)
  const list = products.filter((p) => (house === 'all' || p.branch === house) && (state === 'all' || (state === 'sold') === sold(p)) && (!q || `${p.name} ${p.sizes[0]} ${p.colours[0].name}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="grid items-start gap-6 lg:grid-cols-12 [&>*]:min-w-0">
      <div className="space-y-6 lg:col-span-5">
        <Card title="Instagram caption to listing" sub="Paste a post caption as you write it today. One line per piece.">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(['men', 'women', 'kids'] as Branch[]).map((b) => (
              <button key={b} type="button" onClick={() => setCapHouse(b)} className={`${btn} ${capHouse === b ? 'bg-ink text-bone' : 'bg-bone'}`}>{branches[b].handle}</button>
            ))}
          </div>
          <textarea rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} className={`${field} font-mono text-xs leading-relaxed`} aria-label="Instagram caption" />
          <ul className="mt-3 space-y-2">
            {preview.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-bone px-3 py-2 text-xs">
                <span className="min-w-0">
                  <b className="block truncate font-semibold">{d.name}</b>
                  <span className="text-mute">{d.category} · {d.colour} · size {d.size}</span>
                </span>
                <span className="shrink-0 text-right">
                  <b className="block">{money(d.price)}</b>
                  {d.sold && <span className="text-clay">Sold</span>}
                </span>
              </li>
            ))}
            {!preview.length && <li className="text-xs text-mute">No pieces found. Use the format: Name || Size || 1200/-</li>}
          </ul>
          <button
            type="button"
            disabled={!preview.length}
            onClick={() => { patch({ drafts: [...preview, ...data.drafts] }); notify(`${preview.length} ${preview.length === 1 ? 'piece' : 'pieces'} saved as drafts`) }}
            className={`${btn} mt-3 w-full bg-olive py-2.5 text-bone disabled:opacity-40`}
          >
            <InstagramLogo size={15} /> Save {preview.length || ''} as drafts
          </button>
          <p className="mt-2 text-[11px] text-mute">Live version: publishes straight to the shop with the post’s photo, crops and measurements, the same way the {products.length} real pieces were imported.</p>
        </Card>
        {data.drafts.length > 0 && (
          <Card title="Drafts" sub="Ready to publish" right={<button type="button" className={`${btn} text-mute hover:text-clay`} onClick={() => patch({ drafts: [] })}><Trash size={13} /> Clear</button>}>
            <ul className="space-y-1.5 text-xs">
              {data.drafts.map((d, i) => (
                <li key={i} className="flex justify-between gap-2 rounded-xl bg-bone px-3 py-2"><span className="truncate">{d.name} · {d.size} · {branches[d.house].house}</span><b>{money(d.price)}</b></li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card title="Stock" sub={`${report.live} pieces on the rail · every piece is one of one`} className="lg:col-span-7">
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <MagnifyingGlass size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, size or colour" className={`${field} pl-9`} aria-label="Search stock" />
          </label>
          <select value={house} onChange={(e) => setHouse(e.target.value as typeof house)} className={field} aria-label="House">
            <option value="all">All houses</option>
            {(['men', 'women', 'kids'] as Branch[]).map((b) => <option key={b} value={b}>{branches[b].house}</option>)}
          </select>
          <select value={state} onChange={(e) => setState(e.target.value as typeof state)} className={field} aria-label="Status">
            <option value="rail">On the rail</option>
            <option value="sold">Sold</option>
            <option value="all">Everything</option>
          </select>
        </div>
        <p className="mb-2 text-xs text-mute">{list.length} pieces · {money(list.filter((p) => !sold(p)).reduce((a, p) => a + p.price, 0))} on the rail</p>
        <ul className="max-h-[640px] divide-y divide-line/60 overflow-y-auto pr-1" data-lenis-prevent>
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <Photo id={p.images[0]} alt="" sizes="48px" widths={[120]} className={`size-12 shrink-0 rounded-xl ${sold(p) ? 'opacity-50 grayscale' : ''}`} />
              <div className="min-w-0 flex-1">
                <Link to={`/product/${p.slug}`} className="block truncate text-sm font-semibold hover:underline">{p.name}</Link>
                <p className="truncate text-xs text-mute"><b className="font-semibold text-ink sm:hidden">{p.sizes[0]} · {money(p.price)} · </b>{branches[p.branch].house} · {p.category} · {p.colours[0].name}</p>
              </div>
              <span className="hidden w-16 shrink-0 text-center text-xs font-semibold sm:block">{p.sizes[0]}</span>
              <span className="hidden w-20 shrink-0 text-right text-sm font-semibold tabular-nums sm:block">{money(p.price)}</span>
              <button
                type="button"
                onClick={() => { patch({ soldOverride: { ...data.soldOverride, [p.id]: !sold(p) } }); notify(`${p.name}: ${sold(p) ? 'back on the rail' : 'marked sold'}`) }}
                className={`${btn} shrink-0 sm:w-24 ${sold(p) ? 'bg-bone text-mute' : 'bg-ink text-bone'}`}
              >
                {sold(p) ? 'Sold' : 'Mark sold'}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

/* ═════════════ 07 Fittings and swaps ═════════════ */
function Visits({ data, patch, notify }: Ctx) {
  const [name, setName] = useState('')
  const [slot, setSlot] = useState('')
  const [focus, setFocus] = useState('')
  const VISIT_NEXT: Record<Visit['status'], Visit['status']> = { Booked: 'Confirmed', Confirmed: 'Done', Done: 'Done' }
  const SWAP_NEXT: Record<Swap['status'], Swap['status']> = { 'Rider to collect': 'At Shop 305', 'At Shop 305': 'Done', Done: 'Done' }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card title="Fittings at Shop 305" sub="Book, confirm and close fittings. Tap a status to move it on.">
        <form
          className="mb-4 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim() || !slot.trim()) return
            patch({ visits: [{ id: `FIT-${119 + data.visits.length}`, client: name.trim(), phone: '—', when: slot.trim(), focus: focus.trim() || 'General fitting', status: 'Booked' }, ...data.visits] })
            notify(`Fitting booked for ${name.trim()}`)
            setName('')
            setSlot('')
            setFocus('')
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" className={field} aria-label="Client name" />
          <input value={slot} onChange={(e) => setSlot(e.target.value)} placeholder="When, e.g. Sat 11am" className={field} aria-label="When" />
          <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="What they want to try" className={`${field} sm:col-span-2`} aria-label="Focus" />
          <button type="submit" className={`${btn} bg-ink py-2 text-bone sm:col-span-2`}><Plus size={14} /> Book fitting</button>
        </form>
        <ul className="space-y-2">
          {data.visits.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-3 rounded-2xl bg-bone p-3 text-sm">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-mute">{v.id} · {v.when}</p>
                <p className="font-semibold">{v.client} <span className="font-normal text-mute">{v.phone}</span></p>
                <p className="text-xs text-mute">{v.focus}</p>
              </div>
              <button type="button" onClick={() => patch({ visits: data.visits.map((x) => (x.id === v.id ? { ...x, status: VISIT_NEXT[x.status] } : x)) })}><StatusPill s={v.status} /></button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Exchanges and try at home" sub="Every piece is one of one, so an exchange is always for a different piece.">
        <ul className="space-y-2">
          {data.swaps.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 rounded-2xl bg-bone p-3 text-sm">
              <div className="min-w-0">
                <p className="font-mono text-[10px] text-mute">{s.id}</p>
                <p className="font-semibold">{s.client}</p>
                <p className="text-xs text-mute">{s.action}</p>
              </div>
              <button type="button" onClick={() => patch({ swaps: data.swaps.map((x) => (x.id === s.id ? { ...x, status: SWAP_NEXT[x.status] } : x)) })}><StatusPill s={s.status} /></button>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-2xl bg-oat p-4 text-xs">
          <p className="font-semibold">Exchange rule</p>
          <p className="mt-1 text-ink/70">Unworn pieces within 7 days. The returned piece goes back on the rail the same day, so it can sell again.</p>
        </div>
      </Card>
    </div>
  )
}

/* ═════════════ 08 VIP size book ═════════════ */
function Vips({ notify }: Ctx) {
  const [house, setHouse] = useState<'all' | Branch>('all')
  const list = SAMPLE_VIPS.filter((v) => house === 'all' || v.house === house)
  const alert = (v: (typeof SAMPLE_VIPS)[number]) => {
    const fits = piecesFor(v).slice(0, 3)
    const msg = `Habari ${v.name.replace(/^Hon\. /, '').split(' ')[0]}, early access before Friday’s drop goes public. New in your size (${v.sizes.join(' / ')}):\n\n${fits.map((p) => `• ${p.name}, ${p.sizes[0]}, ${money(p.price)}\n  ${SITE}/product/${p.slug}`).join('\n')}\n\nEach piece is one of one. Reply to hold one for 2 hours.`
    openWhatsApp(msg)
    notify(`Drop alert ready for ${v.name} · ${fits.length} pieces`)
  }
  return (
    <Card
      title="VIP size book"
      sub="Your best customers, their sizes, and the pieces on the rail that fit them right now."
      right={
        <select value={house} onChange={(e) => setHouse(e.target.value as typeof house)} className={`${field} w-auto`} aria-label="House">
          <option value="all">All houses</option>
          {(['men', 'women', 'kids'] as Branch[]).map((b) => <option key={b} value={b}>{branches[b].house}</option>)}
        </select>
      }
    >
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((v) => {
          const fits = piecesFor(v)
          return (
            <li key={v.id} className="rounded-[20px] bg-bone p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-xs text-mute">{v.phone} · {branches[v.house].house}</p>
                </div>
                <div className="text-right">
                  <p className="display text-2xl">{money(v.spend)}</p>
                  <p className="text-[11px] text-mute">{v.orders} orders</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.sizes.map((s) => <span key={s} className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-bone">{s}</span>)}
              </div>
              <p className="mt-2 text-xs text-mute">{v.notes}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {fits.slice(0, 4).map((p) => <Photo key={p.id} id={p.images[0]} alt={p.name} sizes="32px" widths={[120]} className="size-8 rounded-full ring-2 ring-bone" />)}
                  </div>
                  <span className="text-xs text-mute">{fits.length} {fits.length === 1 ? 'piece fits' : 'pieces fit'} now</span>
                </div>
                <button type="button" disabled={!fits.length} onClick={() => alert(v)} className={`${btn} bg-olive text-bone disabled:opacity-40`}>
                  <WhatsappLogo size={14} weight="fill" /> Drop alert
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-mute">Alerts open WhatsApp with the message and real links ready. You choose the chat, so customer numbers never sit in the website.</p>
    </Card>
  )
}
