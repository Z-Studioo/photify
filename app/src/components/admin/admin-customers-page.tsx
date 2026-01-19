import { useState } from 'react';
import { AdminLayout } from './admin-layout';
import {
  Search,
  Filter,
  Download,
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

const customers = [
  {
    id: 'CUST-001',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+44 7700 900001',
    totalOrders: 12,
    totalSpent: '£842.00',
    lastOrder: '2025-10-20',
    status: 'Active',
    joined: '2024-03-15',
  },
  {
    id: 'CUST-002',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+44 7700 900002',
    totalOrders: 8,
    totalSpent: '£624.00',
    lastOrder: '2025-10-18',
    status: 'Active',
    joined: '2024-05-22',
  },
  {
    id: 'CUST-003',
    name: 'Mike Wilson',
    email: 'mike@example.com',
    phone: '+44 7700 900003',
    totalOrders: 15,
    totalSpent: '£1,245.00',
    lastOrder: '2025-10-19',
    status: 'VIP',
    joined: '2024-01-08',
  },
  {
    id: 'CUST-004',
    name: 'Emma Davis',
    email: 'emma@example.com',
    phone: '+44 7700 900004',
    totalOrders: 5,
    totalSpent: '£380.00',
    lastOrder: '2025-10-15',
    status: 'Active',
    joined: '2024-08-12',
  },
  {
    id: 'CUST-005',
    name: 'Tom Brown',
    email: 'tom@example.com',
    phone: '+44 7700 900005',
    totalOrders: 2,
    totalSpent: '£156.00',
    lastOrder: '2025-09-28',
    status: 'New',
    joined: '2024-09-15',
  },
];

const orderHistory = [
  {
    orderId: 'ORD-1234',
    date: '2025-10-20',
    amount: '£68.00',
    status: 'Delivered',
  },
  {
    orderId: 'ORD-1198',
    date: '2025-10-05',
    amount: '£92.00',
    status: 'Delivered',
  },
  {
    orderId: 'ORD-1156',
    date: '2025-09-22',
    amount: '£115.00',
    status: 'Delivered',
  },
  {
    orderId: 'ORD-1089',
    date: '2025-09-08',
    amount: '£84.00',
    status: 'Delivered',
  },
];

export function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<
    (typeof customers)[0] | null
  >(null);

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

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
            style={{ fontSize: '32px', fontWeight: '600' }}
          >
            Customer Management
          </h1>
          <p className='text-gray-600'>
            View and manage customer information and history
          </p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Total Customers</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              2,847
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>VIP Customers</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              142
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>New This Month</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              87
            </p>
          </div>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <p className='text-sm text-gray-600 mb-1'>Avg. Order Value</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              £73.95
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
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

            <Button variant='outline' className='gap-2'>
              <Download className='w-4 h-4' />
              Export
            </Button>
          </div>
        </div>

        {/* Customers Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Customer
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Contact
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Orders
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Total Spent
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Last Order
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Status
                  </th>
                  <th className='text-left px-6 py-4 text-sm text-gray-600 font-medium'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr
                    key={customer.id}
                    className='border-b border-gray-100 last:border-0 hover:bg-gray-50'
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <p className='text-sm font-medium'>{customer.name}</p>
                        <p className='text-xs text-gray-600'>{customer.id}</p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='text-sm'>{customer.email}</p>
                        <p className='text-xs text-gray-600'>
                          {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm'>
                      {customer.totalOrders}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-[#f63a9e]'>
                      {customer.totalSpent}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {customer.lastOrder}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
        </div>

        {/* Customer Detail Modal */}
        <Dialog
          open={!!selectedCustomer}
          onOpenChange={() => setSelectedCustomer(null)}
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto font-['Mona_Sans',_sans-serif]">
            <DialogHeader>
              <DialogTitle
                className="font-['Bricolage_Grotesque',_sans-serif]"
                style={{ fontSize: '24px', fontWeight: '600' }}
              >
                Customer Details
              </DialogTitle>
            </DialogHeader>

            {selectedCustomer && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-4'>
                {/* Customer Info */}
                <div className='space-y-4'>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <h3 className='font-semibold mb-3'>Customer Information</h3>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Name:</span>
                        <span className='font-medium'>
                          {selectedCustomer.name}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Email:</span>
                        <span>{selectedCustomer.email}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Phone:</span>
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Customer ID:</span>
                        <span>{selectedCustomer.id}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Joined:</span>
                        <span>{selectedCustomer.joined}</span>
                      </div>
                    </div>
                  </div>

                  <div className='bg-gray-50 rounded-lg p-4'>
                    <h3 className='font-semibold mb-3'>Statistics</h3>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Total Orders:</span>
                        <span className='font-medium'>
                          {selectedCustomer.totalOrders}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Total Spent:</span>
                        <span className='font-medium text-[#f63a9e]'>
                          {selectedCustomer.totalSpent}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Avg. Order:</span>
                        <span className='font-medium'>£70.17</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Status:</span>
                        <span
                          className={`font-medium ${
                            selectedCustomer.status === 'VIP'
                              ? 'text-purple-600'
                              : 'text-green-600'
                          }`}
                        >
                          {selectedCustomer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order History */}
                <div>
                  <h3 className='font-semibold mb-3'>Order History</h3>
                  <div className='space-y-2'>
                    {orderHistory.map(order => (
                      <div
                        key={order.orderId}
                        className='bg-gray-50 rounded-lg p-3'
                      >
                        <div className='flex justify-between items-start mb-1'>
                          <span className='text-sm font-medium'>
                            {order.orderId}
                          </span>
                          <span className='text-sm font-medium text-[#f63a9e]'>
                            {order.amount}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-xs text-gray-600'>
                            {order.date}
                          </span>
                          <span className='text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full'>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
