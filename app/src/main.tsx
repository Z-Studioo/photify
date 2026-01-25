import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { StrictMode } from 'react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
