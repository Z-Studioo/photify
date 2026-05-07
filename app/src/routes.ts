import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';

export default [
  index('pages/index.tsx'),

  layout('layouts/canvas-configurer-layout.tsx', [
    route('canvas-configurer', 'pages/dashboard/index.tsx'),
  ]),

  route('upload', 'pages/upload/index.tsx'),

  layout('layouts/crop-layout.tsx', [
    route('crop', 'pages/crop/index.tsx'),
  ]),

  route('contact', 'pages/contact/index.tsx'),
  route('privacy-policy', 'pages/privacy-policy/index.tsx'),
  route('terms-of-use', 'pages/terms-of-use/index.tsx'),
  route('refund-return-policy', 'pages/refund-return-policy/index.tsx'),
  route('track-order', 'pages/track-order/index.tsx'),

  route('room/:id', 'pages/room/[id]/index.tsx'),
  route('products', 'pages/products/index.tsx'),
  route('product/:id', 'pages/product/[id]/index.tsx'),
  route('art/:id', 'pages/art/[id]/index.tsx'),
  route('art-collections', 'pages/art-collections/index.tsx'),

  route(
    'customize/multi-canvas-wall',
    'pages/customize/multi-canvas-wall/index.tsx'
  ),
  route(
    'customize/event-canvas',
    'pages/customize/event-canvas/index.tsx'
  ),
  route(
    'customize/single-canvas',
    'pages/customize/single-canvas/index.tsx'
  ),
  route(
    'customize/photo-collage-creator',
    'pages/customize/photo-collage-creator/index.tsx'
  ),
  route(
    'customize/product-3d-view',
    'pages/customize/product-3d-view/index.tsx'
  ),

  route('cart', 'pages/cart/index.tsx'),
  route('checkout', 'pages/checkout/index.tsx'),
  route('confirmation', 'pages/confirmation/index.tsx'),

  layout('layouts/admin-layout.tsx', [
    route('admin/login', 'pages/admin/login/index.tsx'),
    route('admin/dashboard', 'pages/admin/dashboard/index.tsx'),
    route('admin/analytics', 'pages/admin/analytics/index.tsx'),

    route('admin/categories', 'pages/admin/categories/index.tsx'),
    route(
      'admin/categories/:categoryId',
      'pages/admin/categories/[categoryId]/index.tsx'
    ),

    route('admin/orders', 'pages/admin/orders/index.tsx'),
    route(
      'admin/orders/:orderId',
      'pages/admin/orders/[orderId]/index.tsx'
    ),

    route('admin/promotions', 'pages/admin/promotions/index.tsx'),
    route('admin/promotions/new', 'pages/admin/promotions/new/index.tsx'),
    route(
      'admin/promotions/edit/:promotionId',
      'pages/admin/promotions/edit/[promotionId]/index.tsx'
    ),

    route('admin/rooms', 'pages/admin/rooms/index.tsx'),
    route('admin/rooms/new', 'pages/admin/rooms/new/index.tsx'),
    route('admin/rooms/:roomId', 'pages/admin/rooms/[roomId]/index.tsx'),

    route('admin/products', 'pages/admin/products/index.tsx'),
    route('admin/products/new', 'pages/admin/products/new/index.tsx'),
    route(
      'admin/products/edit/:productId',
      'pages/admin/products/edit/[productId]/index.tsx'
    ),

    route('admin/art-collection', 'pages/admin/art-collection/index.tsx'),
    route(
      'admin/art-collection/new',
      'pages/admin/art-collection/new/index.tsx'
    ),
    route(
      'admin/art-collection/edit/:id',
      'pages/admin/art-collection/edit/[id]/index.tsx'
    ),

    route('admin/settings', 'pages/admin/settings/index.tsx'),
    route(
      'admin/settings/size-pricing',
      'pages/admin/settings/size-pricing/index.tsx'
    ),

    route('admin/customers', 'pages/admin/customers/index.tsx'),
  ]),

  route('category/:category', 'pages/category/[category]/CategoryPageRoute.tsx'),

  route('*', 'pages/not-found.tsx'),
] satisfies RouteConfig;
