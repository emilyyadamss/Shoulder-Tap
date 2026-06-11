import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar, EmptyState, SearchIcon } from '../components/ui'

export function People() {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState<string | null>(null)

  const allSkills = useMemo(() => {
    const counts = new Map<string, number>()
    for (const u of data.users)
      for (const s of u.skills) counts.set(s, (counts.get(s) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s]) => s)
  }, [data.users])

  const people = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.users.filter((u) => {
      if (skill && !u.skills.includes(skill)) return false
      if (!q) return true
      return [u.name, u.headline, u.location, u.bio, ...u.skills].join(' ').toLowerCase().includes(q)
    })
  }, [data.users, query, skill])

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>People</h1>
          <p>Builders, designers, and engineers looking to lend their skills.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name, skill, or location"
            aria-label="Search people"
          />
        </div>
      </div>

      <div className="filter-row">
        <button className={`tag${skill === null ? ' selected' : ''}`} onClick={() => setSkill(null)}>
          All skills
        </button>
        {allSkills.map((s) => (
          <button
            key={s}
            className={`tag${skill === s ? ' selected' : ''}`}
            onClick={() => setSkill((cur) => (cur === s ? null : s))}
          >
            {s}
          </button>
        ))}
      </div>

      {people.length === 0 ? (
        <EmptyState icon="🫥" title="Nobody matches">
          <p>Try a different search or skill filter.</p>
        </EmptyState>
      ) : (
        <div className="grid">
          {people.map((u, i) => (
            <Link key={u.id} to={`/people/${u.id}`}>
              <article className="card person-card" style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Avatar user={u} size={52} />
                  <div>
                    <h3 style={{ fontSize: 18 }}>{u.name}</h3>
                    <p className="muted" style={{ fontSize: 13 }}>
                      {u.headline}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  {u.bio.length > 110 ? `${u.bio.slice(0, 110)}…` : u.bio}
                </p>
                <div className="card-roles">
                  {u.skills.slice(0, 4).map((s) => (
                    <span key={s} className="tag">
                      {s}
                    </span>
                  ))}
                  {u.skills.length > 4 && <span className="tag">+{u.skills.length - 4}</span>}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
