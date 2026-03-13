import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ← Removed StrictMode — it causes double mount in dev
// which fires connectSocket twice and kills the first connection
createRoot(document.getElementById('root')).render(
  <App />
)