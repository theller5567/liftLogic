import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.scss'
import './styles/font-utilities.scss'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
