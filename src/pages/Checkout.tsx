import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, CreditCard, DeviceMobile, Lock, Money, Tag, WhatsappLogo } from '@phosphor-icons/react'
import { byId, delivery, kes, store, whatsapp } from '../data/catalog'
import { cartTotals, useShop, type Line } from '../store/shop'
import { ease, Photo } from '../components/ui'

type Form = {
  first: string
  last: string
  phone: string
  email: string
  area: string
  address: string
  notes: string
}

const PAY = [
  { id: 'mpesa', label: 'M-Pesa', note: 'We send a prompt to your phone', icon: DeviceMobile },
  { id: 'card', label: 'Card', note: 'Secure payment link by SMS', icon: CreditCard },
  { id: 'cod', label: 'Pay on delivery or pickup', note: 'Cash or M-Pesa when it arrives', icon: Money },
] as const

const phoneOk = (s: string) => /^(?:\+?254|0)(?:7|1)\d{8}$/.test(s.replace(/\s+/g, ''))
const emailOk = (s: string) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export type Order = {
  id: string
  lines: Line[]
  subtotal: number
  discount: number
  fee: number
  total: number
  name: string
  phone: string
  method: string
  pay: string
  placed: string
  area?: string
  tryHome?: boolean
}

export function Checkout() {
  const lines = useShop((s) => s.lines)
  const clear = useShop((s) => s.clear)
  const storeArea = useShop((s) => s.area)
  const navigate = useNavigate()
  const { subtotal, count, bundleSaving } = cartTotals(lines)
  const [f, setF] = useState<Form>({ first: '', last: '', phone: '', email: '', area: storeArea, address: '', notes: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [method, setMethod] = useState<string>('nairobi')
  const [pay, setPay] = useState<string>('mpesa')
  const [code, setCode] = useState('')
  const [promo, setPromo] = useState<{ ok: boolean; msg: string } | null>(null)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    document.title = 'Checkout | All About Linen'
  }, [])

  const opt = delivery.options.find((o) => o.id === method)!
  const discount = (promo?.ok ? Math.round((subtotal - bundleSaving) * 0.1) : 0) + bundleSaving
  const fee = method !== 'pickup' && subtotal - discount >= delivery.freeOver && method === 'nairobi' ? 0 : opt.fee
  const total = subtotal - discount + fee

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
        <p className="display text-6xl">Your bag is empty</p>
        <p className="mt-3 text-mute">Add a piece or two, then come back to check out.</p>
        <Link to="/shop" className="mt-8 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-bone">Start shopping</Link>
      </div>
    )
  }

  const upd = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: typeof errors = {}
    if (!f.first.trim()) er.first = 'Enter your first name.'
    if (!f.last.trim()) er.last = 'Enter your last name.'
    if (!phoneOk(f.phone)) er.phone = 'Use a Kenyan number like 0712 345 678.'
    if (!emailOk(f.email)) er.email = 'Check the email format, for example name@gmail.com.'
    if (method !== 'pickup') {
      if (!f.area.trim()) er.area = method === 'kenya' ? 'Enter your town.' : 'Enter your estate or area.'
      if (!f.address.trim()) er.address = 'Enter a building, street or landmark.'
    }
    setErrors(er)
    if (Object.keys(er).length) {
      document.getElementById(`f-${Object.keys(er)[0]}`)?.focus()
      return
    }
    setPlacing(true)
    setTimeout(() => {
      const order: Order = {
        id: 'AAL-' + Math.floor(100000 + Math.random() * 900000),
        lines,
        subtotal,
        discount,
        fee,
        total,
        name: `${f.first.trim()} ${f.last.trim()}`,
        phone: f.phone,
        method: opt.label,
        pay: PAY.find((p) => p.id === pay)!.label,
        placed: new Date().toISOString(),
        area: method === 'pickup' ? undefined : f.area,
        tryHome: method === 'tryhome',
      }
      try {
        sessionStorage.setItem('aal-order', JSON.stringify(order))
      } catch {
        /* storage blocked: confirmation page falls back gracefully */
      }
      clear()
      navigate(`/order/${order.id}`)
    }, 1600)
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-16 md:px-8">
      <Link to="/shop" className="inline-flex items-center gap-2 py-2 text-sm text-mute hover:text-ink">
        <ArrowLeft size={14} /> Continue shopping
      </Link>
      <h1 className="display mt-4 text-6xl md:text-7xl">Checkout</h1>

      <form noValidate onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div className="space-y-12">
          <Step n={1} title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="first" label="First name" value={f.first} onChange={upd('first')} error={errors.first} autoComplete="given-name" />
              <Field id="last" label="Last name" value={f.last} onChange={upd('last')} error={errors.last} autoComplete="family-name" />
              <Field id="phone" label="Phone (M-Pesa)" value={f.phone} onChange={upd('phone')} error={errors.phone} autoComplete="tel" inputMode="tel" placeholder="0712 345 678" />
              <Field id="email" label="Email (optional)" value={f.email} onChange={upd('email')} error={errors.email} autoComplete="email" type="email" placeholder="For your receipt" />
            </div>
          </Step>

          <Step n={2} title="Delivery">
            <div className="grid gap-3">
              {delivery.options.map((o) => (
                <RadioCard key={o.id} name="delivery" checked={method === o.id} onChange={() => setMethod(o.id)} title={o.label} note={o.note} right={o.fee === 0 ? 'Free' : o.id === 'nairobi' && subtotal - discount >= delivery.freeOver ? 'Free' : kes(o.fee)} />
              ))}
            </div>
            <AnimatePresence initial={false}>
              {method !== 'pickup' ? (
                <motion.div key="addr" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
                  <div className="grid gap-4 pt-5 sm:grid-cols-2">
                    <Field id="area" label={method === 'kenya' ? 'Town' : 'Estate or area'} value={f.area} onChange={upd('area')} error={errors.area} placeholder={method === 'kenya' ? 'Mombasa' : 'Kilimani'} />
                    <Field id="address" label="Building, street or landmark" value={f.address} onChange={upd('address')} error={errors.address} placeholder="Apartment, house number" />
                    <div className="sm:col-span-2">
                      <Field id="notes" label="Notes for the rider (optional)" value={f.notes} onChange={upd('notes')} textarea />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.p key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 text-sm text-mute">
                  Collect from {store.shop}, {store.city}. We will WhatsApp you when it is ready.
                </motion.p>
              )}
            </AnimatePresence>
          </Step>

          <Step n={3} title="Payment">
            <div className="grid gap-3">
              {PAY.map((p) => (
                <RadioCard key={p.id} name="pay" checked={pay === p.id} onChange={() => setPay(p.id)} title={p.label} note={p.note} icon={<p.icon size={22} />} />
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-mute"><Lock size={14} /> Demo checkout. No payment is taken.</p>
          </Step>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] bg-paper p-6">
            <p className="display text-3xl">Order summary <span className="font-sans text-sm text-mute">({count})</span></p>
            <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1" data-lenis-prevent>
              {lines.map((l) => {
                const p = byId(l.id)!
                return (
                  <li key={l.key} className="flex gap-3">
                    <div className="relative w-16 shrink-0">
                      <Photo id={p.images[0]} alt={p.name} sizes="(min-width: 768px) 20vw, 40vw" className="aspect-[4/5] w-full rounded-xl" />
                      <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-bone">{l.qty}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-mute">{l.colour} · {l.size}</p>
                    </div>
                    <p className="text-sm font-semibold">{kes(p.price * l.qty)}</p>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <Tag size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setPromo(null)
                  }}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="w-full rounded-full border border-line bg-bone py-2.5 pr-3 pl-9 text-sm uppercase outline-none focus:border-ink"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setPromo(
                    code.trim().toUpperCase() === 'LINEN10'
                      ? { ok: true, msg: 'LINEN10 applied. 10% off your order.' }
                      : { ok: false, msg: 'That code is not valid. Try LINEN10.' },
                  )
                }
                className="rounded-full border border-ink px-4 text-sm font-semibold transition hover:bg-ink hover:text-bone"
              >
                Apply
              </button>
            </div>
            {promo && <p className={`mt-2 text-xs ${promo.ok ? 'text-olive' : 'text-clay'}`} role="status">{promo.msg}</p>}

            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{kes(subtotal)}</dd></div>
              {bundleSaving > 0 && <div className="flex justify-between text-olive"><dt>Family saving</dt><dd>−{kes(bundleSaving)}</dd></div>}
              {discount - bundleSaving > 0 && <div className="flex justify-between text-olive"><dt>Promo LINEN10</dt><dd>−{kes(discount - bundleSaving)}</dd></div>}
              <div className="flex justify-between"><dt className="text-mute">{opt.label}</dt><dd>{fee ? kes(fee) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{kes(total)}</dd></div>
            </dl>

            <button
              type="submit"
              disabled={placing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-semibold text-bone transition hover:bg-ink-2 disabled:cursor-wait"
            >
              {placing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="size-1.5 rounded-full bg-bone" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </span>
                  {pay === 'mpesa' ? 'Sending M-Pesa prompt' : 'Placing your order'}
                </span>
              ) : (
                <>Place order · {kes(total)}</>
              )}
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-5 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-semibold text-bone">{n}</span>
        <span className="display text-3xl">{title}</span>
      </legend>
      {children}
    </fieldset>
  )
}

function Field({
  id,
  label,
  error,
  textarea,
  ...rest
}: {
  id: string
  label: string
  error?: string
  textarea?: boolean
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const cls = `peer w-full rounded-2xl border bg-paper px-4 pt-6 pb-2 text-sm outline-none transition placeholder:text-transparent focus:border-ink focus:placeholder:text-mute/60 ${
    error ? 'border-clay' : 'border-line'
  }`
  return (
    <div>
      <div className="relative">
        {textarea ? (
          <textarea id={`f-${id}`} rows={3} className={cls} placeholder={rest.placeholder ?? ' '} aria-invalid={!!error} aria-describedby={error ? `e-${id}` : undefined} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input id={`f-${id}`} className={cls} placeholder={rest.placeholder ?? ' '} aria-invalid={!!error} aria-describedby={error ? `e-${id}` : undefined} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
        )}
        <label
          htmlFor={`f-${id}`}
          className="pointer-events-none absolute top-1.5 left-4 text-[11px] font-semibold text-mute transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-semibold"
        >
          {label}
        </label>
      </div>
      {error && <p id={`e-${id}`} className="mt-1.5 px-1 text-xs text-clay">{error}</p>}
    </div>
  )
}

function RadioCard({ name, checked, onChange, title, note, right, icon }: { name: string; checked: boolean; onChange: () => void; title: string; note: string; right?: string; icon?: React.ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${checked ? 'border-ink bg-paper' : 'border-line hover:border-ink/40'}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition ${checked ? 'border-ink bg-ink' : 'border-line'}`}>
        {checked && <Check size={10} weight="bold" className="text-bone" />}
      </span>
      {icon}
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-mute">{note}</span>
      </span>
      {right && <span className="text-sm font-semibold">{right}</span>}
    </label>
  )
}

/* ───────────── Order confirmation ───────────── */
export function OrderConfirmed() {
  const { id } = useParams()
  let order: Order | null = null
  try {
    const raw = sessionStorage.getItem('aal-order')
    if (raw) order = JSON.parse(raw) as Order
  } catch {
    order = null
  }
  if (order && order.id !== id) order = null

  useEffect(() => {
    document.title = `Order ${id} confirmed | All About Linen`
    window.scrollTo(0, 0)
  }, [id])

  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-10 text-center md:pt-24">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="mx-auto grid size-24 place-items-center rounded-full bg-olive text-bone"
      >
        <Check size={44} weight="bold" />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }} className="display mt-8 text-6xl md:text-7xl">
        Thank you{order ? `, ${order.name.split(' ')[0]}` : ''}.
      </motion.h1>
      <p className="mt-4 text-mute">
        Order <b className="text-ink">{id}</b> is confirmed. We will WhatsApp {order ? order.phone : 'you'} as soon as it is packed.
      </p>

      {order && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease }} className="mt-12 rounded-[28px] bg-paper p-6 text-left md:p-8">
          <ol className="grid gap-4 sm:grid-cols-3">
            {['Order received', 'Packed and checked', order.method === 'Collect at Shop 305' ? 'Ready to collect' : 'Out for delivery'].map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${i === 0 ? 'bg-ink text-bone' : 'bg-oat'}`}>{i === 0 ? <Check size={12} weight="bold" /> : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {order.lines.map((l) => {
              const p = byId(l.id)
              if (!p) return null
              return (
                <li key={l.key} className="flex justify-between py-3 text-sm">
                  <span>{p.name} <span className="text-mute">· {l.colour}, {l.size} × {l.qty}</span></span>
                  <span className="font-semibold">{kes(p.price * l.qty)}</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex justify-between text-sm"><span className="text-mute">{order.method} · {order.pay}</span><span className="text-lg font-semibold">{kes(order.total)}</span></div>
        </motion.div>
      )}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        {order && order.method !== 'Collect at Shop 305' && (
          <Link to={`/track/${id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-4 text-sm font-semibold text-white">
            Track your rider live
          </Link>
        )}
        <a href={whatsapp(`Hi, I just placed order ${id}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-semibold text-bone">
          <WhatsappLogo size={18} weight="fill" /> Message us about this order
        </a>
        <Link to="/shop" className="rounded-full border border-ink px-6 py-4 text-sm font-semibold">Keep shopping</Link>
      </div>
    </div>
  )
}
