import { useEffect, useLayoutEffect, useRef, ViewTransition } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { animatePage, startSmoothScroll } from '../lib/motion.js'
import Doodles from './Doodles.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  useEffect(() => startSmoothScroll(), [])
  // Re-run the entrance and scroll reveals whenever a new page mounts.
  useLayoutEffect(() => animatePage(mainRef.current), [pathname])
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Doodles />
      <Header />
      {/* Keyed by path: moving to another page cross-fades, but changing filters
          or search params on the same page updates in place without animating. */}
      <ViewTransition key={pathname} update="none">
        <main ref={mainRef} id="main" tabIndex={-1} className="outline-none">
          <Outlet />
        </main>
      </ViewTransition>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
