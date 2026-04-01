import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import MotionPage from './components/MotionPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import BloodBankDashboard from './pages/BloodBankDashboard'
import DonorDashboard from './pages/DonorDashboard'
import RoleRedirect from './pages/RoleRedirect'
import BloodBankDetail from './pages/BloodBankDetail'
import BloodBanks from './pages/BloodBanks'
import Donors from './pages/Donors'
import Donations from './pages/Donations'
import Inventory from './pages/Inventory'
import Requests from './pages/Requests'
import Profile from './pages/Profile'
import Logout from './pages/Logout'
import Appointments from './pages/Appointments'
import BloodBankEdit from './pages/BloodBankEdit'
import Camps from './pages/Camps'
import CampRegistrations from './pages/CampRegistrations'
import './styles/theme.css'

export default function App() {
  const location = useLocation()
  return (
    <ThemeProvider>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/home" element={<MotionPage><Home /></MotionPage>} />
          <Route path="/login" element={<MotionPage><Login /></MotionPage>} />
          <Route path="/signup" element={<MotionPage><Signup /></MotionPage>} />
          <Route path="/logout" element={<MotionPage><Logout /></MotionPage>} />

          <Route path="/" element={<MotionPage><Home /></MotionPage>} />
          <Route path="/dashboard"
            element={
              <ProtectedRoute>
                <MotionPage><RoleRedirect /></MotionPage>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/bloodbank" element={
            <ProtectedRoute>
              <AppLayout>
                <MotionPage><BloodBankDashboard /></MotionPage>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/donor" element={
            <ProtectedRoute>
              <AppLayout>
                <MotionPage><DonorDashboard /></MotionPage>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/bloodbanks/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <MotionPage><BloodBankDetail /></MotionPage>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route
            path="/bloodbanks"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><BloodBanks /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/donors"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Donors /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/donations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Donations /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Inventory /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Requests /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Appointments /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/camps"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Camps /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/camp-registrations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><CampRegistrations /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><Profile /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bloodbank/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MotionPage><BloodBankEdit /></MotionPage>
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </ThemeProvider>
  )
}


