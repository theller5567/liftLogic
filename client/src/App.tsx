
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import Calendar from './pages/Calendar'
import Dashboard from './pages/Dashboard'
import Design from './pages/Design'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'
import Trends from './pages/Trends'
import Workout from './pages/Workout'
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
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <Home />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
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
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trends"
              element={
                <ProtectedRoute>
                  <Trends />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout"
              element={
                <ProtectedRoute>
                  <Workout />
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
