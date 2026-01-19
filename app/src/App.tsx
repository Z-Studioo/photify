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
import MultiCanvasWallPage from '@/pages/customize/multi-canvas-wall';
import PosterCollagePage from '@/pages/customize/poster-collage';
import SingleCanvasPage from '@/pages/customize/single-canvas';
import PhotoCollageCreatorPage from '@/pages/customize/photo-collage-creator';
import Product3DViewPage from '@/pages/customize/product-3d-view';
import CheckoutPage from '@/pages/checkout';
import ConfirmationPage from '@/pages/confirmation';
import CartPage from '@/pages/cart';
import AIToolsPage from '@/pages/ai-tools';
import AIBackgroundRemoverPage from '@/pages/ai-background-remover';
import AICollagePage from '@/pages/ai-collage';
import AIGeneratePage from '@/pages/ai-generate';
import AIPhotoEditorPage from '@/pages/ai-photo-editor';
import AIPrintSizePage from '@/pages/ai-print-size';
import AIRestorePage from '@/pages/ai-restore';
import AIResultsPage from '@/pages/ai-results';
import ArtPage from '@/pages/art/[id]';
import ArtCollectionsPage from '@/pages/art-collections';

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
                  <Route path='/art/:id' element={<ArtPage />} />
                  <Route path='/art-collections' element={<ArtCollectionsPage />} />
                  <Route path='/customize/multi-canvas-wall' element={<MultiCanvasWallPage />} />
                  <Route path='/customize/poster-collage' element={<PosterCollagePage />} />
                  <Route path='/customize/single-canvas' element={<SingleCanvasPage />} />
                  <Route path='/customize/photo-collage-creator' element={<PhotoCollageCreatorPage />} />
                  <Route path='/customize/product-3d-view' element={<Product3DViewPage />} />
                  <Route path='/cart' element={<CartPage />} />
                  <Route path='/checkout' element={<CheckoutPage />} />
                  <Route path='/confirmation' element={<ConfirmationPage />} />
                  <Route path='/ai-tools' element={<AIToolsPage />} />
                  <Route path='/ai-background-remover' element={<AIBackgroundRemoverPage />} />
                  <Route path='/ai-collage' element={<AICollagePage />} />
                  <Route path='/ai-generate' element={<AIGeneratePage />} />
                  <Route path='/ai-photo-editor' element={<AIPhotoEditorPage />} />
                  <Route path='/ai-print-size' element={<AIPrintSizePage />} />
                  <Route path='/ai-restore' element={<AIRestorePage />} />
                  <Route path='/ai-results' element={<AIResultsPage />} />
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
