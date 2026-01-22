import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  itemType?: string;
  loading?: boolean;
  warningMessage?: string;
  cascadeInfo?: string[];
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemType = 'item',
  loading = false,
  warningMessage,
  cascadeInfo,
}: DeleteConfirmDialogProps) {
  const defaultTitle = title || `Delete ${itemType}?`;
  const defaultDescription =
    description ||
    (itemName
      ? `Are you sure you want to delete "${itemName}"?`
      : `Are you sure you want to delete this ${itemType}?`);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
              <AlertTriangle className='w-6 h-6 text-red-600' />
            </div>
            <AlertDialogTitle className="text-xl font-['Bricolage_Grotesque',_sans-serif]">
              {defaultTitle}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className='text-gray-600 text-base pt-2'>
            {defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning Message */}
        {warningMessage && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 my-4'>
            <p className='text-sm text-red-800 font-medium'>
              ⚠️ {warningMessage}
            </p>
          </div>
        )}

        {/* Cascade Info */}
        {cascadeInfo && cascadeInfo.length > 0 && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 my-4'>
            <p className='text-sm text-amber-900 font-semibold mb-2'>
              This will also delete:
            </p>
            <ul className='text-sm text-amber-800 space-y-1'>
              {cascadeInfo.map((info, index) => (
                <li key={index}>• {info}</li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter className='gap-2 sm:gap-2'>
          <AlertDialogCancel disabled={loading} className='border-gray-300'>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className='bg-red-600 hover:bg-red-700 text-white'
          >
            {loading ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Deleting...
              </>
            ) : (
              `Delete ${itemType}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
