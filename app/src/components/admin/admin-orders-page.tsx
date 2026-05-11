import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import {
  Search,
  Filter,
  Eye,
  Printer,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  normaliseStatus,
  statusLabel,
  statusBadgeClass,
  type OrderStatus,
} from '@/lib/orders/status';
import { openInvoiceForPrint } from '@/lib/orders/invoice';

// ── Constants ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// ── Types ──────────────────────────────────────────────────────────────────
interface RawItem {
  name: string;
  size?: string;
  price: string;
  quantity: number;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  quantity: number;
  amount: string;
  status: OrderStatus;
  date: string;
  shipping: string;
  rawItems: RawItem[];
}

// ── Component ──────────────────────────────────────────────────────────────
export function AdminOrdersPage() {
  const navigate = useNavigate();
  const supabase = useMemo(() => createClient(), []);

  // Separate input state (immediate) from query state (debounced → triggers fetch)
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── Debounced search ───────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 350);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  // ── Server-side fetch (pagination + filtering) ─────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (searchQuery.trim()) {
        query = query.or(
          `order_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`
        );
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const mapped: Order[] = (data ?? []).map(row => ({
        id: row.order_number as string,
        customer: row.customer_name as string,
        email: row.customer_email as string,
        product: (row.items as RawItem[])?.[0]?.name || 'Multiple Items',
        quantity:
          (row.items as RawItem[])?.reduce((s, i) => s + i.quantity, 0) ?? 0,
        amount: `£${parseFloat(row.total as string).toFixed(2)}`,
        status: normaliseStatus(row.status as string),
        date: new Date(row.created_at as string).toLocaleDateString('en-GB'),
        shipping: 'Standard Delivery',
        rawItems: (row.items as RawItem[]) ?? [],
      }));

      setOrders(mapped);
      setTotalCount(count ?? 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // ── Print invoice ──────────────────────────────────────────────────────
  const handlePrintInvoice = useCallback((order: Order) => {
    const items =
      order.rawItems.length > 0
        ? order.rawItems.map(item => ({
            product: item.name || 'Unknown Product',
            size: item.size ?? 'N/A',
            unitPrice: `£${parseFloat(item.price || '0').toFixed(2)}`,
            quantity: item.quantity || 1,
          }))
        : [
            {
              product: order.product,
              size: 'N/A',
              unitPrice: order.amount,
              quantity: order.quantity,
            },
          ];

    const ok = openInvoiceForPrint({
      orderNumber: `#${order.id}`,
      customer: order.customer,
      email: order.email,
      date: order.date,
      shippingMethod: order.shipping,
      items,
      total: order.amount,
    });
    if (ok) toast.success('Invoice opened in print window');
    else toast.error('Could not open print window — check your popup blocker.');
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleConfirmDelete = useCallback(async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_number', orderToDelete);
      if (error) throw error;
      toast.success('Order deleted successfully');
      setOrderToDelete(null);
      void fetchOrders();
    } catch {
      toast.error('Failed to delete order');
    } finally {
      setDeleting(false);
    }
  }, [supabase, orderToDelete, fetchOrders]);

  // ── Pagination page numbers with ellipsis ──────────────────────────────
  const pageNumbers = useMemo<(number | '...')[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) pages.push('...');
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  const startRow = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, totalCount);

  // ── Render ─────────────────────────────────────────────────────────────
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
              Orders Management
            </h1>
            <p className='text-gray-600'>View and manage all customer orders</p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void fetchOrders()}
            disabled={loading}
            className='flex items-center gap-2 mt-1'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search by order ID, customer name, or email...'
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className='w-full md:w-[200px]'>
                <Filter className='w-4 h-4 mr-2' />
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='processing'>Payment Confirmed</SelectItem>
                <SelectItem value='shipped'>Dispatched</SelectItem>
                <SelectItem value='delivered'>Delivered</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  {[
                    'Order ID',
                    'Customer',
                    'Product',
                    'Quantity',
                    'Amount',
                    'Status',
                    'Date',
                    'Actions',
                  ].map(col => (
                    <th
                      key={col}
                      className='text-left px-6 py-4 text-sm text-gray-600 font-medium'
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className='py-16 text-center'>
                      <Loader2 className='w-6 h-6 animate-spin text-[#f63a9e] mx-auto' />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className='py-12 text-center text-gray-500'
                    >
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr
                      key={order.id}
                      className='border-b border-gray-100 last:border-0 hover:bg-gray-50'
                    >
                      <td className='px-6 py-4 text-sm font-medium'>
                        {order.id}
                      </td>
                      <td className='px-6 py-4'>
                        <p className='text-sm font-medium'>{order.customer}</p>
                        <p className='text-xs text-gray-500'>{order.email}</p>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {order.product}
                      </td>
                      <td className='px-6 py-4 text-sm'>{order.quantity}</td>
                      <td className='px-6 py-4 text-sm font-medium'>
                        {order.amount}
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {order.date}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={() =>
                              navigate(`/admin/orders/${order.id}`)
                            }
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            title='View Details'
                          >
                            <Eye className='w-4 h-4 text-gray-600' />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            title='Print Invoice'
                          >
                            <Printer className='w-4 h-4 text-gray-600' />
                          </button>
                          {import.meta.env.DEV && (
                            <button
                              onClick={() => setOrderToDelete(order.id)}
                              className='p-2 hover:bg-red-50 rounded-lg transition-colors'
                              title='Delete Order (Dev Only)'
                            >
                              <Trash2 className='w-4 h-4 text-red-500' />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination + Summary */}
        {!loading && totalCount > 0 && (
          <div className='mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600'>
            <p>
              Showing {startRow}–{endRow} of {totalCount} orders
            </p>

            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='h-8 w-8 p-0'
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>

              {pageNumbers.map((page, idx) =>
                page === '...' ? (
                  <span
                    key={`ellipsis-${idx < (pageNumbers.length / 2) ? 'left' : 'right'}`}
                    className='px-2 text-gray-400 select-none'
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(page as number)}
                    className={`h-8 w-8 p-0 ${
                      page === currentPage
                        ? 'bg-[#f63a9e] hover:bg-[#e02d8d] border-[#f63a9e] text-white'
                        : ''
                    }`}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentPage(p => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className='h-8 w-8 p-0'
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={open => !open && setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order{' '}
              <span className='font-semibold'>{orderToDelete}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

