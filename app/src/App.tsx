import React from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { UploadProvider } from '@/context/UploadContext';
import Dashboard from '@/pages/dashboard/index';
import UploadImage from './pages/page';
import { BrowserRouter, Route, Routes } from 'react-router';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UploadProvider>
        <Routes>
          <Route
            path='/dashboard'
            element={
              <FeatureProvider>
                <Dashboard />
              </FeatureProvider>
            }
          />
          <Route path='/' element={<UploadImage />} />
        </Routes>
      </UploadProvider>
    </BrowserRouter>
  );
};

export default App;
