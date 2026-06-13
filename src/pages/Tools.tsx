import { useMemo, useState } from 'react'
import { useStore, timeAgo } from '../store'
import { EmptyState, Modal, PersonLink, SearchIcon } from '../components/ui'
import { TOOL_CATEGORIES } from '../data/seed'
import { formatDistance, milesBetween } from '../geo'
import type { ToolListing } from '../types'

function RateBadge({ ratePerDay }: { ratePerDay: number }) {
  if (ratePerDay === 0) return <span className="tag tag-match rate-badge">Free to borrow</span>
  return <span className="tag tag-accent rate-badge">${ratePerDay}/day</span>
}

function ShareToolModal({ onClose }: { onClose: () => void }) {
  const { addTool, notify } = useStore()
  const [name, setName] = useState('')
  const [category, setCategory] = useState(TOOL_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [charges, setCharges] = useState(false)
  const [rate, setRate] = useState('')

  const parsedRate = charges ? Math.max(0, Math.round(Number(rate) || 0)) : 0
  const canSubmit = name.trim().length > 0 && description.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    addTool({
      name: name.trim(),
      category,
      description: description.trim(),
      ratePerDay: parsedRate,
    })
    notify('Tool listed — neighbors can now reach out')
    onClose()
  }

  return (
    <Modal
      title="Share a tool"
      subtitle="List equipment you're willing to lend, rent out, or operate for other builders."
      onClose={onClose}
    >
      <div className="field">
        <label htmlFor="tool-name">What is it?</label>
        <input
          id="tool-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Prusa MK4 3D Printer"
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="tool-cat">Category</label>
        <select id="tool-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
          {TOOL_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="tool-desc">Details</label>
        <p className="hint">Condition, what it's good for, and how borrowing works (you operate it? they pick it up?).</p>
        <textarea
          id="tool-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Well-tuned, includes filament. I can run prints or teach you to slice."
        />
      </div>
      <div className="field">
        <label>Rate</label>
        <div className="segmented">
          <button
            type="button"
            className={`segmented-option${!charges ? ' selected' : ''}`}
            onClick={() => setCharges(false)}
          >
            Free to borrow
          </button>
          <button
            type="button"
            className={`segmented-option${charges ? ' selected' : ''}`}
            onClick={() => setCharges(true)}
          >
            Charge a rate
          </button>
        </div>
      </div>
      {charges && (
        <div className="field">
          <label htmlFor="tool-rate">Rate per day (USD)</label>
          <input
            id="tool-rate"
            type="number"
            min={1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 15"
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
          List tool
        </button>
      </div>
    </Modal>
  )
}

function ToolCard({ tool, index }: { tool: ToolListing; index: number }) {
  const { data, currentUser, removeTool, notify } = useStore()
  const owner = data.users.find((u) => u.id === tool.ownerId)
  if (!owner) return null
  const isMine = owner.id === currentUser.id
  const distance = isMine ? null : milesBetween(currentUser.location, owner.location)

  return (
    <article className="card tool-card" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 17 }}>{tool.name}</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            {tool.category} · listed {timeAgo(tool.createdAt)}
          </p>
        </div>
        <RateBadge ratePerDay={tool.ratePerDay} />
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{tool.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <PersonLink user={owner} />
        {isMine ? (
          <button
            className="link-btn"
            onClick={() => {
              removeTool(tool.id)
              notify('Listing removed', 'info')
            }}
          >
            Remove listing
          </button>
        ) : (
          <span className="muted" style={{ fontSize: 12.5 }} title={`Based in ${owner.location}`}>
            {distance !== null ? formatDistance(distance) : owner.location}
          </span>
        )}
      </div>
    </article>
  )
}

export function Tools() {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [freeOnly, setFreeOnly] = useState(false)
  const [sharing, setSharing] = useState(false)

  const categories = useMemo(() => {
    const present = new Set(data.tools.map((t) => t.category))
    return TOOL_CATEGORIES.filter((c) => present.has(c))
  }, [data.tools])

  const tools = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.tools.filter((t) => {
      if (category && t.category !== category) return false
      if (freeOnly && t.ratePerDay > 0) return false
      if (!q) return true
      const owner = data.users.find((u) => u.id === t.ownerId)
      return [t.name, t.category, t.description, owner?.name ?? '', owner?.location ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data.tools, data.users, query, category, freeOnly])

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Tool Library</h1>
          <p>Borrow a 3D printer, a welder, or a whole woodshop from people nearby.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setSharing(true)}>
          + Share a tool
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools by name, category, or owner"
            aria-label="Search tools"
          />
        </div>
      </div>

      <div className="filter-row">
        <button className={`tag${category === null ? ' selected' : ''}`} onClick={() => setCategory(null)}>
          All categories
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
        <button className={`tag${freeOnly ? ' selected' : ''}`} onClick={() => setFreeOnly((f) => !f)}>
          Free only
        </button>
      </div>

      {tools.length === 0 ? (
        <EmptyState title="No tools match">
          <p>Try a different search — or be the first to share one.</p>
        </EmptyState>
      ) : (
        <div className="grid">
          {tools.map((t, i) => (
            <ToolCard key={t.id} tool={t} index={i} />
          ))}
        </div>
      )}

      {sharing && <ShareToolModal onClose={() => setSharing(false)} />}
    </div>
  )
}
