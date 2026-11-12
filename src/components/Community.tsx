// Community: comments, questions and ratings from people who shop here.
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUp, ChatCircleDots, Heart, SealCheck, Star, Storefront, X } from '@phosphor-icons/react'
import { branches, type Product } from '../data/catalog'
import { ago, commentsFor, useCommunity, type Comment } from '../store/community'
import { ease } from './ui'

/* ───────────── one comment ───────────── */
function CommentRow({ c }: { c: Comment }) {
  const liked = useCommunity((s) => s.liked.includes(c.id))
  const like = useCommunity((s) => s.like)
  return (
    <li className="flex gap-3 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${c.mine ? 'bg-clay text-white' : 'bg-oat text-ink'}`}>
        {c.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-xs">
          <b className="font-semibold">{c.name}</b>
          <span className="text-mute">{c.place} · {ago(c.at)}</span>
          {c.verified && <span className="inline-flex items-center gap-0.5 font-semibold text-olive"><SealCheck size={12} weight="fill" /> Bought it</span>}
        </p>
        {c.rating && (
          <span className="mt-1 flex gap-0.5" aria-label={`Rated ${c.rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={11} weight={i <= c.rating! ? 'fill' : 'regular'} />)}
          </span>
        )}
        <p className="mt-1 text-sm leading-snug">{c.text}</p>
        {c.reply && (
          <div className="mt-2 flex gap-2 rounded-xl bg-bone px-3 py-2 text-xs">
            <Storefront size={14} className="mt-0.5 shrink-0 text-olive" />
            <p><b className="font-semibold">All About Linen</b> <span className="text-mute">{c.reply}</span></p>
          </div>
        )}
      </div>
      <button type="button" onClick={() => like(c.id)} aria-pressed={liked} aria-label="Like comment" className="flex w-8 shrink-0 flex-col items-center gap-0.5 pt-1 text-[10px] text-mute">
        <Heart size={16} weight={liked ? 'fill' : 'regular'} className={liked ? 'text-clay' : ''} />
        {c.likes + (liked ? 1 : 0) || ''}
      </button>
    </li>
  )
}

/* ───────────── write a comment (join once with a name, no password) ───────────── */
export function Composer({ productIds, withRating = false, compact = false }: { productIds: string[]; withRating?: boolean; compact?: boolean }) {
  const me = useCommunity((s) => s.me)
  const join = useCommunity((s) => s.join)
  const post = useCommunity((s) => s.post)
  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [place, setPlace] = useState('')
  const [joining, setJoining] = useState(false)

  const send = () => {
    const t = text.trim()
    if (!t) return
    if (!me) return setJoining(true)
    post(productIds[0], t, rating || undefined)
    setText('')
    setRating(0)
  }

  if (joining && !me) {
    return (
      <form
        className="rounded-2xl bg-bone p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          join({ name: name.trim(), place: place.trim() || 'Nairobi' })
          setJoining(false)
          if (text.trim()) post(productIds[0], text.trim(), rating || undefined)
          setText('')
          setRating(0)
        }}
      >
        <p className="text-sm font-semibold">Join the community</p>
        <p className="mt-0.5 text-xs text-mute">Just a name and your area. No account, no password. In the live shop you confirm with a one time WhatsApp code.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" aria-label="First name" className="min-w-0 rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink" />
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Area, e.g. Kilimani" aria-label="Area" className="min-w-0 rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink" />
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setJoining(false)} className="flex-1 rounded-full border border-line py-2.5 text-xs font-semibold">Cancel</button>
          <button type="submit" className="flex-[2] rounded-full bg-ink py-2.5 text-xs font-semibold text-bone">Join and post</button>
        </div>
      </form>
    )
  }

  return (
    <div className={compact ? '' : 'rounded-2xl bg-bone p-3'}>
      {withRating && (
        <div className="mb-2 flex items-center gap-2 px-1 text-xs text-mute">
          Your rating
          <span className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onClick={() => setRating(i === rating ? 0 : i)} aria-label={`${i} stars`} className="p-0.5">
                <Star size={18} weight={i <= rating ? 'fill' : 'regular'} className={i <= rating ? 'text-clay' : ''} />
              </button>
            ))}
          </span>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex items-center gap-2 rounded-full border border-line bg-paper p-1.5 pl-4 focus-within:border-ink"
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={me ? `Comment as ${me.name}…` : 'Ask a question or share how it fits…'} aria-label="Write a comment" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute/70" />
        <button type="submit" disabled={!text.trim()} aria-label="Post" className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-bone disabled:opacity-30">
          <ArrowUp size={14} weight="bold" />
        </button>
      </form>
    </div>
  )
}

export function useCommentCount(ids: string[]) {
  const posted = useCommunity((s) => s.posted)
  return useMemo(() => commentsFor(ids, posted).length, [ids, posted])
}

/* ───────────── the TikTok style sheet inside the feed ───────────── */
export function CommentSheet({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const posted = useCommunity((s) => s.posted)
  const ids = products.map((p) => p.id)
  const list = useMemo(() => commentsFor(ids, posted), [ids.join(), posted])
  return (
    <>
      <motion.div className="absolute inset-0 z-40 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label="Comments"
        className="absolute inset-x-0 bottom-0 z-50 flex h-[72%] flex-col rounded-t-[24px] bg-paper text-ink"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.4, ease }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">{list.length} comments</p>
          <button type="button" onClick={onClose} aria-label="Close comments" className="grid size-8 place-items-center rounded-full hover:bg-black/5"><X size={16} /></button>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-line/60 overflow-y-auto px-4" data-lenis-prevent>
          {list.map((c) => <CommentRow key={c.id} c={c} />)}
        </ul>
        <div className="border-t border-line p-3">
          <Composer productIds={ids} compact />
        </div>
      </motion.div>
    </>
  )
}

/* ───────────── community on the product page ───────────── */
export function CommunitySection({ p }: { p: Product }) {
  const posted = useCommunity((s) => s.posted)
  const list = useMemo(() => commentsFor([p.id], posted), [p.id, posted])
  const [open, setOpen] = useState(false)
  const rated = list.filter((c) => c.rating)
  const avg = rated.length ? rated.reduce((a, c) => a + (c.rating ?? 0), 0) / rated.length : 0
  return (
    <section className="mt-16 md:mt-24" aria-labelledby="community-title">
      <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-16">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5 text-clay"><ChatCircleDots size={13} weight="fill" /> The community</p>
          <h2 id="community-title" className="display mt-2 text-5xl md:text-6xl">Talk about this piece</h2>
          <p className="mt-3 text-sm text-mute">Ask about fit, share how you styled it, or rate it after it arrives. The {branches[p.branch].house} team answers here too.</p>
          {rated.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} weight={i <= Math.round(avg) ? 'fill' : 'regular'} />)}</span>
              <b className="font-semibold">{avg.toFixed(1)}</b> <span className="text-mute">from {rated.length} {rated.length === 1 ? 'rating' : 'ratings'} on this piece</span>
            </p>
          )}
          <div className="mt-5">
            <Composer productIds={[p.id]} withRating />
          </div>
        </div>
        <div>
          <ul className="divide-y divide-line">
            {(open ? list : list.slice(0, 4)).map((c) => <CommentRow key={c.id} c={c} />)}
          </ul>
          {list.length > 4 && (
            <button type="button" onClick={() => setOpen(!open)} className="mt-2 py-2 text-sm font-semibold underline underline-offset-4">
              {open ? 'Show less' : `Show all ${list.length}`}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
