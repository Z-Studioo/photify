import { Outlet } from 'react-router';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';

export default function CanvasConfigurerLayout() {
  return (
    <FeatureProvider>
      <ViewProvider>
        <EdgeProvider>
          <Outlet />
        </EdgeProvider>
      </ViewProvider>
    </FeatureProvider>
  );
}
