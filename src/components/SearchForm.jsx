import { Search } from 'lucide-react'
import { useId, useState } from 'react'
import { useNavigate } from 'react-router'

/** Hero search. Submitting takes you to the events page with the query applied. */
export default function SearchForm({ className = '' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const id = useId()

  const onSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/events?q=${encodeURIComponent(q)}` : '/events')
  }

  return (
    <form role="search" onSubmit={onSubmit} className={`flex gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search events
      </label>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try jazz, hackathon or Pune"
          className="field-input h-14 rounded-full pl-12"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>
      <button type="submit" className="btn btn-primary h-14 px-6">
        Search
      </button>
    </form>
  )
}
