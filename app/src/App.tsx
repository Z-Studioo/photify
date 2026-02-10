import React, { Suspense, lazy } from 'react';
import { FeatureProvider } from '@/context/dashboard/FeatureContext';
import { UploadProvider } from '@/context/UploadContext';
import { ViewProvider } from '@/context/ViewContext';
import { EdgeProvider } from '@/context/EdgeContext';
import { CartProvider } from '@/context/CartContext';
import { AdminProvider } from '@/context/AdminContext';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '@/components/shared/common/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PresetProvider } from './context/PresetContext';

const Dashboard = lazy(() => import('@/pages/dashboard/index'));
const UploadImage = lazy(() => import('./pages/upload'));
const HomePage = lazy(() => import('@/pages'));
const CropPage = lazy(() => import('@/pages/crop'));
const ContactPage = lazy(() => import('@/pages/contact'));
const TrackOrderPage = lazy(() => import('@/pages/track-order'));
const RoomPage = lazy(() => import('@/pages/room/[id]'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));
const ProductPage = lazy(() => import('@/pages/product/[id]'));
const ProductsPage = lazy(() => import('@/pages/products'));
const MultiCanvasWallPage = lazy(() => import('@/pages/customize/multi-canvas-wall'));
const PosterCollagePage = lazy(() => import('@/pages/customize/poster-collage'));
const SingleCanvasPage = lazy(() => import('@/pages/customize/single-canvas'));
const PhotoCollageCreatorPage = lazy(() => import('@/pages/customize/photo-collage-creator'));
const Product3DViewPage = lazy(() => import('@/pages/customize/product-3d-view'));
const CheckoutPage = lazy(() => import('@/pages/checkout'));
const ConfirmationPage = lazy(() => import('@/pages/confirmation'));
const CartPage = lazy(() => import('@/pages/cart'));
// const AIToolsPage = lazy(() => import('@/pages/ai-tools'));
// const AIBackgroundRemoverPage = lazy(() => import('@/pages/ai-background-remover'));
// const AICollagePage = lazy(() => import('@/pages/ai-collage'));
// const AIGeneratePage = lazy(() => import('@/pages/ai-generate'));
// const AIPhotoEditorPage = lazy(() => import('@/pages/ai-photo-editor'));
// const AIPrintSizePage = lazy(() => import('@/pages/ai-print-size'));
// const AIRestorePage = lazy(() => import('@/pages/ai-restore'));
// const AIResultsPage = lazy(() => import('@/pages/ai-results'));
const ArtPage = lazy(() => import('@/pages/art/[id]'));
const ArtCollectionsPage = lazy(() => import('@/pages/art-collections'));
const AdminLoginPage = lazy(() => import('@/pages/admin/login'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/analytics'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/categories'));
const AdminCategoryDetailPage = lazy(() => import('@/pages/admin/categories/[categoryId]'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/orders'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/orders/[orderId]'));
const AdminPromotionsPage = lazy(() => import('@/pages/admin/promotions'));
const AdminPromotionNewPage = lazy(() => import('@/pages/admin/promotions/new'));
const AdminPromotionEditPage = lazy(() => import('@/pages/admin/promotions/edit/[promotionId]'));
const AdminRoomsPage = lazy(() => import('@/pages/admin/rooms'));
const AdminRoomNewPage = lazy(() => import('@/pages/admin/rooms/new'));
const AdminRoomEditPage = lazy(() => import('@/pages/admin/rooms/[roomId]'));
const AdminProductsPage = lazy(() => import('@/pages/admin/products'));
const AdminProductEditPage = lazy(() => import('@/pages/admin/products/edit/[productId]'));
const AdminArtCollectionPage = lazy(() => import('@/pages/admin/art-collection'));
const AdminArtCollectionNewPage = lazy(() => import('@/pages/admin/art-collection/new'));
const AdminArtCollectionEditPage = lazy(() => import('@/pages/admin/art-collection/edit/[id]'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/settings'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/customers'));
const Category = lazy(() => import('@/pages/category/[category]/CategoryPageRoute'));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f63a9e]" />
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <AdminProvider>
              <UploadProvider>
                <PresetProvider>
                  <Suspense fallback={<PageLoader />}>
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
                      <Route
                        path='/art-collections'
                        element={<ArtCollectionsPage />}
                      />
                      <Route
                        path='/customize/multi-canvas-wall'
                        element={<MultiCanvasWallPage />}
                      />
                      <Route
                        path='/customize/poster-collage'
                        element={<PosterCollagePage />}
                      />
                      <Route
                        path='/customize/single-canvas'
                        element={<SingleCanvasPage />}
                      />
                      <Route
                        path='/customize/photo-collage-creator'
                        element={<PhotoCollageCreatorPage />}
                      />
                      <Route
                        path='/customize/product-3d-view'
                        element={<Product3DViewPage />}
                      />
                      <Route path='/cart' element={<CartPage />} />
                      <Route path='/checkout' element={<CheckoutPage />} />
                      <Route
                        path='/confirmation'
                        element={<ConfirmationPage />}
                      />
                      {/* <Route path='/ai-tools' element={<AIToolsPage />} />
                      <Route
                        path='/ai-background-remover'
                        element={<AIBackgroundRemoverPage />}
                      />
                      <Route path='/ai-collage' element={<AICollagePage />} />
                      <Route path='/ai-generate' element={<AIGeneratePage />} />
                      <Route
                        path='/ai-photo-editor'
                        element={<AIPhotoEditorPage />}
                      />
                      <Route
                        path='/ai-print-size'
                        element={<AIPrintSizePage />}
                      />
                      <Route path='/ai-restore' element={<AIRestorePage />} />
                      <Route path='/ai-results' element={<AIResultsPage />} /> */}
                      <Route path='/admin/login' element={<AdminLoginPage />} />
                      <Route
                        path='/admin/dashboard'
                        element={<AdminDashboardPage />}
                      />
                      <Route
                        path='/admin/analytics'
                        element={<AdminAnalyticsPage />}
                      />
                      <Route
                        path='/admin/categories'
                        element={<AdminCategoriesPage />}
                      />
                      <Route
                        path='/admin/categories/:categoryId'
                        element={<AdminCategoryDetailPage />}
                      />
                      <Route path='/admin/orders' element={<AdminOrdersPage />} />
                      <Route
                        path='/admin/orders/:orderId'
                        element={<AdminOrderDetailPage />}
                      />
                      <Route
                        path='/admin/promotions'
                        element={<AdminPromotionsPage />}
                      />
                      <Route
                        path='/admin/promotions/new'
                        element={<AdminPromotionNewPage />}
                      />
                      <Route
                        path='/admin/promotions/edit/:promotionId'
                        element={<AdminPromotionEditPage />}
                      />
                      <Route path='/admin/rooms' element={<AdminRoomsPage />} />
                      <Route
                        path='/admin/rooms/new'
                        element={<AdminRoomNewPage />}
                      />
                      <Route
                        path='/admin/rooms/:roomId'
                        element={<AdminRoomEditPage />}
                      />
                      <Route
                        path='/admin/products'
                        element={<AdminProductsPage />}
                      />
                      <Route
                        path='/admin/products/edit/:productId'
                        element={<AdminProductEditPage />}
                      />
                      <Route
                        path='/admin/art-collection'
                        element={<AdminArtCollectionPage />}
                      />
                      <Route
                        path='/admin/art-collection/new'
                        element={<AdminArtCollectionNewPage />}
                      />
                      <Route
                        path='/admin/art-collection/edit/:id'
                        element={<AdminArtCollectionEditPage />}
                      />
                      <Route
                        path='/admin/settings'
                        element={<AdminSettingsPage />}
                      />
                      <Route
                        path='/admin/customers'
                        element={<AdminCustomersPage />}
                      />
                      <Route path='/category/:category' element={<Category />} />
                      <Route path='*' element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </PresetProvider>
              </UploadProvider>
            </AdminProvider>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
