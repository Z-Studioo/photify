import { Outlet } from 'react-router';
import { ViewProvider } from '@/context/ViewContext';

export default function CropLayout() {
  return (
    <ViewProvider>
      <Outlet />
    </ViewProvider>
  );
}
