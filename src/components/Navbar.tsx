import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar } from './ui'

export function Navbar() {
  const { data, currentUser, signOut, notify } = useStore()
  const pendingForMe = data.applications.filter(
    (a) =>
      a.status === 'pending' &&
      data.projects.some((p) => p.id === a.projectId && p.ownerId === currentUser.id),
  ).length

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Shoulder Tap
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Discover
          </NavLink>
          <NavLink to="/people" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            People
          </NavLink>
          <NavLink to="/tools" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Tools
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
            {pendingForMe > 0 && (
              <span className="notif-badge" style={{ marginLeft: 7 }}>
                {pendingForMe}
              </span>
            )}
          </NavLink>
        </nav>
        <div className="nav-right">
          <Link to="/new" className="btn btn-primary btn-sm">
            + Post a project
          </Link>
          <Link to={`/people/${currentUser.id}`} aria-label="My profile">
            <Avatar user={currentUser} size={36} />
          </Link>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              signOut()
              notify('Signed out', 'info')
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
