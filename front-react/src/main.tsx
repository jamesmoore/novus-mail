import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Manage from './Manage.tsx';
import Mail from './Mail.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Mailbox from './Mailbox.tsx';
import { WebSocketNotificationProvider } from './WebSocketNotificationProvider.tsx';
import DeletedMailbox from './DeletedMailbox.tsx';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './dompurify-hooks'; // imported to initialize but not referenced
import Root from './Root.tsx';
import MailboxRedirect from './MailboxRedirect.tsx';
import './index.css'
import { ThemeProvider } from './components/theme-provider.tsx';
import PageTitle from './PageTitle.tsx';
import WebSocketNotificationHandler from './WebSocketNotificationHandler.tsx';
import Layout from './Layout.tsx';
import TopBarSettings from './TopBarSettings.tsx';
import TopBarDeleted from './TopBarDeleted.tsx';
import TopBarAddress from './TopBarAddress.tsx';

const queryClient = new QueryClient();

// Renamed from root to app for css compatability
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <WebSocketNotificationProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <PageTitle />
          <WebSocketNotificationHandler />
          <Root>
            <Router>
              <Routes>
                <Route path="/" element={<MailboxRedirect />} />
                <Route path="/manage" element={<Layout><TopBarSettings /><Manage /></Layout>} />
                <Route path="/deleted" element={<Layout><TopBarDeleted /><DeletedMailbox /></Layout>} />
                <Route path="/mail/:address/:messageId" element={<Layout children={<Mail />} />} />
                <Route path="/inbox/:address" element={<Layout><TopBarAddress/><Mailbox /></Layout>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </Root>
        </QueryClientProvider>
      </ThemeProvider>
    </WebSocketNotificationProvider>
  </StrictMode>
)
