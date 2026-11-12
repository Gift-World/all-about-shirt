import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { ease } from './ui'

/** Dot cursor that grows into a label over elements with data-cursor. Fine pointers only. */
export function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })
  const [label, setLabel] = useState<string | null>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    setOn(true)
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const el = (e.target as HTMLElement | null)?.closest?.('[data-cursor]') as HTMLElement | null
      setLabel(el?.dataset.cursor ?? null)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])

  if (!on) return null
  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed top-0 left-0 z-[150] mix-blend-normal"
    >
      <motion.div
        animate={{ width: label ? 76 : 10, height: label ? 76 : 10, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-[11px] font-semibold tracking-wide text-bone"
      >
        <AnimatePresence>
          {label && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}>
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/** Branded intro once per session: counter, wordmark, then the curtain lifts. */
export function Intro() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('aal-intro')
    } catch {
      return false
    }
  })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem('aal-intro', '1')
    } catch {
      /* ignore */
    }
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1500)
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(() => setShow(false), 250)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[300] flex flex-col justify-between bg-ink p-6 text-bone md:p-10"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: 1, ease }}
        >
          <div className="flex justify-between text-xs text-bone/50">
            <span>Nairobi · Ex UK curated</span>
            <span>Men · Women · Kids</span>
          </div>
          <div className="overflow-hidden">
            <motion.p
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease }}
              className="display text-[16vw] leading-[0.9] md:text-[11vw]"
            >
              All About <span className="italic text-sand">Linen</span>
            </motion.p>
          </div>
          <div className="flex items-end justify-between">
            <div className="h-px w-1/2 bg-bone/20">
              <div className="h-px origin-left bg-bone" style={{ transform: `scaleX(${n / 100})` }} />
            </div>
            <span className="display text-6xl tabular-nums md:text-8xl">{n}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
