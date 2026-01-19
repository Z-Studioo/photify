import { AdminCategoryDetailPage } from '@/components/admin/admin-category-detail-page';

interface PageProps {
  params: Promise<{
    categoryId: string;
  }>;
}

export default async function AdminCategoryDetail({ params }: PageProps) {
  const { categoryId } = await params;
  return <AdminCategoryDetailPage categoryId={categoryId} />;
}
