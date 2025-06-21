import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SubmitPage from './pages/SubmitPage'
import AdminFeedbackList from './pages/AdminFeedbackList'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/admin" element={<AdminFeedbackList />} />
      </Routes>
    </Router>
  )
}

export default App