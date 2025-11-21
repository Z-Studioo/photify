import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  disabled?: boolean; 
}

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Changes",
  description = "Are you sure you want to proceed with these changes?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  disabled = false 
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-xs bg-white p-4 rounded-lg shadow-lg z-50 focus:outline-none"
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Dialog.Title className="text-sm font-semibold">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5" disabled={disabled}>
                      <X className="h-3 w-3" />
                    </Button>
                  </Dialog.Close>
                </div>
                
                <Dialog.Description className="text-gray-600 text-xs mb-4 leading-relaxed">
                  {description}
                </Dialog.Description>
                
                <div className="flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="sm" className="text-xs px-3" disabled={disabled}>
                      {cancelText}
                    </Button>
                  </Dialog.Close>
                  <Button onClick={handleConfirm} size="sm" className="text-xs px-3" disabled={disabled}>
                    {confirmText}
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}