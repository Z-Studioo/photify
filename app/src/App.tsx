import React from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { UploadProvider } from '@/context/UploadContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';
import Dashboard from '@/pages/dashboard/index';
import UploadImage from './pages';
import { BrowserRouter, Route, Routes } from 'react-router';
import CropPage from '@/pages/crop';
import { NextStepProvider, NextStepReact } from 'nextstepjs';
import { dashboardSteps } from './utils/steps';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UploadProvider>
        <NextStepProvider>
          <Routes>
            <Route
              path='/dashboard'
              element={
                <FeatureProvider>
                  <ViewProvider>
                    <EdgeProvider>
                      <NextStepReact
                        steps={dashboardSteps}
                        cardTransition={{
                          duration: 0.3,
                          type: 'spring',
                        }}
                        onComplete={tourId => {
                          // When welcome tour completes, automatically start main tour
                          if (tourId === 'welcome') {
                            setTimeout(() => {
                              // NextStepJS will automatically move to next tour
                            }, 100);
                          }
                        }}
                      >
                        <Dashboard />
                      </NextStepReact>
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
        </NextStepProvider>
      </UploadProvider>
    </BrowserRouter>
  );
};

export default App;
