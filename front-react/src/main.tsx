import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Manage from './manage.tsx';
import Mail from './mail.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Mailbox from './mailbox.tsx';
import { WebSocketNotificationProvider } from './ws/websocket-notification-provider.tsx';
import DeletedMailbox from './deleted-mailbox.tsx';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './dompurify-hooks'; // imported to initialize but not referenced
import AuthRouter from './auth-router.tsx';
import MailboxRedirect from './mailbox-redirect.tsx';
import './index.css'
import './custom.css'
import { ThemeProvider } from './components/theme-provider.tsx';
import PageTitle from './page-title.tsx';
import Layout from './layout.tsx';
import TopBarSettings from './top-bar-settings.tsx';
import TopBarDeleted from './top-bar-deleted.tsx';
import TopBarAddress from './top-bar-address.tsx';
import { Toaster } from 'sonner';
import { registerServiceWorker } from './service-worker-registration';

const queryClient = new QueryClient();

// Register service worker for PWA
registerServiceWorker();

// Renamed from root to app for css compatability
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <PageTitle />
        <Toaster />
        <AuthRouter>
          <WebSocketNotificationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<MailboxRedirect />} />
                <Route path="/manage" element={<Layout topBarChildren={<TopBarSettings />} ><Manage /></Layout>} />
                <Route path="/deleted" element={<Layout topBarChildren={<TopBarDeleted />}><DeletedMailbox /></Layout>} />
                <Route path="/mail/:address/:messageId" element={<Layout children={<Mail />} />} />
                <Route path="/inbox/:address" element={<Layout topBarChildren={<TopBarAddress />} ><Mailbox /></Layout>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </WebSocketNotificationProvider>
        </AuthRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
