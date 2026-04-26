
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Design from './pages/Design'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import WorkoutReview from './pages/WorkoutReview'

function App() {
  

  return (
    <main>
      <Router>
        <Routes>
          <Route path="/" Component={Home} />
          <Route path="/onboarding" Component={Onboarding} />
          <Route path="/workout-review" Component={WorkoutReview} />
          <Route path="/dashboard" Component={Dashboard} />
          <Route path="/design" Component={Design} />
        </Routes>
      </Router>
    </main>
  )
}

export default App
