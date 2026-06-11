import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { ProjectCard, openSlots } from '../components/ProjectCard'
import { EmptyState, SearchIcon } from '../components/ui'

export function Discover() {
  const { data, currentUser } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [forMe, setForMe] = useState(false)

  const categories = useMemo(
    () => [...new Set(data.projects.map((p) => p.category))].sort(),
    [data.projects],
  )

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase()
    const mySkills = new Set(currentUser.skills)
    return data.projects
      .filter((p) => {
        if (category && p.category !== category) return false
        if (forMe) {
          const matches = p.roles.some(
            (r) => r.filledBy.length < r.slots && r.skills.some((s) => mySkills.has(s)),
          )
          if (!matches) return false
        }
        if (!q) return true
        const haystack = [
          p.title,
          p.tagline,
          p.description,
          p.category,
          ...p.tags,
          ...p.roles.flatMap((r) => [r.title, ...r.skills]),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [data.projects, query, category, forMe, currentUser.skills])

  const totalOpen = data.projects.reduce((n, p) => n + openSlots(p), 0)

  return (
    <div className="container">
      <section className="hero">
        <h1>
          Great projects are missing <em>one person.</em> Maybe you.
        </h1>
        <p>
          Post what you're building and the roles you need — or tap a project on the shoulder and
          offer the skills you have. {totalOpen} open roles right now.
        </p>
      </section>

      <div className="toolbar">
        <div className="search">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, roles, or skills — try “mechanical engineer”"
            aria-label="Search projects"
          />
        </div>
        <label className="switch-label">
          <button
            type="button"
            role="switch"
            aria-checked={forMe}
            className={`switch${forMe ? ' on' : ''}`}
            onClick={() => setForMe((v) => !v)}
          />
          Matches my skills
        </label>
      </div>

      <div className="filter-row">
        <button
          className={`tag${category === null ? ' selected' : ''}`}
          onClick={() => setCategory(null)}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`tag${category === c ? ' selected' : ''}`}
            onClick={() => setCategory((cur) => (cur === c ? null : c))}
          >
            {c}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon="🔍" title="No projects match">
          <p>Try a different search, or clear the filters above.</p>
        </EmptyState>
      ) : (
        <div className="grid">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
