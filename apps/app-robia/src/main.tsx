import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import RequireAuth from './components/RequireAuth.tsx'
import RequireNoOrganization from './components/RequireNoOrganization.tsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PageAnalyse from './pages/PageAnalyse.tsx'
import PageOpportunites from './pages/PageOpportunites'
import PageExecution from './pages/PageExecution'
import PageRapports from './pages/PageRapports'
import PageIA from './pages/PageIA'
import ProfilePage from './pages/ProfilePage'
import BusinessProfilePage from './pages/BusinessProfilePage'
import CreateOrganizationPage from './pages/OrganisationPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<RequireNoOrganization />}>
            <Route path="/create-organization" element={<CreateOrganizationPage />} />
          </Route>
          <Route path="/" element={<App />}>
            <Route index element={<Navigate to="/analyse" replace />} />
            <Route path="analyse" element={<PageAnalyse />} />
            <Route path="opportunites" element={<PageOpportunites />} />
            <Route path="execution" element={<PageExecution />} />
            <Route path="rapports" element={<PageRapports />} />
            <Route path="ia" element={<PageIA />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="business-profile" element={<BusinessProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)