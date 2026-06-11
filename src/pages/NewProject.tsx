import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uid, useStore } from '../store'
import { CATEGORIES, SKILL_SUGGESTIONS } from '../data/seed'

interface RoleDraft {
  key: string
  title: string
  description: string
  skills: string[]
  slots: number
}

function emptyRole(): RoleDraft {
  return { key: uid('rd'), title: '', description: '', skills: [], slots: 1 }
}

export function NewProject() {
  const { addProject, notify } = useStore()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [tags, setTags] = useState('')
  const [roles, setRoles] = useState<RoleDraft[]>([emptyRole()])

  const validRoles = roles.filter((r) => r.title.trim())
  const canSubmit = title.trim() && tagline.trim() && description.trim() && validRoles.length > 0

  function patchRole(key: string, patch: Partial<RoleDraft>) {
    setRoles((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function toggleRoleSkill(key: string, skill: string) {
    setRoles((rs) =>
      rs.map((r) =>
        r.key === key
          ? {
              ...r,
              skills: r.skills.includes(skill)
                ? r.skills.filter((s) => s !== skill)
                : [...r.skills, skill],
            }
          : r,
      ),
    )
  }

  function submit() {
    const project = addProject({
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5),
      roles: validRoles.map((r) => ({
        id: uid('r'),
        title: r.title.trim(),
        description: r.description.trim(),
        skills: r.skills,
        slots: Math.max(1, r.slots),
        filledBy: [],
      })),
    })
    notify('Project posted — good luck! 🚀')
    navigate(`/projects/${project.id}`)
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <h1>Post a project</h1>
          <p>Describe what you're building and who you need beside you.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '28px 30px' }}>
        <div className="field">
          <label htmlFor="np-title">Project title</label>
          <input
            id="np-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. SolarSip — Off-grid water purifier"
          />
        </div>
        <div className="field">
          <label htmlFor="np-tagline">One-line pitch</label>
          <input
            id="np-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="The single sentence that makes someone stop scrolling."
            maxLength={120}
          />
        </div>
        <div className="field">
          <label htmlFor="np-desc">Description</label>
          <p className="hint">
            What exists already? What's the goal? What will contributors actually do?
          </p>
          <textarea
            id="np-desc"
            rows={7}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Be honest about the state of the project — people love joining something real."
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <label htmlFor="np-cat">Category</label>
            <select id="np-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="np-tags">Tags</label>
            <input
              id="np-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated, e.g. Open Source, IoT"
            />
          </div>
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 34 }}>
        Who do you need?
      </h2>
      <div className="row-stack">
        {roles.map((role, i) => (
          <div key={role.key} className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <strong style={{ fontSize: 14 }}>Role {i + 1}</strong>
              {roles.length > 1 && (
                <button
                  className="link-btn"
                  onClick={() => setRoles((rs) => rs.filter((r) => r.key !== role.key))}
                >
                  Remove
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 16 }}>
              <div className="field">
                <label>Role title</label>
                <input
                  value={role.title}
                  onChange={(e) => patchRole(role.key, { title: e.target.value })}
                  placeholder="e.g. Mechanical Engineer"
                  list="role-suggestions"
                />
              </div>
              <div className="field">
                <label>Openings</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={role.slots}
                  onChange={(e) => patchRole(role.key, { slots: Number(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="field">
              <label>What will they own?</label>
              <input
                value={role.description}
                onChange={(e) => patchRole(role.key, { description: e.target.value })}
                placeholder="One or two sentences about the work."
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Skills to match on</label>
              <div className="skill-picker">
                {SKILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`tag${role.skills.includes(s) ? ' selected' : ''}`}
                    onClick={() => toggleRoleSkill(role.key, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <datalist id="role-suggestions">
        <option>Software Engineer</option>
        <option>Mechanical Engineer</option>
        <option>Electrical Engineer</option>
        <option>Embedded Systems Engineer</option>
        <option>Machine Learning Engineer</option>
        <option>Civil Engineer</option>
        <option>Product Designer</option>
        <option>Industrial Designer</option>
        <option>Project Manager</option>
        <option>Marketing Lead</option>
        <option>Technical Writer</option>
      </datalist>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={() => setRoles((rs) => [...rs, emptyRole()])}>
          + Add another role
        </button>
        <button
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
          disabled={!canSubmit}
          onClick={submit}
        >
          Post project
        </button>
      </div>
    </div>
  )
}
