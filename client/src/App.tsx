
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Design from './pages/Design'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import WorkoutReview from './pages/WorkoutReview'
import Login from './pages/auth/Login'
import Logout from './pages/auth/Logout'
import ResetPassword from './pages/auth/ResetPassword'

function App() {
  

  return (
    <main>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" Component={Home} />
            <Route path="/login" Component={Login} />
            <Route path="/logout" Component={Logout} />
            <Route path="/reset-password" Component={ResetPassword} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout-review"
              element={
                <ProtectedRoute>
                  <WorkoutReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/design" Component={Design} />
          </Routes>
        </Router>
      </AuthProvider>
    </main>
  )
}

export default App
