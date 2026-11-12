// Community comments and ratings. The pitch keeps them on this device; a live shop stores them
// in a database and confirms each person with a one time WhatsApp code (no passwords).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { byId, type Product } from '../data/catalog'

export type Comment = {
  id: string
  key: string // product id
  name: string
  place: string
  text: string
  rating?: number
  at: number
  likes: number
  verified: boolean // bought this piece
  reply?: string // answer from the shop
  mine?: boolean
}
export type Member = { name: string; place: string }

const seed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
const PEOPLE = [
  ['Brian O.', 'Kilimani'], ['Wanjiru K.', 'Runda'], ['Amina Y.', 'South B'], ['Kevin M.', 'Westlands'], ['Grace N.', 'Karen'],
  ['Hassan A.', 'Parklands'], ['Faith A.', 'Lavington'], ['Dennis K.', 'Upper Hill'], ['Mercy W.', 'Kileleshwa'], ['Joy A.', 'Kasarani'],
]
type Line = { text: string; rating?: number; reply?: string; verified?: boolean }
const LINES = (p: Product): Line[] => [
  { text: `Is this still available in ${p.sizes[0]}?`, reply: `Yes, and it is the only one. Tap Bag it and we hold it for you.` },
  { text: 'The colour is even nicer in person. Wore mine to a wedding in Naivasha and got asked twice where it was from.', rating: 5, verified: true },
  { text: 'Does the linen crease a lot?', reply: 'A little, that is linen. Hang it after washing and it relaxes by lunch. We steam every piece before it leaves.' },
  { text: 'Delivered to my office the same evening. Packed so well.', rating: 5, verified: true },
  { text: p.category === 'Trousers' ? 'Measurements were spot on. I checked the waist against my own pair before ordering.' : 'Fits true. I am 178 cm and 80 kg and my L sits perfectly.', rating: 5, verified: true },
  { text: 'Pair it with white sneakers, trust me.' },
  { text: 'Can I see it on someone before I buy?', reply: 'Sure, send us a WhatsApp and we will send a short video of this exact piece.' },
  { text: 'Third piece from here this month. The quality is not like downtown.', rating: 4, verified: true },
]

/** Sample conversation under a piece, the same on every load. */
export function sampleComments(p: Product): Comment[] {
  const r = seed(p.id + 'c')
  const n = 1 + Math.floor(r() * 4)
  const lines = LINES(p)
  const start = Math.floor(r() * lines.length)
  return Array.from({ length: n }, (_, k) => {
    const l = lines[(start + k * 3) % lines.length]
    const [name, place] = PEOPLE[Math.floor(r() * PEOPLE.length)]
    return {
      id: `${p.id}-s${k}`,
      key: p.id,
      name,
      place,
      text: l.text,
      rating: l.rating,
      reply: l.reply,
      verified: !!l.verified,
      likes: Math.floor(r() * 40),
      at: Date.now() - (k + 1) * (3 + Math.floor(r() * 30)) * 3600000,
    }
  })
}

type State = {
  posted: Comment[]
  liked: string[]
  me: Member | null
  join: (m: Member) => void
  post: (key: string, text: string, rating?: number) => void
  like: (id: string) => void
}
export const useCommunity = create<State>()(
  persist(
    (set, get) => ({
      posted: [],
      liked: [],
      me: null,
      join: (me) => set({ me }),
      post: (key, text, rating) => {
        const me = get().me
        if (!me) return
        set({
          posted: [
            { id: `c${Date.now()}`, key, name: me.name, place: me.place, text, rating, at: Date.now(), likes: 0, verified: boughtHere(key), mine: true },
            ...get().posted,
          ],
        })
      },
      like: (id) => set({ liked: get().liked.includes(id) ? get().liked.filter((x) => x !== id) : [...get().liked, id] }),
    }),
    { name: 'aal-community' },
  ),
)

/** Verified buyer: this device has an order with this piece in it. */
function boughtHere(id: string) {
  try {
    const o = JSON.parse(sessionStorage.getItem('aal-order') || 'null') as { lines?: { id: string }[] } | null
    return !!o?.lines?.some((l) => l.id === id)
  } catch {
    return false
  }
}

export function commentsFor(keys: string[], posted: Comment[]) {
  const mine = posted.filter((c) => keys.includes(c.key))
  const samples = keys.flatMap((k) => {
    const p = byId(k)
    return p ? sampleComments(p) : []
  })
  return [...mine, ...samples.sort((a, b) => b.at - a.at)]
}

export const ago = (t: number) => {
  const h = Math.max(1, Math.round((Date.now() - t) / 3600000))
  if (Date.now() - t < 60000) return 'just now'
  if (h < 24) return `${h}h`
  const d = Math.round(h / 24)
  return d < 7 ? `${d}d` : `${Math.round(d / 7)}w`
}
