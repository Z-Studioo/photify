import React from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { UploadProvider } from '@/context/UploadContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';
import Dashboard from '@/pages/dashboard/index';
import UploadImage from './pages';
import { BrowserRouter, Route, Routes } from 'react-router';
import CropPage from '@/pages/crop';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UploadProvider>
          <Routes>
            <Route
              path='/dashboard'
              element={
                <FeatureProvider>
                  <ViewProvider>
                    <EdgeProvider>
                      <Dashboard />
                    </EdgeProvider>
                  </ViewProvider>
                </FeatureProvider>
              }
            />
            <Route path='/' element={<UploadImage />} />
            <Route
              path='/crop'
              element={
                <ViewProvider>
                  <CropPage />
                </ViewProvider>
              }
            />
          </Routes>
        </UploadProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
