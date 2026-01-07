import React from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { UploadProvider } from '@/context/UploadContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';
import Dashboard from '@/pages/dashboard/index';
import UploadImage from './pages';
import { BrowserRouter, Route, Routes } from 'react-router';
import CropPage from '@/pages/crop';
import { ToastProvider } from '@/components/shared/common/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PresetProvider } from './context/PresetContext';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <UploadProvider>
            <PresetProvider>
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
            </PresetProvider>
          </UploadProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
