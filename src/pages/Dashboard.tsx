import { Link } from 'react-router-dom'
import { timeAgo, useStore } from '../store'
import { EmptyState, cover } from '../components/ui'
import { openSlots } from '../components/ProjectCard'

export function Dashboard() {
  const { data, currentUser, withdraw, notify } = useStore()

  const myProjects = data.projects.filter((p) => p.ownerId === currentUser.id)
  const myApplications = data.applications
    .filter((a) => a.userId === currentUser.id)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="container" style={{ maxWidth: 880 }}>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Your projects, your applications, all in one place.</p>
        </div>
        <Link to="/new" className="btn btn-primary">
          + Post a project
        </Link>
      </div>

      <section className="dash-section">
        <h2 className="section-title">Projects you lead</h2>
        {myProjects.length === 0 ? (
          <div className="card">
            <EmptyState icon="🛠️" title="No projects yet">
              <p>
                Have something brewing?{' '}
                <Link to="/new" style={{ textDecoration: 'underline' }}>
                  Post it
                </Link>{' '}
                and find your crew.
              </p>
            </EmptyState>
          </div>
        ) : (
          <div className="row-stack">
            {myProjects.map((p) => {
              const pending = data.applications.filter(
                (a) => a.projectId === p.id && a.status === 'pending',
              ).length
              const open = openSlots(p)
              return (
                <Link key={p.id} to={`/projects/${p.id}`}>
                  <div className="card row-card">
                    <span
                      style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, ...cover(p.hue) }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {open > 0 ? `${open} open role${open === 1 ? '' : 's'}` : 'Team full'} ·
                        posted {timeAgo(p.createdAt)}
                      </div>
                    </div>
                    {pending > 0 && (
                      <span className="notif-badge" title={`${pending} pending applications`}>
                        {pending} new
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2 className="section-title">Your applications</h2>
        {myApplications.length === 0 ? (
          <div className="card">
            <EmptyState icon="🧭" title="You haven't applied anywhere yet">
              <p>
                <Link to="/" style={{ textDecoration: 'underline' }}>
                  Browse projects
                </Link>{' '}
                that need your skills — try the “Matches my skills” filter.
              </p>
            </EmptyState>
          </div>
        ) : (
          <div className="row-stack">
            {myApplications.map((a) => {
              const project = data.projects.find((p) => p.id === a.projectId)
              const role = project?.roles.find((r) => r.id === a.roleId)
              if (!project || !role) return null
              return (
                <div key={a.id} className="card row-card">
                  <span
                    style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, ...cover(project.hue) }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/projects/${project.id}`} style={{ fontWeight: 700, fontSize: 15 }}>
                      {project.title}
                    </Link>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {role.title} · applied {timeAgo(a.createdAt)}
                    </div>
                  </div>
                  <span className={`status status-${a.status}`}>{a.status}</span>
                  {a.status === 'pending' && (
                    <button
                      className="link-btn"
                      onClick={() => {
                        withdraw(a.id)
                        notify('Application withdrawn', 'info')
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
