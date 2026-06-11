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
import { Dashboard } from './pages/Dashboard'

function Footer() {
  const { resetData, notify } = useStore()
  return (
    <div className="container">
      <footer className="footer">
        <span>👋 Shoulder Tap — find the missing person for your project.</span>
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Discover />} />
      </Routes>
    </main>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <div className="shell">
          <ScrollToTop />
          <Navbar />
          <Pages />
          <Footer />
          <Toasts />
        </div>
      </HashRouter>
    </StoreProvider>
  )
}
