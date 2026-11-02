import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { CATEGORIES } from './src/data/categories.js'
import { EVENTS } from './src/data/events.js'

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dateFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/**
 * Bakes a plain HTML version of the site's content into index.html at build time.
 * Visitors with JavaScript never see it (React replaces it before first paint), but
 * search engines, link previews and anything that reads the page without running
 * JavaScript get real, linked content instead of an empty <div>.
 */
function staticContent() {
  return {
    name: 'mela-static-content',
    transformIndexHtml(html) {
      const category = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
      const items = [...EVENTS]
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
        .map(
          (e) => `<li><article><h3><a href="/events/${e.slug}">${escape(e.title)}</a></h3>
<p>${escape(category[e.category])} in ${escape(e.city)}. ${escape(dateFmt.format(new Date(e.start)))} at ${escape(e.venue)}, ${escape(e.address)}. ${e.price ? `₹${e.price.toLocaleString('en-IN')}` : 'Free'}.</p>
<p>${escape(e.summary)}</p><p><a href="/register?event=${e.slug}">Register for ${escape(e.title)}</a></p></article></li>`,
        )
        .join('\n')
      const fallback = `<div class="static-fallback">
<header><h1>mela: find events across eight Indian cities</h1>
<p>An event management website: browse upcoming gigs, talks, workshops, food walks and screenings, search and filter them by category, city and date, view event details, register with a validated form, and keep your tickets (with QR codes and PDF download) in My tickets.</p>
<nav><a href="/">Home</a> <a href="/events">All events</a> <a href="/register">Register</a> <a href="/tickets">My tickets</a></nav></header>
<main><h2>Upcoming events</h2><ul>
${items}
</ul></main></div>`
      return html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), staticContent()],
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
