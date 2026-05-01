import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerAndSubscribe } from './pushSubscription.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker and subscribe to push notifications
// Delay slightly to not block initial render
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerAndSubscribe();
  });
}
