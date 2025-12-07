import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './Layout.tsx'
import Manage from './Manage.tsx';
import Mail from './Mail.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Mailbox from './Mailbox.tsx';
import TopBarAddress from './TopBarAddress.tsx';
import { WebSocketNotificationProvider } from './WebSocketNotificationProvider.tsx';
import TopBarSettings from './TopBarSettings.tsx';
import DeletedMailbox from './DeletedMailbox.tsx';
import TopBarDeleted from './TopBarDeleted.tsx';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './dompurify-hooks'; // imported to initialize but not referenced
import Root from './Root.tsx';
import AuthListener from './AuthListener.tsx';

const queryClient = new QueryClient();

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
      <WebSocketNotificationProvider>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <Router>
            <AuthListener />
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/manage" element={<Layout bodyChildren={<Manage />} topBarChildren={<TopBarSettings />} />} />
              <Route path="/deleted" element={<Layout bodyChildren={<DeletedMailbox />} topBarChildren={<TopBarDeleted />} />} />
              <Route path="/mail/:address/:messageId" element={<Layout bodyChildren={<Mail />} topBarChildren={<TopBarAddress />} />} />
              <Route path="/inbox/:address" element={<Layout bodyChildren={<Mailbox />} topBarChildren={<TopBarAddress />} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </QueryClientProvider>
      </WebSocketNotificationProvider>
    </ThemeProvider>
  </StrictMode>
)
