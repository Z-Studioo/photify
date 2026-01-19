import { AdminRoomEditPage } from '@/components/admin/admin-room-edit-page';

export default async function AdminRoomEdit({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <AdminRoomEditPage roomId={roomId} />;
}
