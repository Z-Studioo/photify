import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Loader2,
  GripVertical,
  ImageIcon,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/image-with-fallback';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RoomBackground {
  id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
}

interface AdminProductRoomBackgroundsEditorProps {
  productId: string;
  currentRooms?: RoomBackground[];
}

// Sortable Room Card Component
function SortableRoomCard({
  room,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  room: RoomBackground;
  onEdit: (room: RoomBackground) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: room.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onEdit({ ...room, name: editName.trim() });
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white border-2 rounded-lg overflow-hidden transition-all ${
        isDragging ? 'border-[#f63a9e] shadow-xl' : 'border-gray-200'
      } ${!room.isActive ? 'opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className='absolute top-2 left-2 z-10 bg-white/90 rounded p-1.5 cursor-move hover:bg-white shadow-sm'
      >
        <GripVertical className='w-4 h-4 text-gray-600' />
      </div>

      {/* Active Toggle */}
      <button
        onClick={() => onToggleActive(room.id)}
        className='absolute top-2 right-2 z-10 bg-white/90 rounded p-1.5 hover:bg-white shadow-sm'
        title={room.isActive ? 'Deactivate' : 'Activate'}
      >
        {room.isActive ? (
          <Eye className='w-4 h-4 text-green-600' />
        ) : (
          <EyeOff className='w-4 h-4 text-gray-400' />
        )}
      </button>

      {/* Image */}
      <div className='aspect-video bg-gray-100'>
        <ImageWithFallback
          src={room.imageUrl}
          alt={room.name}
          className='w-full h-full object-cover'
        />
      </div>

      {/* Name Editor */}
      <div className='p-3 border-t border-gray-100'>
        {isEditing ? (
          <div className='flex gap-2'>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSaveEdit()}
              className='h-8 text-sm'
              autoFocus
            />
            <Button size='sm' onClick={handleSaveEdit} className='h-8'>
              Save
            </Button>
          </div>
        ) : (
          <div className='flex items-center justify-between'>
            <span
              className='font-medium text-sm truncate cursor-pointer hover:text-[#f63a9e]'
              onClick={() => setIsEditing(true)}
            >
              {room.name}
            </span>
            <button
              onClick={() => onDelete(room.id)}
              className='text-red-600 hover:bg-red-50 p-1 rounded'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminProductRoomBackgroundsEditor({
  productId,
  currentRooms = [],
}: AdminProductRoomBackgroundsEditorProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rooms, setRooms] = useState<RoomBackground[]>(currentRooms);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update rooms when prop changes
  useEffect(() => {
    setRooms(currentRooms);
    setHasChanges(false);
  }, [currentRooms]);

  // Handle drag end - reorder rooms
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRooms(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  // Handle file upload to Supabase Storage
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `room-bg-${Date.now()}.${fileExt}`;
      const filePath = `room-backgrounds/${fileName}`;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await supabase.storage
        .from('photify')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('photify').getPublicUrl(filePath);

      // Add new room to list
      const newRoom: RoomBackground = {
        id: `room-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        imageUrl: publicUrl,
        isActive: true,
      };

      setRooms(prev => [...prev, newRoom]);
      setHasChanges(true);
      toast.success('Room image uploaded');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle edit room
  const handleEditRoom = (updatedRoom: RoomBackground) => {
    setRooms(prev =>
      prev.map(room => (room.id === updatedRoom.id ? updatedRoom : room))
    );
    setHasChanges(true);
  };

  // Handle delete room
  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
    setHasChanges(true);
  };

  // Handle toggle active
  const handleToggleActive = (id: string) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === id ? { ...room, isActive: !room.isActive } : room
      )
    );
    setHasChanges(true);
  };

  // Save to database
  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch current product config
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('config')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      // Merge with existing config to preserve other properties
      const updatedConfig = {
        ...(currentProduct?.config || {}),
        roomBackgrounds: rooms, // Add room backgrounds to config
      };

      const { error: updateError } = await supabase
        .from('products')
        .update({ config: updatedConfig })
        .eq('id', productId);

      if (updateError) throw updateError;

      toast.success('Room backgrounds saved successfully');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save room backgrounds');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='p-6'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Room Backgrounds
            </h3>
            <p className='text-sm text-gray-600 mt-1'>
              Upload and manage room background images for the multi-canvas wall
              customizer
            </p>
          </div>

          <div className='flex gap-2'>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileUpload}
              className='hidden'
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant='outline'
              size='sm'
            >
              {uploading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className='w-4 h-4 mr-2' />
                  Add Room
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Room Grid with Drag & Drop */}
        {rooms.length === 0 ? (
          <div className='bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300'>
            <ImageIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h4 className='text-base font-semibold text-gray-900 mb-2'>
              No room backgrounds yet
            </h4>
            <p className='text-sm text-gray-600 mb-6'>
              Upload your first room background image
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
            >
              <Upload className='w-4 h-4 mr-2' />
              Upload Room Image
            </Button>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rooms.map(room => room.id)}
                strategy={rectSortingStrategy}
              >
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {rooms.map(room => (
                    <SortableRoomCard
                      key={room.id}
                      room={room}
                      onEdit={handleEditRoom}
                      onDelete={handleDeleteRoom}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Save Button */}
            {hasChanges && (
              <div className='flex justify-end pt-4 border-t border-gray-200'>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white'
                >
                  {saving ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Save Room Backgrounds'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
