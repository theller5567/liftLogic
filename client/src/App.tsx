
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Design from './pages/Design'
import Home from './pages/Home'

function App() {
  

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        padding: '2rem',
        background: 'hsl(var(--clr-neutral-800-b))',
      }}
    >
      <Router>
        <Routes>
          <Route path="/" Component={Home} />
          <Route path="/design" Component={Design} />
        </Routes>
      </Router>
    </main>
  )
}

export default App
