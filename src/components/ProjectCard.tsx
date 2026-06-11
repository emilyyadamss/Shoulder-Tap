import { Link } from 'react-router-dom'
import type { Project } from '../types'
import { timeAgo, useStore } from '../store'
import { Avatar, cover } from './ui'

export function openSlots(project: Project): number {
  return project.roles.reduce((n, r) => n + Math.max(0, r.slots - r.filledBy.length), 0)
}

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const { data, currentUser } = useStore()
  const owner = data.users.find((u) => u.id === project.ownerId)
  const open = openSlots(project)
  const mySkills = new Set(currentUser.skills)

  return (
    <Link to={`/projects/${project.id}`}>
      <article className="card project-card" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
        <div className="card-cover" style={cover(project.hue)}>
          <span className="card-category">{project.category}</span>
        </div>
        <div className="card-body">
          <h3 className="card-title">{project.title}</h3>
          <p className="card-tagline">{project.tagline}</p>
          <div className="card-roles">
            {project.roles.map((r) => {
              const full = r.filledBy.length >= r.slots
              const match = !full && r.skills.some((s) => mySkills.has(s))
              return (
                <span key={r.id} className={`tag ${match ? 'tag-match' : full ? '' : 'tag-accent'}`}>
                  {full ? '✓ ' : ''}
                  {r.title}
                </span>
              )
            })}
          </div>
          <div className="card-foot">
            {owner && <Avatar user={owner} size={26} />}
            <span>{owner?.name}</span>
            <span className="divider-dot" />
            <span>{timeAgo(project.createdAt)}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: open > 0 ? 'var(--accent-deep)' : 'var(--green)' }}>
              {open > 0 ? `${open} open role${open === 1 ? '' : 's'}` : 'Team full'}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
