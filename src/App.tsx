import { Navigate, Route, Routes } from 'react-router-dom'
import { auth, useDb } from './services'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Landings from './pages/Landings'
import Builder from './pages/Builder'
import FormBuilder from './pages/FormBuilder'
import Automations from './pages/Automations'
import Templates from './pages/Templates'
import Submissions from './pages/Submissions'
import Users from './pages/Users'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Audit from './pages/Audit'
import PublicLanding from './pages/PublicLanding'

function RequireAuth({ children }: { children: JSX.Element }) {
  useDb()
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/p/:id" element={<PublicLanding />} />
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/empresas" element={<RequireAuth><Companies /></RequireAuth>} />
      <Route path="/landings" element={<RequireAuth><Landings /></RequireAuth>} />
      <Route path="/templates" element={<RequireAuth><Templates /></RequireAuth>} />
      <Route path="/registros" element={<RequireAuth><Submissions /></RequireAuth>} />
      <Route path="/automatizaciones" element={<RequireAuth><Automations /></RequireAuth>} />
      <Route path="/usuarios" element={<RequireAuth><Users /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
      <Route path="/configuracion" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/audit" element={<RequireAuth><Audit /></RequireAuth>} />
      <Route path="/builder/:id" element={<RequireAuth><Builder /></RequireAuth>} />
      <Route path="/formulario/:id" element={<RequireAuth><FormBuilder /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
