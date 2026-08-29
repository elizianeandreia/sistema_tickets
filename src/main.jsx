import {
  StrictMode,
} from 'react'

import {
  createRoot,
} from 'react-dom/client'

import './index.css'

import App from './App.jsx'

import {
  ServiceDeskProvider,
} from './context/ServiceDeskContext.jsx'

createRoot(
  document.getElementById(
    'root'
  )
).render(
  <StrictMode>
    <ServiceDeskProvider>
      <App />
    </ServiceDeskProvider>
  </StrictMode>
)