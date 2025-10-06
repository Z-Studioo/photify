import React from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import Dashboard from '@/pages/dashboard/index';
import UploadImage from './pages/page';

const App: React.FC = () => {
  return (
    <FeatureProvider>
      <Dashboard />
      {/* <UploadImage /> */}
    </FeatureProvider>
  );
};

export default App;
