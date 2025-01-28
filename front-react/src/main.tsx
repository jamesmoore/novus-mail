import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// import './index.css'
import './layout.css'
import './style.css'
// import App from './App.tsx'
import Mailbox from './Mailbox.tsx'
import Manage from './Manage.tsx';

// Renamed from root to app for css compatability
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {/* <App /> */}
    <Router>
      <Routes>
        <Route path="/" element={<Mailbox />} />
        <Route path="/manage" element={<Manage />} />        
      </Routes>
    </Router>
  </StrictMode>,
)
