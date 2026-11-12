import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Lenis from 'lenis'
import { CartDrawer, Footer, Header, SearchOverlay, Toast } from './components/Chrome'
import { ease } from './components/ui'
import { Cursor, Intro } from './components/Flourish'
import { Home } from './pages/Home'
import { Shop } from './pages/Shop'
import { Product } from './pages/Product'
import { Checkout, OrderConfirmed } from './pages/Checkout'
import { Legal, NotFound, Visit, Wishlist } from './pages/Misc'
import { Drop } from './pages/Drop'
import { Family } from './pages/Family'
import { Match } from './pages/Match'
import { Track } from './pages/Track'
import { Stylist } from './components/Stylist'

// the owner studio loads on its own, so shoppers never download it
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))

let lenis: Lenis | null = null

function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => {
      lenis?.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
      lenis = null
    }
  }, [])
  return null
}

function Routed() {
  const location = useLocation()
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        id="main"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, ease }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:branch" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmed />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/visit" element={<Visit />} />
          <Route path="/drop" element={<Drop />} />
          <Route path="/family" element={<Family />} />
          <Route path="/match" element={<Match />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="/legal/:page" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  )
}

/** /admin is the owner studio: no shop header, footer, cursor or chat. */
function Shell() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="grid min-h-svh place-items-center bg-ink text-sm text-bone/60">Opening the studio…</div>}>
        <Admin />
      </Suspense>
    )
  }
  return (
      <div className="grain">
        <a href="#main" className="fixed top-2 left-2 z-[200] -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bone focus:translate-y-0">
          Skip to content
        </a>
        <Intro />
        <Cursor />
        <SmoothScroll />
        <Header />
        <Routed />
        <Footer />
        <CartDrawer />
        <SearchOverlay />
        <Toast />
        <Stylist />
      </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
