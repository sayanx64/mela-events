import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout.jsx'
import EventDetail from './pages/EventDetail.jsx'
import Events from './pages/Events.jsx'
import Home from './pages/Home.jsx'
import NotFound, { RouteError } from './pages/NotFound.jsx'
import Register from './pages/Register.jsx'
import Tickets from './pages/Tickets.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        // Pathless route so errors render inside the layout, keeping the header and footer.
        ErrorBoundary: RouteError,
        children: [
          { index: true, Component: Home },
          { path: 'events', Component: Events },
          { path: 'events/:slug', Component: EventDetail },
          { path: 'register', Component: Register },
          { path: 'tickets', Component: Tickets },
          { path: '*', Component: NotFound },
        ],
      },
    ],
  },
])
