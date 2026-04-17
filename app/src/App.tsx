import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import AppRoutes from './Routes';

/**
 * Legacy client-only entry. Left in place for any tool/test that imports
 * `App` directly, but the real bootstrap now lives in `entry-client.tsx`
 * (client) and `entry-server.tsx` (SSR).
 */
const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
};

export default App;
