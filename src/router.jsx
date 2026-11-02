import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import NotFound, { RouteError } from './pages/NotFound.jsx'

// Every page except Home is its own bundle, downloaded the first time it's visited.
const page = (load) => () => load().then((module) => ({ Component: module.default }))

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    // Shown for the split second while a page loaded directly by URL downloads its code.
    HydrateFallback: () => null,
    children: [
      {
        // Pathless route so errors render inside the layout, keeping the header and footer.
        ErrorBoundary: RouteError,
        children: [
          { index: true, Component: Home },
          { path: 'events', lazy: page(() => import('./pages/Events.jsx')) },
          { path: 'events/:slug', lazy: page(() => import('./pages/EventDetail.jsx')) },
          { path: 'register', lazy: page(() => import('./pages/Register.jsx')) },
          { path: 'tickets', lazy: page(() => import('./pages/Tickets.jsx')) },
          { path: '*', Component: NotFound },
        ],
      },
    ],
  },
])
