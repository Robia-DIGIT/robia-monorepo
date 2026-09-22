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
import PageCommandCenter from './pages/PageCommandCenter.tsx'
import PageOpportunites from './pages/PageOpportunites'
import PageExecution from './pages/PageExecution'
import PageRapports from './pages/PageRapports'
import PageIA from './pages/PageIA'
import ProfilePage from './pages/ProfilePage'
import BusinessProfilePage from './pages/BusinessProfilePage'
import GoogleDataPage from './pages/GoogleDataPage'
import MetaDataPage from './pages/MetaDataPage'
import PageMotsCles from './pages/PageMotsCles.tsx'
import CreateOrganizationPage from './pages/OrganisationPage.tsx'
import BillingPage from './pages/BillingPage.tsx'
import PageOpsAutomations from './pages/PageOpsAutomations.tsx'
import PageOpsAutomationDetail from './pages/PageOpsAutomationDetail.tsx'
import PageOpsAutomationForm from './pages/PageOpsAutomationForm.tsx'
import PageOpsAutomationRun from './pages/PageOpsAutomationRun.tsx'
import PageOpsNotifications from './pages/PageOpsNotifications.tsx'
import PageOpsNotificationDetail from './pages/PageOpsNotificationDetail.tsx'
import PageOdcPrograms from './pages/PageOdcPrograms.tsx'
import PageOdcProgramKanban from './pages/PageOdcProgramKanban.tsx'
import PageOdcApplication from './pages/PageOdcApplication.tsx'

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
            <Route path="command-center" element={<PageCommandCenter />} />
            <Route path="opportunites" element={<PageOpportunites />} />
            <Route path="execution" element={<PageExecution />} />
            <Route path="rapports" element={<PageRapports />} />
            <Route path="mots-cles" element={<PageMotsCles />} />
            <Route path="ia" element={<PageIA />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="business-profile" element={<BusinessProfilePage />} />
            <Route path="google-data" element={<GoogleDataPage />} />
            <Route path="meta-data" element={<MetaDataPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="ops/automations" element={<PageOpsAutomations />} />
            <Route path="ops/automations/new" element={<PageOpsAutomationForm />} />
            <Route path="ops/automations/runs/:runId" element={<PageOpsAutomationRun />} />
            <Route path="ops/automations/:id" element={<PageOpsAutomationDetail />} />
            <Route path="ops/automations/:id/edit" element={<PageOpsAutomationForm />} />
            <Route path="ops/notifications" element={<PageOpsNotifications />} />
            <Route path="ops/notifications/:id" element={<PageOpsNotificationDetail />} />
            <Route path="odc/programmes" element={<PageOdcPrograms />} />
            <Route path="odc/programmes/:id" element={<PageOdcProgramKanban />} />
            <Route path="odc/candidatures/:id" element={<PageOdcApplication />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
