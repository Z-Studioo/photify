import { Outlet } from 'react-router';
import { ViewProvider } from '@/context/ViewContext';
import { ClientOnly } from '@/components/shared/client-only';

export default function CropLayout() {
  // Cropping uses react-easy-crop which depends on browser-only APIs, so
  // render the crop subtree client-only.
  return (
    <ClientOnly>
      <ViewProvider>
        <Outlet />
      </ViewProvider>
    </ClientOnly>
  );
}
