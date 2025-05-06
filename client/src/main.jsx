import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Log environment variables in development mode
if (import.meta.env.DEV) {
  console.log('Environment Variables:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'Not defined'
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)