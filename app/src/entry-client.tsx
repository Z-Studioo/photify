import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { StrictMode } from 'react';
import { Toaster } from 'sonner';
import './index.css';
import { AppProviders } from './AppProviders';
import AppRoutes from './Routes';

const container = document.getElementById('root')!;

const tree = (
  <StrictMode>
    <HelmetProvider>
      <AppProviders>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
    </HelmetProvider>
    <Toaster richColors />
  </StrictMode>
);

// SEO routes are server-rendered and expose window.__SSR__ = true.
// Other routes are served as a bare SPA shell.
const isSSR =
  typeof window !== 'undefined' &&
  (window as unknown as { __SSR__?: boolean }).__SSR__ === true;

if (isSSR) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
