import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SubmitPage from './pages/SubmitPage'
import AdminFeedbackList from './pages/AdminFeedbackList'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

import PrivateRoute from './components/PrivateRoute'
import { AuthProvider } from './context/AuthContext'
import UserManagement from './components/UserManagement'
import UserDashboard from './pages/UserDashboard'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/signup" element={<SignupPage />} />   <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminFeedbackList />
            </PrivateRoute>

          } />
          <Route path="/admin/users" element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          } />
          <Route path="/user/dashboard" element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
