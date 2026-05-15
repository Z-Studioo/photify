import { Outlet } from 'react-router';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';
import { ClientOnly } from '@/components/shared/client-only';

export default function CanvasConfigurerLayout() {
  // Configurer routes rely on three.js / fabric / browser editors which are
  // not safe to render on the server. Render the entire subtree client-only.
  return (
    <ClientOnly>
      <FeatureProvider>
        <ViewProvider>
          <EdgeProvider>
            <Outlet />
          </EdgeProvider>
        </ViewProvider>
      </FeatureProvider>
    </ClientOnly>
  );
}
