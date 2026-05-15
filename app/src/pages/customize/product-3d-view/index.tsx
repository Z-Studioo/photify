import { Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Product3DView } from '@/components/product-configs/shared/product-3d-view';
import { SingleCanvasSizeSelector } from '@/components/product-configs/single-canvas/single-canvas-size-selector';
import { usesSingleCanvasConfigurator } from '@/components/product-configs';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientOnly } from '@/components/shared/client-only';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/index';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: '3D Product Preview | Photify',
    description: 'Preview your custom canvas in an interactive 3D view.',
    path: '/customize/product-3d-view',
    noindex: true,
  });

function Product3DViewContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get parameters from URL
  const imageUrl = searchParams.get('image');
  const width = searchParams.get('width');
  const height = searchParams.get('height');
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  const aspectRatioId = searchParams.get('aspectRatioId'); // Optional: filter to specific aspect ratio
  const wrapImage = searchParams.get('wrapImage') !== 'false'; // Default true, only false if explicitly set
  const sideColor = searchParams.get('sideColor') || undefined; // Optional side color
  const mirrorEdges = searchParams.get('mirrorEdges') === 'true'; // Default false
  const enableImageEditor = searchParams.get('enableImageEditor') === 'true'; // Enable crop editor

  // Validate required parameters
  if (!imageUrl || !productId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f3ef]">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Missing Required Parameters</h2>
          <p className="text-gray-600 mb-6">
            Image URL and Product ID are required to view the 3D preview.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Single-canvas family (including collage-on-single-canvas) uses DB-backed size selector
  const customSizeSelector = usesSingleCanvasConfigurator(productId)
    ? SingleCanvasSizeSelector
    : undefined;

  return (
    <Product3DView
      imageUrl={decodeURIComponent(imageUrl)}
      canvasWidth={width ? parseFloat(width) : undefined}
      canvasHeight={height ? parseFloat(height) : undefined}
      productId={productId}
      productName={productName ? decodeURIComponent(productName) : undefined}
      aspectRatioId={aspectRatioId || undefined} // Pass aspect ratio if provided
      wrapImage={wrapImage}
      sideColor={sideColor ? decodeURIComponent(sideColor) : undefined}
      mirrorEdges={mirrorEdges}
      customSizeSelector={customSizeSelector} // Pass product-specific size selector
      enableImageEditor={enableImageEditor} // Enable crop editor for single-canvas
      onBack={() => navigate(-1)}
    />
  );
}

export default function Product3DViewPage() {
  return (
    <ClientOnly>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-[#f5f3ef]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#f63a9e] mx-auto mb-4" />
              <p className="text-gray-600">Loading 3D preview...</p>
            </div>
          </div>
        }
      >
        <Product3DViewContent />
      </Suspense>
    </ClientOnly>
  );
}
