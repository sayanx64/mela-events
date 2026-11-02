# mela: an event discovery and registration site

A responsive event management website built for **K Explore, Web Designing**. Browse 25 events across eight Indian cities, search and filter them, read the details, register with a validated form, and keep your tickets on your device.

**Live site:** https://mela-events.vercel.app
**Repository:** https://github.com/sayanx64/mela-events

## Features

**Required by the brief**
- Home page with a hero section, featured events, categories and upcoming events
- Event cards with name, date, venue, image and a short description
- Search by name, venue, city, host or tag, plus filters for category, city, date range and free events, and sorting
- Event detail pages with schedule, venue, map link, seats left and a registration option
- Registration form (name, email, phone, event, seats) with JavaScript validation and a confirmation message
- Fully responsive on mobile, tablet and desktop

**Bonus features**
- Dark and light mode (follows the system setting, remembers your choice, circular reveal transition)
- Live countdown timers on the hero tickets and on every event page
- Animations: draggable ticket stack, page transitions, a "Confirmed" stamp on registration, a drifting photo background
- Local Storage registration management: My tickets page with QR codes, cancel with undo, add to calendar (.ics), export as JSON and remove all

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 (HTML5, CSS3, JavaScript) |
| Build | Vite 8 |
| Routing | React Router 8 |
| Styling | Tailwind CSS 4 plus custom CSS (masks, container queries, scroll-driven animation) |
| Motion | Motion for React, CSS animations and the View Transitions API |
| Data | Local Storage, through a small store module in `src/lib/store.js` |
| Tests | Vitest (43 unit tests) |
| Hosting | Vercel |

## How it works

- **Event data** lives in `src/data/events.js`. Times are stored in IST and always shown in IST.
- **Filters** are kept in the URL (`/events?city=Pune&category=music`), so results can be shared and bookmarked.
- **Validation** (`src/lib/validation.js`) runs on blur and on submit. It checks names (any script), email format (and suggests fixes for typos like `gmial.com`), 10-digit Indian mobile numbers, available seats and duplicate registrations. Errors appear next to each field and in a summary that links to the fields.
- **Registrations** are stored under the `mela:v1:registrations` key. The store checks records as it reads them, notifies the UI through `useSyncExternalStore`, and syncs across browser tabs.
- **Seats left** = capacity − seats already taken − seats booked on this device.

## Project structure

```
src/
  components/   UI pieces: tickets, cards, header, footer, dialog
  data/         events and categories
  hooks/        shared clock, registrations, theme, URL filters
  lib/          validation, store, dates, event queries, calendar file
  pages/        Home, Events, EventDetail, Register, Tickets, NotFound
  styles/       design tokens and component styles
```

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # production build in dist/
```

## Credits

Photos are from [Unsplash](https://unsplash.com/license). Fonts are Bricolage Grotesque and Schibsted Grotesk (SIL Open Font License). The events, venues and hosts are made up for this project.
