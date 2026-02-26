import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminLayout } from './admin-layout';
import {
  Search,
  Filter,
  // Download,
  Eye,
  Mail,
  MoreVertical,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface Order {
  order_number: string;
  status: string;
  amount: number;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  status: 'VIP' | 'Active' | 'New';
  joined: string;
  last_order_at: string | null;
  orders: Order[];
}

export const AdminCustomersPage = () => {
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('customers')
        .select(
          `
          id,
          name,
          email,
          phone,
          total_spent,
          created_at
          `
        )
        .order('created_at', { ascending: false });
        
        // orders (
        //   order_number,
        //   status,
        //   amount,
        //   created_at
        // )
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const mapped: Customer[] = data.map((c: any) => {
        const orders = [...(c.orders ?? [])].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          joined: c.created_at,
          orders,
          total_orders: orders.length,
          total_spent: Number(c.total_spent ?? 0),
          last_order_at: orders[0]?.created_at ?? null,
          status:
            orders.length >= 10 ? 'VIP' : orders.length > 0 ? 'Active' : 'New',
        };
      });

      setCustomers(mapped);
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      customer.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  const customerOrders = selectedCustomer?.orders ?? [];

  const avgOrder =
    customerOrders.length > 0
      ? customerOrders.reduce((sum, o) => sum + o.amount, 0) /
        customerOrders.length
      : 0;

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className="font-['Bricolage_Grotesque'] text-2xl font-semibold mb-2">
            Customer Management
          </h1>
          <p className='text-gray-600'>
            View and manage customer information and history
          </p>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border p-6 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search by name, email, or customer ID...'
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
                <SelectItem value='vip'>VIP</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='new'>New</SelectItem>
              </SelectContent>
            </Select>

            {/* <Button variant='outline' className='gap-2'>
              <Download className='w-4 h-4' />
              Export
            </Button> */}
          </div>
        </div>

        {/* Table */}
        <div className='bg-white rounded-lg border overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b'>
              <tr>
                {[
                  'Customer',
                  'Contact',
                  'Orders',
                  'Total Spent',
                  'Last Order',
                  'Status',
                  'Actions',
                ].map(h => (
                  <th
                    key={h}
                    className='px-6 py-4 text-left text-sm text-gray-600 font-medium'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className='border-b hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <p className='font-medium'>{customer.name}</p>
                    <p className='text-xs text-gray-500 truncate'>
                      {customer.id}
                    </p>
                  </td>
                  <td className='px-6 py-4'>
                    <p>{customer.email}</p>
                    <p className='text-xs text-gray-500'>{customer.phone}</p>
                  </td>
                  <td className='px-6 py-4'>{customer.total_orders}</td>
                  <td className='px-6 py-4 font-medium text-[#f63a9e]'>
                    £{customer.total_spent.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {customer.last_order_at
                      ? new Date(customer.last_order_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'VIP'
                          ? 'bg-purple-100 text-purple-700'
                          : customer.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='w-4 h-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye className='w-4 h-4 mr-2' />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className='w-4 h-4 mr-2' />
                          Send Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Dialog
          open={!!selectedCustomer}
          onOpenChange={() => setSelectedCustomer(null)}
        >
          <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>

            {selectedCustomer && (
              <div className='grid md:grid-cols-2 gap-6 mt-4'>
                {/* Info + Stats */}
                <div className='space-y-4'>
                  <div className='bg-gray-50 p-4 rounded'>
                    <h3 className='font-semibold mb-3'>Customer Information</h3>
                    <div className='text-sm space-y-2'>
                      <div className='flex justify-between'>
                        <span>Name</span>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      <div className='flex flex-col'>
                        <span>Email</span>
                        <span className='truncate'>
                          {selectedCustomer.email}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Phone</span>
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className='flex flex-col'>
                        <span>Customer ID</span>
                        <span className='truncate text-xs'>
                          {selectedCustomer.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='bg-gray-50 p-4 rounded'>
                    <h3 className='font-semibold mb-3'>Statistics</h3>
                    <div className='text-sm space-y-2'>
                      <div className='flex justify-between'>
                        <span>Total Orders</span>
                        <span className='font-medium'>
                          {selectedCustomer.total_orders}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Total Spent</span>
                        <span className='font-medium text-[#f63a9e]'>
                          £{selectedCustomer.total_spent.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Avg. Order</span>
                        <span className='font-medium'>
                          £{avgOrder.toFixed(2)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Status</span>
                        <span
                          className={`font-medium ${
                            selectedCustomer.status === 'VIP'
                              ? 'text-purple-600'
                              : selectedCustomer.status === 'Active'
                                ? 'text-green-600'
                                : 'text-blue-600'
                          }`}
                        >
                          {selectedCustomer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div>
                  <h3 className='font-semibold mb-3'>Order History</h3>
                  <div className='space-y-2'>
                    {customerOrders.length ? (
                      customerOrders.map(o => (
                        <div
                          key={o.order_number}
                          className='bg-gray-50 p-3 rounded'
                        >
                          <div className='flex justify-between mb-1'>
                            <span className='font-medium'>
                              {o.order_number}
                            </span>
                            <span className='font-medium text-[#f63a9e]'>
                              £{o.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className='flex justify-between text-xs'>
                            <span>
                              {new Date(o.created_at).toLocaleDateString()}
                            </span>
                            <span className='px-2 py-1 rounded-full bg-green-100 text-green-700'>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className='text-gray-500'>No orders found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
