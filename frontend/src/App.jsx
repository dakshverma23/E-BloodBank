import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
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

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/logout" element={<Logout />} />

      <Route path="/" element={<Home />} />
      <Route path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/bloodbank" element={
        <ProtectedRoute>
          <AppLayout>
            <BloodBankDashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/donor" element={
        <ProtectedRoute>
          <AppLayout>
            <DonorDashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/bloodbanks/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <BloodBankDetail />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route
        path="/bloodbanks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BloodBanks />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/donors"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Donors />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/donations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Donations />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Inventory />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Requests />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Appointments />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/camps"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Camps />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/camp-registrations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CampRegistrations />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bloodbank/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BloodBankEdit />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}


