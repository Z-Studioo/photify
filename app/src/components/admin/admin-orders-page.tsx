import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { Search, Filter, Download, Eye, Printer, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setDbOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Map database status to display status
  const getDisplayStatus = (dbStatus: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Dispatched',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return statusMap[dbStatus?.toLowerCase()] || 'Pending';
  };

  // Transform database orders to display format
  const orders = dbOrders.map(order => ({
    id: order.order_number,
    customer: order.customer_name,
    email: order.customer_email,
    product: order.items?.[0]?.name || 'Multiple Items',
    quantity:
      order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) ||
      0,
    amount: `£${parseFloat(order.total).toFixed(2)}`,
    status: getDisplayStatus(order.status),
    date: new Date(order.created_at).toLocaleDateString('en-GB'),
    shipping: 'Standard Delivery',
  }));

  const mockOrders = [
    {
      id: 'ORD-1234',
      customer: 'John Smith',
      email: 'john@example.com',
      product: 'Ocean Dreams Canvas',
      quantity: 1,
      amount: '£68.00',
      status: 'Processing',
      date: '2025-10-20',
      shipping: 'Standard Delivery',
    },
    {
      id: 'ORD-1235',
      customer: 'Sarah Johnson',
      email: 'sarah@example.com',
      product: 'Parallel Triplet',
      quantity: 1,
      amount: '£69.00',
      status: 'Dispatched',
      date: '2025-10-20',
      shipping: 'Express Delivery',
    },
    {
      id: 'ORD-1236',
      customer: 'Mike Wilson',
      email: 'mike@example.com',
      product: 'Wild Lion Print',
      quantity: 2,
      amount: '£184.00',
      status: 'Delivered',
      date: '2025-10-19',
      shipping: 'Standard Delivery',
    },
    {
      id: 'ORD-1237',
      customer: 'Emma Davis',
      email: 'emma@example.com',
      product: 'Divine Light',
      quantity: 1,
      amount: '£88.00',
      status: 'Processing',
      date: '2025-10-19',
      shipping: 'Standard Delivery',
    },
    {
      id: 'ORD-1238',
      customer: 'Tom Brown',
      email: 'tom@example.com',
      product: 'Himalayan Peaks',
      quantity: 1,
      amount: '£105.00',
      status: 'Pending',
      date: '2025-10-18',
      shipping: 'Express Delivery',
    },
    {
      id: 'ORD-1239',
      customer: 'Lisa Anderson',
      email: 'lisa@example.com',
      product: 'Color Burst',
      quantity: 3,
      amount: '£168.00',
      status: 'Shipped',
      date: '2025-10-18',
      shipping: 'Standard Delivery',
    },
    {
      id: 'ORD-1240',
      customer: 'David Lee',
      email: 'david@example.com',
      product: 'Sunset Waves',
      quantity: 1,
      amount: '£82.00',
      status: 'Delivered',
      date: '2025-10-17',
      shipping: 'Express Delivery',
    },
    {
      id: 'ORD-1241',
      customer: 'Amy White',
      email: 'amy@example.com',
      product: 'Timeless Quartet',
      quantity: 1,
      amount: '£106.00',
      status: 'Processing',
      date: '2025-10-17',
      shipping: 'Standard Delivery',
    },
  ];

  const filteredOrders = (orders.length > 0 ? orders : mockOrders).filter(
    order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        order.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    }
  );

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
        <div className='mb-8'>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
            style={{ fontSize: '32px', fontWeight: '600' }}
          >
            Orders Management
          </h1>
          <p className='text-gray-600'>View and manage all customer orders</p>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search by order ID, customer name, or email...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full md:w-[200px]'>
                <Filter className='w-4 h-4 mr-2' />
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='processing'>Processing</SelectItem>
                <SelectItem value='shipped'>Dispatched</SelectItem>
                <SelectItem value='delivered'>Delivered</SelectItem>
              </SelectContent>
            </Select>

            <Button variant='outline' className='gap-2'>
              <Download className='w-4 h-4' />
              Export
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Order ID
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Customer
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Product
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Quantity
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Amount
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Status
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Date
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    className='border-b border-gray-100 last:border-0 hover:bg-gray-50'
                  >
                    <td className='px-6 py-4 text-sm font-medium'>
                      {order.id}
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='text-sm font-medium'>{order.customer}</p>
                        <p className='text-xs text-gray-600'>{order.email}</p>
                      </div>
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
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'Processing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {order.date}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
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
                          className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                          title='Print Invoice'
                        >
                          <Printer className='w-4 h-4 text-gray-600' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-gray-500'>
                No orders found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className='mt-6 flex justify-between items-center text-sm text-gray-600'>
          <p>
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <p>
            Total Revenue: £
            {orders
              .reduce(
                (sum, order) => sum + parseFloat(order.amount.replace('£', '')),
                0
              )
              .toFixed(2)}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
