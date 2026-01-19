import { AdminOrderDetailPage } from '@/components/admin/admin-order-detail-page';

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await params; // Await params to satisfy Next.js 15+ requirements
  return <AdminOrderDetailPage />;
}
