export interface User {
  id: string
  name: string
  headline: string
  location: string
  bio: string
  skills: string[]
  hue: number
}

export interface Role {
  id: string
  title: string
  description: string
  skills: string[]
  slots: number
  filledBy: string[]
}

export interface Project {
  id: string
  ownerId: string
  title: string
  tagline: string
  description: string
  category: string
  tags: string[]
  roles: Role[]
  createdAt: number
  hue: number
}

export type ApplicationStatus = 'pending' | 'accepted' | 'declined'

export interface Application {
  id: string
  projectId: string
  roleId: string
  userId: string
  message: string
  status: ApplicationStatus
  createdAt: number
}

export interface AppData {
  currentUserId: string
  users: User[]
  projects: Project[]
  applications: Application[]
}
