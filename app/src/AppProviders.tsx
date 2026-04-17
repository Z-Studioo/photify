import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/shared/common/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InitialDataProvider, type InitialData } from '@/ssr/InitialDataContext';

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: React.ReactNode;
  initialData?: InitialData;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  initialData,
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CartProvider>
          <InitialDataProvider value={initialData}>
            {children}
          </InitialDataProvider>
        </CartProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
