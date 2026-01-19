import { useRouter } from 'next/navigation';
import { AdminLayout } from './admin-layout';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import { toast } from 'sonner';
import { useRooms } from '@/lib/supabase/hooks';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export function AdminRoomsPage() {
  const router = useRouter();
  const { data: dbRooms, loading, refetch } = useRooms();
  const [hotspotCounts, setHotspotCounts] = useState<Record<string, number>>(
    {}
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{
    id: string;
    title: string;
    hotspots: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch hotspot counts for all rooms
  useEffect(() => {
    const fetchHotspotCounts = async () => {
      if (!dbRooms || dbRooms.length === 0) return;

      const supabase = createClient();
      const counts: Record<string, number> = {};

      // Fetch counts for all rooms in one query
      const { data: allHotspots, error } = await supabase
        .from('room_hotspots')
        .select('room_id');

      if (!error && allHotspots) {
        // Count hotspots per room
        allHotspots.forEach((hotspot: any) => {
          counts[hotspot.room_id] = (counts[hotspot.room_id] || 0) + 1;
        });
      }

      setHotspotCounts(counts);
    };

    fetchHotspotCounts();
  }, [dbRooms]);

  // Transform rooms data
  const rooms = (dbRooms || []).map((room: any) => ({
    id: room.id,
    title: room.title,
    description: room.description,
    image: room.image,
    hotspots: hotspotCounts[room.id] || 0,
    views: 0, // Not tracked yet
    status: 'Active',
  }));

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;

    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomToDelete.id);

      if (error) throw error;

      toast.success('Room deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete room');
      console.warn('Delete room error:', error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setRoomToDelete(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='max-w-7xl mx-auto flex items-center justify-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-[#f63a9e]' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 flex items-start justify-between'>
          <div>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
              style={{ fontSize: '32px', fontWeight: '600' }}
            >
              Room Inspiration Management
            </h1>
            <p className='text-gray-600'>
              Create and manage room inspiration showcases
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/rooms/new')}
            className='bg-[#f63a9e] hover:bg-[#e02d8d] gap-2'
            style={{ height: '50px' }}
          >
            <Plus className='w-5 h-5' />
            Add Room
          </Button>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Rooms</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {rooms.length}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Hotspots</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {rooms.reduce((sum, r) => sum + r.hotspots, 0)}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Views</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              {rooms.reduce((sum, r) => sum + r.views, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rooms List */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Room
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Hotspots
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Views
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-right text-xs font-medium text-gray-600 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {rooms.map(room => (
                  <tr
                    key={room.id}
                    className='hover:bg-gray-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-4'>
                        <div className='w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                          <ImageWithFallback
                            src={room.image}
                            alt={room.title}
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div className='min-w-0'>
                          <p
                            className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                            style={{ fontSize: '16px', fontWeight: '600' }}
                          >
                            {room.title}
                          </p>
                          <p className='text-sm text-gray-600 line-clamp-1'>
                            {room.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm font-medium text-gray-900'>
                        {room.hotspots}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-900'>
                        {room.views.toLocaleString()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                        {room.status}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <button
                          onClick={() => router.push(`/admin/rooms/${room.id}`)}
                          className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
                          title='Edit'
                        >
                          <Edit className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => router.push(`/room/${room.id}`)}
                          className='p-2 text-gray-600 hover:text-[#f63a9e] hover:bg-pink-50 rounded-lg transition-colors'
                          title='View on Website'
                        >
                          <Eye className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => {
                            setRoomToDelete({
                              id: room.id,
                              title: room.title,
                              hotspots: room.hotspots,
                            });
                            setShowDeleteDialog(true);
                          }}
                          className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title='Delete Room?'
        itemName={roomToDelete?.title}
        itemType='room'
        loading={deleting}
        warningMessage='This action cannot be undone.'
        cascadeInfo={
          roomToDelete && roomToDelete.hotspots > 0
            ? [
                `${roomToDelete.hotspots} hotspot${roomToDelete.hotspots > 1 ? 's' : ''} will be permanently deleted`,
              ]
            : undefined
        }
      />
    </AdminLayout>
  );
}
