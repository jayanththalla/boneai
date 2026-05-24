/**
 * App — Root component with React Router.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PageShell from './components/layout/PageShell'
import Landing from './pages/Landing'
import Triage from './pages/Triage'
import Result from './pages/Result'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <PageShell>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/result" element={<Result />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </PageShell>
    </BrowserRouter>
  )
}
