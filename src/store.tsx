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
import type { AppData, Application, ApplicationStatus, Project, User } from './types'
import { makeSeedData } from './data/seed'

const STORAGE_KEY = 'shoulder-tap-data-v1'

export interface Toast {
  id: string
  kind: 'success' | 'info'
  message: string
}

interface Store {
  data: AppData
  currentUser: User
  toasts: Toast[]
  dismissToast: (id: string) => void
  notify: (message: string, kind?: Toast['kind']) => void
  addProject: (p: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'hue'>) => Project
  apply: (projectId: string, roleId: string, message: string) => void
  withdraw: (applicationId: string) => void
  decideApplication: (applicationId: string, status: ApplicationStatus) => void
  updateProfile: (patch: Partial<Pick<User, 'name' | 'headline' | 'location' | 'bio' | 'skills'>>) => void
  resetData: () => void
}

const StoreContext = createContext<Store | null>(null)

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    // fall through to seed
  }
  return makeSeedData()
}

let idCounter = 0
export function uid(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

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
    (patch: Partial<Pick<User, 'name' | 'headline' | 'location' | 'bio' | 'skills'>>) => {
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === d.currentUserId ? { ...u, ...patch } : u)),
      }))
    },
    [],
  )

  const resetData = useCallback(() => {
    setData(makeSeedData())
  }, [])

  const currentUser = useMemo(
    () => data.users.find((u) => u.id === data.currentUserId)!,
    [data.users, data.currentUserId],
  )

  const store: Store = useMemo(
    () => ({
      data,
      currentUser,
      toasts,
      dismissToast,
      notify,
      addProject,
      apply,
      withdraw,
      decideApplication,
      updateProfile,
      resetData,
    }),
    [
      data,
      currentUser,
      toasts,
      dismissToast,
      notify,
      addProject,
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
