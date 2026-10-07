import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './motion.css'
import './ui-system.css'
import './result-page.css'
import './landing-page.css'
import './mission-brief.css'
import './quiz-page.css'
import './stage-clear.css'
import './social-challenge.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
