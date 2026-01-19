import React from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { UploadProvider } from '@/context/UploadContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';
import { CartProvider } from '@/context/CartContext';
import Dashboard from '@/pages/dashboard/index';
import UploadImage from './pages/upload';
import HomePage from '@/pages';
import { BrowserRouter, Route, Routes } from 'react-router';
import CropPage from '@/pages/crop';
import { ToastProvider } from '@/components/shared/common/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PresetProvider } from './context/PresetContext';
import ContactPage from '@/pages/contact';
import TrackOrderPage from '@/pages/track-order';
import RoomPage from '@/pages/room/[id]';
import NotFoundPage from '@/pages/not-found';
import ProductPage from '@/pages/product/[id]';
import ProductsPage from '@/pages/products';
import CheckoutPage from '@/pages/checkout';
import ConfirmationPage from '@/pages/confirmation';
import CartPage from '@/pages/cart';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CartProvider>
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
                  <Route path='/' element={<HomePage />} />
                  <Route path='/upload' element={<UploadImage />} />
                  <Route
                    path='/crop'
                    element={
                      <ViewProvider>
                        <CropPage />
                      </ViewProvider>
                    }
                  />
                  <Route path='/contact' element={<ContactPage />} />
                  <Route path='/track-order' element={<TrackOrderPage />} />
                  <Route path='/room/:id' element={<RoomPage />} />
                  <Route path='/products' element={<ProductsPage />} />
                  <Route path='/product/:id' element={<ProductPage />} />
                  <Route path='/cart' element={<CartPage />} />
                  <Route path='/checkout' element={<CheckoutPage />} />
                  <Route path='/confirmation' element={<ConfirmationPage />} />
                  <Route path='*' element={<NotFoundPage />} />
                </Routes>
              </PresetProvider>
            </UploadProvider>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
