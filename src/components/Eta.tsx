import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CaretDown, Check, Moped, TShirt } from '@phosphor-icons/react'
import { ESTATES, eta, findEstate } from '../data/delivery'
import { useShop } from '../store/shop'
import { ease } from './ui'

/** Uber style arrival promise with an estate picker. */
export function EtaLine({ tryHome = true }: { tryHome?: boolean }) {
  const area = useShop((s) => s.area)
  const setArea = useShop((s) => s.setArea)
  const [open, setOpen] = useState(false)
  const [, tick] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const estate = findEstate(area) ?? ESTATES[4]
  const e = eta(estate)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000)
    const close = (ev: MouseEvent) => !ref.current?.contains(ev.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => {
      clearInterval(t)
      document.removeEventListener('mousedown', close)
    }
  }, [])

  return (
    <div ref={ref} className="relative mt-6 rounded-[22px] border border-line bg-paper p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bone">
          <Moped size={20} />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p>
            Arrives in{' '}
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-0.5 py-0.5 font-semibold underline decoration-dotted underline-offset-4">
              {estate.name} <CaretDown size={12} />
            </button>{' '}
            <b className="font-semibold">{e.label}</b>
          </p>
          <p className="mt-0.5 text-xs text-mute">
            {e.cutoff ? (
              <>
                Order in the next <span className="font-semibold text-clay tabular-nums">{e.cutoff}</span> for same day delivery · {estate.mins} min ride from Shop 305
              </>
            ) : (
              <>Same day cut off is 2pm. First rider leaves at 10am.</>
            )}
          </p>
          {tryHome && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-oat px-2.5 py-1 text-[11px] font-semibold">
              <TShirt size={13} /> Try at home available · pay only for what you keep
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease }}
            className="absolute inset-x-3 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-line bg-paper p-1.5 shadow-2xl"
            data-lenis-prevent
            role="listbox"
            aria-label="Delivery area"
          >
            {ESTATES.map((x) => (
              <li key={x.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={x.name === estate.name}
                  onClick={() => {
                    setArea(x.name)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-oat"
                >
                  <span className="flex items-center gap-2">
                    {x.name === estate.name ? <Check size={14} weight="bold" /> : <span className="w-3.5" />}
                    {x.name}
                  </span>
                  <span className="text-xs text-mute">{eta(x).label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
