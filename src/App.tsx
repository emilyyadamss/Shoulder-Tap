import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './store'
import { Navbar } from './components/Navbar'
import { Toasts } from './components/ui'
import { Discover } from './pages/Discover'
import { ProjectDetail } from './pages/ProjectDetail'
import { NewProject } from './pages/NewProject'
import { People } from './pages/People'
import { PersonDetail } from './pages/PersonDetail'
import { Tools } from './pages/Tools'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'

function Footer() {
  const { resetData, notify } = useStore()
  return (
    <div className="container">
      <footer className="footer">
        <span>Shoulder Tap Project. Find the missing person for your projects success.</span>
        <button
          className="link-btn"
          onClick={() => {
            resetData()
            notify('Demo data reset', 'info')
          }}
        >
          Reset demo data
        </button>
      </footer>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function Pages() {
  const location = useLocation()
  return (
    <main className="page" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Discover />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/people" element={<People />} />
        <Route path="/people/:id" element={<PersonDetail />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Discover />} />
      </Routes>
    </main>
  )
}

function Authenticated() {
  const { authedUserId } = useStore()
  if (!authedUserId) {
    return (
      <>
        <Login />
        <Toasts />
      </>
    )
  }
  return (
    <HashRouter>
      <div className="shell">
        <ScrollToTop />
        <Navbar />
        <Pages />
        <Footer />
        <Toasts />
      </div>
    </HashRouter>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Authenticated />
    </StoreProvider>
  )
}
