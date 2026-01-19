import { AdminProductEditPage } from '@/components/admin/admin-product-edit-page';

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <AdminProductEditPage productId={productId} />;
}
