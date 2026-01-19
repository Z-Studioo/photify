import { AdminArtEditPage } from '@/components/admin/admin-art-edit-page';

export default async function AdminArtEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminArtEditPage productId={id} />;
}

