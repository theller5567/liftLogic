
import './App.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import LoadingSpinner from './components/LoadingSpinner'

const Calendar = lazy(() => import('./pages/Calendar'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Design = lazy(() => import('./pages/Design'))
const FocusReview = lazy(() => import('./pages/FocusReview'))
const Home = lazy(() => import('./pages/Home'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Plan = lazy(() => import('./pages/Plan'))
const Settings = lazy(() => import('./pages/Settings'))
const Trends = lazy(() => import('./pages/Trends'))
const Workout = lazy(() => import('./pages/Workout'))
const WorkoutExercise = lazy(() => import('./pages/WorkoutExercise'))
const WorkoutSummary = lazy(() => import('./pages/WorkoutSummary'))
const WorkoutReview = lazy(() => import('./pages/WorkoutReview'))
const WorkoutSessionLayout = lazy(() => import('./pages/WorkoutSessionLayout'))
const Login = lazy(() => import('./pages/auth/Login'))
const Logout = lazy(() => import('./pages/auth/Logout'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

function App() {
  return (
    <main>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner fullScreen label="Loading page..." />}>
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
              <Route path="/logout" element={<Logout />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
                path="/plan"
                element={
                  <ProtectedRoute>
                    <Plan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/focus-review"
                element={
                  <ProtectedRoute>
                    <FocusReview />
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
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workout/:sessionId"
                element={
                  <ProtectedRoute>
                    <WorkoutSessionLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="summary" element={<WorkoutSummary />} />
                <Route index element={<Workout />} />
                <Route path="exercise/:exerciseIndex" element={<WorkoutExercise />} />
              </Route>
              <Route path="/design" element={<Design />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </main>
  )
}

export default App
