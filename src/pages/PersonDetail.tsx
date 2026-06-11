import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { SKILL_SUGGESTIONS } from '../data/seed'
import { Avatar, EmptyState, Modal } from '../components/ui'
import { ProjectCard } from '../components/ProjectCard'

export function PersonDetail() {
  const { id } = useParams()
  const { data, currentUser, updateProfile, notify } = useStore()
  const [editing, setEditing] = useState(false)

  const user = data.users.find((u) => u.id === id)
  if (!user) {
    return (
      <div className="container">
        <EmptyState icon="🫥" title="Person not found">
          <p>
            <Link to="/people" style={{ textDecoration: 'underline' }}>Back to People</Link>
          </p>
        </EmptyState>
      </div>
    )
  }

  const isMe = user.id === currentUser.id
  const ownedProjects = data.projects.filter((p) => p.ownerId === user.id)
  const contributions = data.projects.filter(
    (p) => p.ownerId !== user.id && p.roles.some((r) => r.filledBy.includes(user.id)),
  )

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="card" style={{ padding: '32px 34px', display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Avatar user={user} size={84} />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 30 }}>{user.name}</h1>
              <p style={{ color: 'var(--ink-soft)', marginTop: 4, fontWeight: 500 }}>
                {user.headline} · {user.location}
              </p>
            </div>
            {isMe && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                Edit profile
              </button>
            )}
          </div>
          <p style={{ marginTop: 14, color: 'var(--ink-soft)', maxWidth: 620 }}>{user.bio}</p>
          <div className="card-roles" style={{ marginTop: 16 }}>
            {user.skills.map((s) => (
              <span key={s} className="tag tag-accent">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {ownedProjects.length > 0 && (
        <section className="dash-section" style={{ marginTop: 38 }}>
          <h2 className="section-title">
            {isMe ? 'Your projects' : `Projects by ${user.name.split(' ')[0]}`}
          </h2>
          <div className="grid">
            {ownedProjects.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {contributions.length > 0 && (
        <section className="dash-section" style={{ marginTop: 38 }}>
          <h2 className="section-title">Contributing to</h2>
          <div className="grid">
            {contributions.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {ownedProjects.length === 0 && contributions.length === 0 && (
        <EmptyState icon="🌱" title="Nothing here yet">
          <p>{isMe ? 'Post a project or apply to one to get started.' : 'No projects yet.'}</p>
        </EmptyState>
      )}

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
    </div>
  )

  function EditProfileModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState(currentUser.name)
    const [headline, setHeadline] = useState(currentUser.headline)
    const [location, setLocation] = useState(currentUser.location)
    const [bio, setBio] = useState(currentUser.bio)
    const [skills, setSkills] = useState<string[]>(currentUser.skills)

    return (
      <Modal title="Edit profile" subtitle="Your skills drive role matching across the site." onClose={onClose}>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label>Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="field">
          <label>Skills</label>
          <div className="skill-picker">
            {[...new Set([...SKILL_SUGGESTIONS, ...skills])].map((s) => (
              <button
                key={s}
                type="button"
                className={`tag${skills.includes(s) ? ' selected' : ''}`}
                onClick={() =>
                  setSkills((cur) =>
                    cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
                  )
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => {
              updateProfile({
                name: name.trim(),
                headline: headline.trim(),
                location: location.trim(),
                bio: bio.trim(),
                skills,
              })
              notify('Profile updated ✨')
              onClose()
            }}
          >
            Save changes
          </button>
        </div>
      </Modal>
    )
  }
}
