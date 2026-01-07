import { ConfirmationModal } from '@/components/shared/dashboard/ConfirmModal';
import { Check, X, AlertCircle, Image, DollarSign } from 'lucide-react';

interface ImportSummary {
  isValid: boolean;
  fileName: string;
  fileSize: string;
  hasImage: boolean;
  frameSize: string;
  frameRatio: string;
  edgeType: string;
  quantity: number;
  totalPrice: number;
  error?: string;
}

interface ImportConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onReUpload?: () => void;
  importSummary: ImportSummary | null;
  isImporting?: boolean;
}

export function ImportConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  onReUpload,
  importSummary,
  isImporting = false,
}: ImportConfirmationModalProps) {
  if (!importSummary) return null;

  const isInvalid = !importSummary.isValid;

  const handleConfirmAction = () => {
    if (isInvalid && onReUpload) {
      onReUpload();
    } else {
      onConfirm();
    }
  };

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirmAction}
      title={
        isInvalid ? 'Invalid Configuration File' : 'Import Preset Configuration'
      }
      confirmText={
        isImporting
          ? 'Importing...'
          : isInvalid
            ? 'Re-upload File'
            : 'Confirm Upload'
      }
      cancelText={isInvalid ? 'Cancel' : 'Cancel'}
      disabled={isImporting}
      isLoading={isImporting}
      description={
        <div className='space-y-4'>
          <div className='bg-gray-50 rounded-md p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>File</span>
              <span className='text-xs text-gray-500'>
                {importSummary.fileSize}
              </span>
            </div>
            <p className='text-sm text-gray-600 break-all'>
              {importSummary.fileName}
            </p>
          </div>

          {isInvalid ? (
            <div className='bg-red-50 border border-red-200 rounded-md p-3'>
              <div className='flex items-center gap-2 text-red-800'>
                <AlertCircle className='h-4 w-4' />
                <span className='text-sm font-medium'>Invalid File</span>
              </div>
              <p className='text-xs text-red-600 mt-1'>
                {importSummary.error ||
                  'This is not a valid Photify preset file.'}
              </p>
              <p className='text-xs text-red-600 mt-2'>
                Please select a valid JSON configuration file.
              </p>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                <p className='text-sm text-gray-600'>
                  This preset contains the following configuration:
                </p>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium flex items-center gap-2'>
                      <Image className='h-3 w-3' />
                      Image
                    </span>
                    <div className='flex items-center gap-2'>
                      {importSummary.hasImage ? (
                        <>
                          <Check className='h-3 w-3 text-green-600' />
                          <span className='text-xs text-green-600'>
                            Included
                          </span>
                        </>
                      ) : (
                        <>
                          <X className='h-3 w-3 text-gray-400' />
                          <span className='text-xs text-gray-500'>
                            Not included
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Frame Size</span>
                    <span className='text-xs text-gray-600'>
                      {importSummary.frameSize}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Aspect Ratio</span>
                    <span className='text-xs text-gray-600'>
                      {importSummary.frameRatio}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Edge Type</span>
                    <span className='text-xs text-gray-600 capitalize'>
                      {importSummary.edgeType}
                    </span>
                  </div>

                  <div className='flex items-center justify-between border-t pt-2'>
                    <span className='text-sm font-medium flex items-center gap-2'>
                      <DollarSign className='h-3 w-3' />
                      Total Price
                    </span>
                    <span className='text-sm font-semibold text-gray-800'>
                      ${importSummary.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3'>
                <p className='text-xs text-yellow-800'>
                  This will overwrite your current frame configuration
                  {importSummary.hasImage ? ' and image' : ''}.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
