import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { byId } from '../data/catalog'

export type Line = { key: string; id: string; colour: string; size: string; qty: number; bundle?: string }

type Toast = { id: number; text: string } | null

type State = {
  lines: Line[]
  wishlist: string[]
  cartOpen: boolean
  searchOpen: boolean
  toast: Toast
  area: string
  setArea: (a: string) => void
  add: (id: string, colour: string, size: string, qty?: number) => void
  addBundle: (bundle: string, items: { id: string; colour: string; size: string }[]) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  toggleWish: (id: string) => void
  openCart: (v: boolean) => void
  openSearch: (v: boolean) => void
  notify: (text: string) => void
}

/** One of one pieces can only be bought once. */
export const maxQty = (id: string) => (byId(id)?.sizes.length === 1 ? 1 : 9)

export const useShop = create<State>()(
  persist(
    (set, get) => ({
      lines: [],
      wishlist: [],
      cartOpen: false,
      searchOpen: false,
      toast: null,
      area: 'Kilimani',
      setArea: (area) => set({ area }),
      add: (id, colour, size, qty = 1) => {
        const key = `${id}|${colour}|${size}`
        const lines = [...get().lines]
        const found = lines.find((l) => l.key === key)
        const max = maxQty(id)
        if (found && found.qty >= max) {
          get().notify(`${byId(id)?.name} is already in your bag. There is only one.`)
          set({ cartOpen: true })
          return
        }
        if (found) found.qty = Math.min(found.qty + qty, max)
        else lines.push({ key, id, colour, size, qty: Math.min(qty, max) })
        set({ lines: lines.map((l) => ({ ...l })), cartOpen: true })
      },
      addBundle: (bundle, items) => {
        const lines = get().lines.filter((l) => l.bundle !== bundle)
        for (const it of items) lines.push({ key: `${it.id}|${it.colour}|${it.size}|${bundle}`, ...it, qty: 1, bundle })
        set({ lines, cartOpen: true })
      },
      setQty: (key, qty) =>
        set({ lines: get().lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(maxQty(l.id), qty)) } : l)) }),
      remove: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      clear: () => set({ lines: [] }),
      toggleWish: (id) => {
        const has = get().wishlist.includes(id)
        set({ wishlist: has ? get().wishlist.filter((w) => w !== id) : [...get().wishlist, id] })
        const p = byId(id)
        get().notify(has ? `Removed ${p?.name} from your wishlist` : `Saved ${p?.name} to your wishlist`)
      },
      openCart: (v) => set({ cartOpen: v }),
      openSearch: (v) => set({ searchOpen: v }),
      notify: (text) => {
        const id = Date.now()
        set({ toast: { id, text } })
        setTimeout(() => get().toast?.id === id && set({ toast: null }), 2800)
      },
    }),
    {
      name: 'aal-shop-v2', // v2: real Instagram stock, old dummy ids dropped
      partialize: (s) => ({ lines: s.lines, wishlist: s.wishlist, area: s.area }),
    },
  ),
)

/** Family bundles: 10% off when a bundle holds 3+ pieces from at least 2 houses. */
export const BUNDLE_MIN = 3
export const cartTotals = (lines: Line[]) => {
  let subtotal = 0
  let count = 0
  const groups = new Map<string, { sum: number; qty: number; houses: Set<string> }>()
  for (const l of lines) {
    const p = byId(l.id)
    if (!p) continue
    subtotal += p.price * l.qty
    count += l.qty
    if (l.bundle) {
      const g = groups.get(l.bundle) ?? { sum: 0, qty: 0, houses: new Set<string>() }
      g.sum += p.price * l.qty
      g.qty += l.qty
      g.houses.add(p.branch)
      groups.set(l.bundle, g)
    }
  }
  let bundleSaving = 0
  for (const g of groups.values()) if (g.qty >= BUNDLE_MIN && g.houses.size >= 2) bundleSaving += Math.round(g.sum * 0.1)
  return { subtotal, count, bundleSaving }
}
