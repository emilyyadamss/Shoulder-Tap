import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Application, ApplicationStatus, Project, ToolListing, User } from './types'
import { makeSeedData } from './data/seed'

const STORAGE_KEY = 'opened-role-data-v1'
const AUTH_KEY = 'opened-role-auth-v1'

/**
 * Demo password shared by every seeded account. There is no backend, so this
 * stands in for a real credential check — see the hint on the login page.
 */
export const DEMO_PASSWORD = 'openedrole'

export type SignInResult =
  | { ok: true; user: User }
  | { ok: false; error: string }

export interface Toast {
  id: string
  kind: 'success' | 'info'
  message: string
}

interface Store {
  data: AppData
  currentUser: User
  authedUserId: string | null
  toasts: Toast[]
  signIn: (email: string, password: string) => SignInResult
  completeSignIn: (userId: string) => void
  signOut: () => void
  dismissToast: (id: string) => void
  notify: (message: string, kind?: Toast['kind']) => void
  addProject: (p: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'hue'>) => Project
  addTool: (t: Omit<ToolListing, 'id' | 'ownerId' | 'createdAt'>) => void
  removeTool: (toolId: string) => void
  apply: (projectId: string, roleId: string, message: string) => void
  withdraw: (applicationId: string) => void
  decideApplication: (applicationId: string, status: ApplicationStatus) => void
  updateProfile: (
    patch: Partial<
      Pick<User, 'name' | 'headline' | 'location' | 'bio' | 'skills' | 'interests' | 'school' | 'resume'>
    >,
  ) => void
  resetData: () => void
}

const StoreContext = createContext<Store | null>(null)

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrate(JSON.parse(raw) as AppData)
  } catch {
    // fall through to seed
  }
  return makeSeedData()
}

/**
 * Backfill fields added after a user's data was first seeded into localStorage.
 * Without this, accounts stored before the `email` field existed have no email,
 * and sign-in would throw on `u.email.toLowerCase()`.
 */
function migrate(data: AppData): AppData {
  const seed = makeSeedData()
  const seedEmailById = new Map(seed.users.map((u) => [u.id, u.email]))
  let changed = false
  let users = data.users.map((u) => {
    if (u.email) return u
    changed = true
    const fallback = `${u.name.split(' ')[0].toLowerCase()}@openedrole.dev`
    return { ...u, email: seedEmailById.get(u.id) ?? fallback }
  })
  let projects = data.projects.map((p) => {
    if (p.roles.every((r) => r.workMode)) return p
    changed = true
    return {
      ...p,
      roles: p.roles.map((r) => (r.workMode ? r : { ...r, workMode: 'remote' as const })),
    }
  })
  // Seed entities introduced after this data was first stored.
  const userIds = new Set(users.map((u) => u.id))
  const newUsers = seed.users.filter((u) => !userIds.has(u.id))
  const projectIds = new Set(projects.map((p) => p.id))
  const newProjects = seed.projects.filter((p) => !projectIds.has(p.id))
  if (newUsers.length > 0) {
    users = [...users, ...newUsers]
    changed = true
  }
  if (newProjects.length > 0) {
    projects = [...projects, ...newProjects]
    changed = true
  }
  // Tool sharing shipped after launch; older stored data has no `tools` array.
  let tools = data.tools
  if (!tools) {
    tools = seed.tools
    changed = true
  }
  return changed ? { ...data, users, projects, tools } : data
}

function loadAuth(): string | null {
  try {
    return localStorage.getItem(AUTH_KEY)
  } catch {
    return null
  }
}

