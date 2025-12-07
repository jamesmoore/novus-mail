import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { WebSocketNotificationProvider } from './WebSocketNotificationProvider.tsx';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './dompurify-hooks'; // imported to initialize but not referenced
import AppRouter from './AppRouter.tsx';

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
          <AppRouter />
        </QueryClientProvider>
      </WebSocketNotificationProvider>
    </ThemeProvider>
  </StrictMode>
)
