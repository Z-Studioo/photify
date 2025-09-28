import React from 'react';
import {FeatureProvider} from '@/context/dashboard/FeatureContext'
import Dashboard from '@/pages/dashboard/index'

const App: React.FC = () => {
  return (
    <FeatureProvider>
      <Dashboard />
    </FeatureProvider>
  );
};

export default App;