let idCounter = 0
export function uid(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)
  const [authedUserId, setAuthedUserId] = useState<string | null>(loadAuth)
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<number[]>([])

  const authedUserIdRef = useRef(authedUserId)
  authedUserIdRef.current = authedUserId

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (authedUserId) localStorage.setItem(AUTH_KEY, authedUserId)
    else localStorage.removeItem(AUTH_KEY)
  }, [authedUserId])

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, kind: Toast['kind'] = 'success') => {
      const id = uid('toast')
      setToasts((ts) => [...ts, { id, kind, message }])
      timersRef.current.push(window.setTimeout(() => dismissToast(id), 4200))
    },
    [dismissToast],
  )

  const currentUserIdRef = useRef(data.currentUserId)
  currentUserIdRef.current = data.currentUserId

  const addProject = useCallback(
    (p: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'hue'>) => {
      const project: Project = {
        ...p,
        id: uid('p'),
        ownerId: currentUserIdRef.current,
        createdAt: Date.now(),
        hue: Math.floor(Math.random() * 360),
      }
      setData((d) => ({ ...d, projects: [project, ...d.projects] }))
      return project
    },
    [],
  )

  const addTool = useCallback((t: Omit<ToolListing, 'id' | 'ownerId' | 'createdAt'>) => {
    setData((d) => {
      const tool: ToolListing = {
        ...t,
        id: uid('t'),
        ownerId: d.currentUserId,
        createdAt: Date.now(),
      }
      return { ...d, tools: [tool, ...d.tools] }
    })
  }, [])

  const removeTool = useCallback((toolId: string) => {
    setData((d) => ({ ...d, tools: d.tools.filter((t) => t.id !== toolId) }))
  }, [])

  const apply = useCallback((projectId: string, roleId: string, message: string) => {
    setData((d) => {
      const application: Application = {
        id: uid('a'),
        projectId,
        roleId,
        userId: d.currentUserId,
        message,
        status: 'pending',
        createdAt: Date.now(),
      }
      return { ...d, applications: [application, ...d.applications] }
    })
  }, [])

  const withdraw = useCallback((applicationId: string) => {
    setData((d) => ({
      ...d,
      applications: d.applications.filter((a) => a.id !== applicationId),
    }))
  }, [])

  const decideApplication = useCallback((applicationId: string, status: ApplicationStatus) => {
    setData((d) => {
      const app = d.applications.find((a) => a.id === applicationId)
      if (!app) return d
      const applications = d.applications.map((a) =>
        a.id === applicationId ? { ...a, status } : a,
      )
      let projects = d.projects
      if (status === 'accepted') {
        projects = d.projects.map((p) =>
          p.id === app.projectId
            ? {
                ...p,
                roles: p.roles.map((r) =>
                  r.id === app.roleId && !r.filledBy.includes(app.userId)
                    ? { ...r, filledBy: [...r.filledBy, app.userId] }
                    : r,
                ),
              }
            : p,
        )
      }
      return { ...d, applications, projects }
    })
  }, [])

  const updateProfile = useCallback(
    (
      patch: Partial<
        Pick<User, 'name' | 'headline' | 'location' | 'bio' | 'skills' | 'interests' | 'school' | 'resume'>
      >,
    ) => {
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === d.currentUserId ? { ...u, ...patch } : u)),
      }))
    },
    [],
  )

  const signIn = useCallback(
    (email: string, password: string): SignInResult => {
      const normalized = email.trim().toLowerCase()
      const user = data.users.find((u) => u.email?.toLowerCase() === normalized)
      if (!user || password !== DEMO_PASSWORD) {
        return { ok: false, error: 'That email and password don’t match an account.' }
      }
      return { ok: true, user }
    },
    [data.users],
  )

  const completeSignIn = useCallback((userId: string) => {
    setAuthedUserId(userId)
    setData((d) => ({ ...d, currentUserId: userId }))
  }, [])

  const signOut = useCallback(() => {
    setAuthedUserId(null)
  }, [])

  const resetData = useCallback(() => {
    setData(() => {
      const seed = makeSeedData()
      const authed = authedUserIdRef.current
      return authed ? { ...seed, currentUserId: authed } : seed
    })
  }, [])

  const currentUser = useMemo(
    () => data.users.find((u) => u.id === data.currentUserId)!,
    [data.users, data.currentUserId],
  )

  const store: Store = useMemo(
    () => ({
      data,
      currentUser,
      authedUserId,
      toasts,
      signIn,
      completeSignIn,
      signOut,
      dismissToast,
      notify,
      addProject,
      addTool,
      removeTool,
      apply,
      withdraw,
      decideApplication,
      updateProfile,
      resetData,
    }),
    [
      data,
      currentUser,
      authedUserId,
      toasts,
      signIn,
      completeSignIn,
      signOut,
      dismissToast,
      notify,
      addProject,
      addTool,
      removeTool,
      apply,
      withdraw,
      decideApplication,
      updateProfile,
      resetData,
    ],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function timeAgo(ts: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
