/**
 * BoneAI — Entry point.
 *
 * Imports Geist fonts and renders the App.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Design system CSS
import './index.css'

import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
