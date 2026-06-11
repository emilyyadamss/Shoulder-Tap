import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { timeAgo, useStore } from '../store'
import type { Role } from '../types'
import { Avatar, EmptyState, Modal, PersonLink, cover } from '../components/ui'

export function ProjectDetail() {
  const { id } = useParams()
  const { data, currentUser, apply, withdraw, decideApplication, notify } = useStore()
  const [applyingTo, setApplyingTo] = useState<Role | null>(null)
  const [message, setMessage] = useState('')

  const project = data.projects.find((p) => p.id === id)
  if (!project) {
    return (
      <div className="container">
        <EmptyState icon="🤷" title="Project not found">
          <p>
            It may have been removed. <Link to="/" style={{ textDecoration: 'underline' }}>Back to Discover</Link>
          </p>
        </EmptyState>
      </div>
    )
  }

  const owner = data.users.find((u) => u.id === project.ownerId)!
  const isOwner = project.ownerId === currentUser.id
  const myApps = data.applications.filter(
    (a) => a.projectId === project.id && a.userId === currentUser.id,
  )
  const projectApps = data.applications.filter((a) => a.projectId === project.id)
  const pendingApps = projectApps.filter((a) => a.status === 'pending')
  const mySkills = new Set(currentUser.skills)

  const team = [
    { user: owner, label: 'Project lead' },
    ...project.roles.flatMap((r) =>
      r.filledBy
        .map((uid) => data.users.find((u) => u.id === uid))
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .map((user) => ({ user, label: r.title })),
    ),
  ]

  function submitApplication() {
    if (!applyingTo || !project) return
    apply(project.id, applyingTo.id, message.trim())
    notify(`Application sent for ${applyingTo.title} 🎉`)
    setApplyingTo(null)
    setMessage('')
  }

  return (
    <div className="container">
      <div className="detail-cover" style={cover(project.hue)} />
      <div className="card detail-head">
        <span className="tag tag-accent" style={{ marginBottom: 12 }}>
          {project.category}
        </span>
        <h1>{project.title}</h1>
        <p style={{ marginTop: 10, fontSize: 16.5, color: 'var(--ink-soft)' }}>{project.tagline}</p>
        <div className="detail-meta">
          <PersonLink user={owner} />
          <span className="divider-dot" />
          <span>Posted {timeAgo(project.createdAt)}</span>
          <span className="divider-dot" />
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <section className="card" style={{ padding: '26px 30px' }}>
            <h2 className="section-title">About this project</h2>
            <p className="prose">{project.description}</p>
          </section>

          {isOwner && (
            <section style={{ marginTop: 28 }}>
              <h2 className="section-title">
                Applicants{' '}
                {pendingApps.length > 0 && <span className="notif-badge">{pendingApps.length}</span>}
              </h2>
              {projectApps.length === 0 ? (
                <div className="card">
                  <EmptyState icon="📭" title="No applications yet">
                    <p>Share your project — applicants will show up here.</p>
                  </EmptyState>
                </div>
              ) : (
                <div className="card">
                  {projectApps.map((a) => {
                    const applicant = data.users.find((u) => u.id === a.userId)
                    const role = project.roles.find((r) => r.id === a.roleId)
                    if (!applicant || !role) return null
                    return (
                      <div key={a.id} className="applicant-row">
                        <Avatar user={applicant} size={42} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            <Link to={`/people/${applicant.id}`} style={{ fontWeight: 700 }}>
                              {applicant.name}
                            </Link>
                            <span className="muted" style={{ fontSize: 13 }}>
                              for {role.title} · {timeAgo(a.createdAt)}
                            </span>
                            <span className={`status status-${a.status}`} style={{ marginLeft: 'auto' }}>
                              {a.status}
                            </span>
                          </div>
                          {a.message && <p className="applicant-msg">“{a.message}”</p>}
                          {a.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  decideApplication(a.id, 'accepted')
                                  notify(`${applicant.name} joined as ${role.title} 🙌`)
                                }}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-danger-ghost btn-sm"
                                onClick={() => {
                                  decideApplication(a.id, 'declined')
                                  notify('Application declined', 'info')
                                }}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        <aside>
          <h2 className="section-title">Open roles</h2>
          <div className="row-stack">
            {project.roles.map((role) => {
              const filled = role.filledBy.length
              const full = filled >= role.slots
              const myApp = myApps.find((a) => a.roleId === role.id)
              const matches = role.skills.some((s) => mySkills.has(s))
              return (
                <div key={role.id} className={`card role-card${full ? '' : ' open-role'}`}>
                  <div className="role-card-head">
                    <span className="role-title">{role.title}</span>
                    <span className={`slots${full ? ' full' : ''}`}>
                      {full ? 'Filled ✓' : `${filled}/${role.slots} filled`}
                    </span>
                  </div>
                  <p className="role-desc">{role.description}</p>
                  <div className="card-roles">
                    {role.skills.map((s) => (
                      <span key={s} className={`tag${mySkills.has(s) ? ' tag-match' : ''}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                  {!isOwner &&
                    (myApp ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`status status-${myApp.status}`}>{myApp.status}</span>
                        {myApp.status === 'pending' && (
                          <button
                            className="link-btn"
                            onClick={() => {
                              withdraw(myApp.id)
                              notify('Application withdrawn', 'info')
                            }}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    ) : (
                      !full && (
                        <button
                          className={`btn ${matches ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                          onClick={() => setApplyingTo(role)}
                        >
                          {matches ? '✦ Apply — you match this role' : 'Apply to contribute'}
                        </button>
                      )
                    ))}
                </div>
              )
            })}
          </div>

          <h2 className="section-title" style={{ marginTop: 30 }}>
            Team
          </h2>
          <div className="row-stack">
            {team.map(({ user, label }, i) => (
              <div key={`${user.id}-${i}`} className="card row-card">
                <Avatar user={user} size={38} />
                <div>
                  <Link to={`/people/${user.id}`} style={{ fontWeight: 700, fontSize: 14 }}>
                    {user.name}
                  </Link>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {applyingTo && (
        <Modal
          title={`Apply: ${applyingTo.title}`}
          subtitle={`Tell ${owner.name} why you're a great fit for ${project.title}.`}
          onClose={() => setApplyingTo(null)}
        >
          <div className="field">
            <label htmlFor="apply-msg">Your message</label>
            <textarea
              id="apply-msg"
              rows={5}
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share relevant experience, why this project excites you, and how much time you can give…"
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setApplyingTo(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={message.trim().length < 10}
              onClick={submitApplication}
            >
              Send application
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
