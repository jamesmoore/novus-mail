import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import './layout.css'
import './style.css'
// import App from './App.tsx'
import Mailbox from './Mailbox.tsx'

// Renamed from root to app for css compatability
createRoot(document.getElementById('app')!).render( 
  <StrictMode>
    {/* <App /> */}
    <Mailbox/>
  </StrictMode>,
)
