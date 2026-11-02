import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

function Message({ title, children }) {
  return (
    <section className="wrap pt-16 pb-8 lg:pt-24">
      <h1 className="display max-w-[14ch] text-[clamp(3.5rem,10vw,8rem)] leading-[0.86]">{title}</h1>
      <div className="mt-8 max-w-[34rem] text-[1.125rem] leading-relaxed">{children}</div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/events" className="btn btn-primary">
          Browse events
        </Link>
        <Link to="/" className="btn btn-secondary">
          Go to the home page
        </Link>
      </div>
    </section>
  )
}

export default function NotFound() {
  return (
    <>
      <title>Page not found | mela</title>
      <Message title="This page isn’t on the bill.">
        <p>The link may be old or mistyped. Everything that’s on right now is on the events page.</p>
      </Message>
    </>
  )
}

export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />
  console.error(error)
  return (
    <>
      <title>Something broke | mela</title>
      <Message title="Something broke on this page.">
        <p>Reloading usually fixes it. Your tickets are stored on this device and are safe.</p>
      </Message>
    </>
  )
}
