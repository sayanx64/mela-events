import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(SplitText)

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Automated browsers (screenshot tools, crawlers, Lighthouse) get the finished page straight
// away, so nothing is ever left hidden waiting for a scroll that never happens.
const isAutomated = () =>
  navigator.webdriver || /HeadlessChrome|Lighthouse|bot|crawler|spider|preview/i.test(navigator.userAgent)

let lenis = null

/** Inertial smooth scrolling (Lenis), driven by GSAP's ticker. Off for reduced motion. */
export function startSmoothScroll() {
  if (lenis || reduceMotion() || isAutomated()) return
  lenis = new Lenis({
    lerp: 0.09,
    // Let dialogs and horizontally scrolling rows handle their own scrolling.
    prevent: (node) => Boolean(node.closest?.('dialog, .scroll-row')),
  })
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

/** Runs `fn` once, the first time `el` scrolls into view. */
function onceVisible(el, fn, observers) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        fn()
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  io.observe(el)
  observers.push(io)
}

const EASE = 'expo.out'

/**
 * Page entrance and scroll reveals for everything inside `root`:
 * - hero headline: letters rise out of a mask one after another
 * - page and section headings: lines rise out of a mask as they come into view
 * - photos: a clip-path opens from the centre while the image settles from a zoom
 * - category raffle tickets: drop in with a slight tilt, like tickets being dealt
 * Returns a cleanup function that restores the DOM exactly.
 */
export function animatePage(root) {
  if (!root || reduceMotion() || isAutomated()) return () => {}
  const observers = []
  let alive = true
  const ctx = gsap.context(() => {}, root)

  ctx.add(() => {
    const hero = root.querySelector('.hero-title')
    const headings = [...root.querySelectorAll('h1:not(.hero-title), h2.display')]
    gsap.set([hero, ...headings].filter(Boolean), { autoAlpha: 0 })

    // Photos (skip the ones printed on tickets and the parallax covers that morph between pages).
    root.querySelectorAll('.img-frame').forEach((frame) => {
      if (frame.closest('.ticket') || frame.classList.contains('parallax')) return
      const img = frame.querySelector('img')
      gsap.set(frame, { clipPath: 'inset(14% 10% 14% 10% round 14px)' })
      gsap.set(img, { scale: 1.3 })
      onceVisible(
        frame,
        () => {
          gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0% round 6px)', duration: 1.5, ease: EASE })
          gsap.to(img, { scale: 1, duration: 1.8, ease: EASE })
        },
        observers,
      )
    })

    // Raffle tickets deal in.
    const raffles = [...root.querySelectorAll('.raffle')]
    if (raffles.length) {
      gsap.set(raffles, { y: 70, rotate: (i) => (i % 2 ? 5 : -5), autoAlpha: 0 })
      onceVisible(
        raffles[0],
        () => gsap.to(raffles, { y: 0, rotate: 0, autoAlpha: 1, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.07 }),
        observers,
      )
    }

    // Hero supporting copy follows the headline.
    const heroBits = hero ? [...hero.parentElement.children].filter((el) => el !== hero) : []
    if (heroBits.length) gsap.set(heroBits, { y: 24, autoAlpha: 0 })

    // Split text only once the fonts are in, so line breaks are measured correctly.
    // Fonts are self-hosted and preloaded; never wait more than 400ms for them.
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 400))]).then(() => {
      if (!alive) return
      ctx.add(() => {
        if (hero) {
          const split = SplitText.create(hero, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line' })
          gsap.set(hero, { autoAlpha: 1 })
          gsap.from(split.chars, { yPercent: 120, rotate: 8, duration: 1.1, ease: EASE, stagger: 0.03 })
          gsap.to(heroBits, { y: 0, autoAlpha: 1, duration: 1, ease: EASE, stagger: 0.06, delay: 0.35 })
        }
        headings.forEach((el) => {
          const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
          gsap.set(el, { autoAlpha: 1 })
          gsap.set(split.lines, { yPercent: 110 })
          onceVisible(el, () => gsap.to(split.lines, { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.1 }), observers)
        })
      })
    })
  })

  return () => {
    alive = false
    observers.forEach((io) => io.disconnect())
    ctx.revert()
  }
}
