import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// import './index.css'
// import './layout.css'
// import './style.css'
// import App from './App.tsx'
import Mailbox from './Mailbox.tsx'
import Manage from './Manage.tsx';
import Mail from './Mail.tsx';
import AddressContextProvider from './AddressContextProvider.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

// Renamed from root to app for css compatability
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <ThemeProvider theme={theme} noSsr >
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {/* <App /> */}
        <AddressContextProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Mailbox />} />
              <Route path="/manage" element={<Manage />} />
              <Route path="/mail/:messageId" element={<Mail />} />
            </Routes>
          </Router>
        </AddressContextProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
