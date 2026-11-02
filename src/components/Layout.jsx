import { ViewTransition } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import Doodles from './Doodles.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const { pathname } = useLocation()
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
        <main id="main" tabIndex={-1} className="outline-none">
          <Outlet />
        </main>
      </ViewTransition>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
