import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { ProjectCard, openSlots } from '../components/ProjectCard'
import { EmptyState, SearchIcon, WORK_MODES } from '../components/ui'
import { coordsFor, milesBetween } from '../geo'
import type { WorkMode } from '../types'

const RADIUS_OPTIONS = [25, 50, 100, 250]

export function Discover() {
  const { data, currentUser } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [workMode, setWorkMode] = useState<WorkMode | null>(null)
  const [forMe, setForMe] = useState(false)
  const [nearMe, setNearMe] = useState(false)
  const [radius, setRadius] = useState(100)

  const myCoords = coordsFor(currentUser.location)

  const categories = useMemo(
    () => [...new Set(data.projects.map((p) => p.category))].sort(),
    [data.projects],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const mySkills = new Set(currentUser.skills)
    const entries = data.projects
      .map((p) => {
        const owner = data.users.find((u) => u.id === p.ownerId)
        const distance =
          owner && owner.id !== currentUser.id
            ? milesBetween(currentUser.location, owner.location)
            : null
        return { project: p, distance }
      })
      .filter(({ project: p, distance }) => {
        if (category && p.category !== category) return false
        if (workMode) {
          const hasOpenMode = p.roles.some(
            (r) => r.filledBy.length < r.slots && r.workMode === workMode,
          )
          if (!hasOpenMode) return false
        }
        if (nearMe) {
          const hasLocalRole = p.roles.some(
            (r) => r.filledBy.length < r.slots && r.workMode !== 'remote',
          )
          if (!hasLocalRole) return false
          if (distance === null || distance > radius) return false
        }
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
    return entries.sort((a, b) =>
      nearMe
        ? (a.distance ?? Infinity) - (b.distance ?? Infinity)
        : b.project.createdAt - a.project.createdAt,
    )
  }, [data.projects, data.users, query, category, workMode, nearMe, radius, forMe, currentUser])

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
        <label className="switch-label">
          <button
            type="button"
            role="switch"
            aria-checked={nearMe}
            className={`switch${nearMe ? ' on' : ''}`}
            onClick={() => setNearMe((v) => !v)}
          />
          Near me
        </label>
        {nearMe && (
          <select
            className="input radius-select"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            aria-label="Search radius"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                within {r} mi
              </option>
            ))}
          </select>
        )}
      </div>

      {nearMe && !myCoords && (
        <p className="geo-hint">
          We couldn’t place “{currentUser.location}” on the map. Set your profile location to a
          nearby major city (e.g. “Boston, MA”) to find in-person projects around you.
        </p>
      )}
      {nearMe && myCoords && (
        <p className="geo-hint">
          Showing projects with open in-person or hybrid roles within {radius} miles of{' '}
          {currentUser.location}, nearest first.
        </p>
      )}

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

      <div className="filter-row">
        <button
          className={`tag${workMode === null ? ' selected' : ''}`}
          onClick={() => setWorkMode(null)}
        >
          Any location
        </button>
        {WORK_MODES.map((m) => (
          <button
            key={m.value}
            className={`tag${workMode === m.value ? ' selected' : ''}`}
            onClick={() => setWorkMode((cur) => (cur === m.value ? null : m.value))}
          >
            {m.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState title={nearMe ? 'Nothing in-person nearby' : 'No projects match'}>
          <p>
            {nearMe
              ? 'Try widening the radius, or switch off “Near me” to browse remote-friendly roles.'
              : 'Try a different search, or clear the filters above.'}
          </p>
        </EmptyState>
      ) : (
        <div className="grid">
          {results.map(({ project: p, distance }, i) => (
            <ProjectCard key={p.id} project={p} index={i} distance={nearMe ? distance : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}
