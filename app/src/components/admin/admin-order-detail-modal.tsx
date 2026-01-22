import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  MapPin,
  Mail,
  Phone,
  Printer,
  Download,
  MessageSquare,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderDetailModalProps {
  order: {
    id: string;
    customer: string;
    email: string;
    product: string;
    quantity: number;
    amount: string;
    status: string;
    date: string;
    shipping: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminOrderDetailModal({
  order,
  open,
  onOpenChange,
}: OrderDetailModalProps) {
  const [status, setStatus] = useState(order?.status || 'Pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleUpdateStatus = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Order status updated to ${status}`);
      onOpenChange(false);
    }, 1000);
  };

  const handlePrintInvoice = () => {
    toast.success('Invoice sent to printer');
  };

  const handlePrintLabel = () => {
    toast.success('Shipping label sent to printer');
  };

  const handleSendEmail = () => {
    toast.success('Email sent to customer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto font-['Mona_Sans',_sans-serif]">
        <DialogHeader>
          <DialogTitle
            className="font-['Bricolage_Grotesque',_sans-serif] flex items-center justify-between"
            style={{ fontSize: '24px', fontWeight: '600' }}
          >
            Order Details
            <span className='text-[#f63a9e]'>{order.id}</span>
          </DialogTitle>
          <DialogDescription>
            Manage order information and update status
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4'>
          {/* Left Column - Order Info */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Customer Information */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-semibold mb-3 flex items-center gap-2'>
                <Package className='w-4 h-4' />
                Customer Information
              </h3>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <span className='text-sm text-gray-600 w-24'>Name:</span>
                  <span className='text-sm font-medium'>{order.customer}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <Mail className='w-4 h-4 text-gray-400 mt-0.5' />
                  <span className='text-sm'>{order.email}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <Phone className='w-4 h-4 text-gray-400 mt-0.5' />
                  <span className='text-sm'>+44 7700 900123</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-semibold mb-3 flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                Shipping Address
              </h3>
              <div className='text-sm'>
                <p className='font-medium'>{order.customer}</p>
                <p className='text-gray-600'>123 Main Street, Apt 4B</p>
                <p className='text-gray-600'>London, Greater London</p>
                <p className='text-gray-600'>SW1A 1AA, United Kingdom</p>
              </div>
            </div>

            {/* Order Items */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <h3 className='font-semibold mb-4'>Order Items</h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between py-3 border-b border-gray-100'>
                  <div className='flex-1'>
                    <p className='font-medium'>{order.product}</p>
                    <p className='text-sm text-gray-600'>
                      Size: 50cm × 70cm | Frame: Black Wood
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='font-medium'>{order.amount}</p>
                    <p className='text-sm text-gray-600'>
                      Qty: {order.quantity}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className='my-4' />

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Subtotal</span>
                  <span>{order.amount}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>
                    Shipping ({order.shipping})
                  </span>
                  <span>£4.99</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Tax (20%)</span>
                  <span>£14.60</span>
                </div>
                <Separator className='my-2' />
                <div className='flex justify-between font-semibold'>
                  <span>Total</span>
                  <span className='text-[#f63a9e]'>£87.59</span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <h3 className='font-semibold mb-3 flex items-center gap-2'>
                <MessageSquare className='w-4 h-4' />
                Add Order Note
              </h3>
              <Textarea
                placeholder='Add internal notes about this order...'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
              <Button
                className='mt-2 bg-gray-900 hover:bg-gray-800'
                size='sm'
                onClick={() => {
                  toast.success('Note added to order');
                  setNotes('');
                }}
              >
                Add Note
              </Button>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className='space-y-6'>
            {/* Status Update */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <h3 className='font-semibold mb-3'>Order Status</h3>
              <div className='space-y-3'>
                <div>
                  <Label>Current Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Pending'>Pending</SelectItem>
                      <SelectItem value='Processing'>Processing</SelectItem>
                      <SelectItem value='Shipped'>Shipped</SelectItem>
                      <SelectItem value='Delivered'>Delivered</SelectItem>
                      <SelectItem value='Cancelled'>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={loading}
                  className='w-full bg-[#f63a9e] hover:bg-[#e02d8d]'
                  style={{ height: '44px' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>

            {/* Order Info */}
            <div className='border border-gray-200 rounded-lg p-4'>
              <h3 className='font-semibold mb-3'>Order Information</h3>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Order Date:</span>
                  <span className='font-medium'>{order.date}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Payment:</span>
                  <span className='font-medium text-green-600'>Paid</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Method:</span>
                  <span className='font-medium'>Credit Card</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Tracking:</span>
                  <span className='font-medium text-blue-600'>GB123456789</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='space-y-2'>
              <h3 className='font-semibold mb-3'>Quick Actions</h3>

              <Button
                onClick={handlePrintInvoice}
                variant='outline'
                className='w-full justify-start'
              >
                <Printer className='w-4 h-4 mr-2' />
                Print Invoice
              </Button>

              <Button
                onClick={handlePrintLabel}
                variant='outline'
                className='w-full justify-start'
              >
                <Download className='w-4 h-4 mr-2' />
                Print Shipping Label
              </Button>

              <Button
                onClick={handleSendEmail}
                variant='outline'
                className='w-full justify-start'
              >
                <Mail className='w-4 h-4 mr-2' />
                Email Customer
              </Button>

              <Button
                variant='outline'
                className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <XCircle className='w-4 h-4 mr-2' />
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
