import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import './style.css'
import './layout.css'
// import App from './App.tsx'
import Mailbox from './Mailbox.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    <Mailbox/>
  </StrictMode>,
)
