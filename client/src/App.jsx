import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SubmitPage from './pages/SubmitPage'
import AdminFeedbackList from './pages/AdminFeedbackList'
import LoginPage from './pages/LoginPage'
import PrivateRoute from './components/PrivateRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminFeedbackList />
            </PrivateRoute>

          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
