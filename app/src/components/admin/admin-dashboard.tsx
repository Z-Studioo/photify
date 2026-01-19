import { AdminLayout } from './admin-layout';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Revenue',
    value: '£24,563',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    label: 'Total Orders',
    value: '342',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Products Sold',
    value: '1,247',
    change: '+15.3%',
    trend: 'up',
    icon: Package,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    label: 'Conversion Rate',
    value: '3.24%',
    change: '-0.4%',
    trend: 'down',
    icon: TrendingUp,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
];

const recentOrders = [
  {
    id: 'ORD-1234',
    customer: 'John Smith',
    product: 'Ocean Dreams Canvas',
    amount: '£68.00',
    status: 'Processing',
    date: '2025-10-20',
  },
  {
    id: 'ORD-1235',
    customer: 'Sarah Johnson',
    product: 'Parallel Triplet',
    amount: '£69.00',
    status: 'Shipped',
    date: '2025-10-20',
  },
  {
    id: 'ORD-1236',
    customer: 'Mike Wilson',
    product: 'Wild Lion Print',
    amount: '£92.00',
    status: 'Delivered',
    date: '2025-10-19',
  },
  {
    id: 'ORD-1237',
    customer: 'Emma Davis',
    product: 'Divine Light',
    amount: '£88.00',
    status: 'Processing',
    date: '2025-10-19',
  },
  {
    id: 'ORD-1238',
    customer: 'Tom Brown',
    product: 'Himalayan Peaks',
    amount: '£105.00',
    status: 'Pending',
    date: '2025-10-18',
  },
];

const topProducts = [
  { name: 'Ocean Dreams', sales: 145, revenue: '£9,860' },
  { name: 'Wild Lion', sales: 128, revenue: '£11,776' },
  { name: 'Parallel Triplet', sales: 96, revenue: '£6,624' },
  { name: 'Divine Light', sales: 84, revenue: '£7,392' },
  { name: 'Himalayan Peaks', sales: 72, revenue: '£7,560' },
];

export function AdminDashboard() {
  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1
            className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
            style={{ fontSize: '32px', fontWeight: '600' }}
          >
            Dashboard Overview
          </h1>
          <p className='text-gray-600'>
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className='bg-white rounded-lg border border-gray-200 p-6'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div
                    className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUp className='w-4 h-4' />
                    ) : (
                      <ArrowDown className='w-4 h-4' />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className='text-gray-600 text-sm mb-1'>{stat.label}</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontSize: '28px', fontWeight: '600' }}
                >
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Recent Orders */}
          <div className='lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6'>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
              style={{ fontSize: '20px', fontWeight: '600' }}
            >
              Recent Orders
            </h2>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left pb-3 text-sm text-gray-600 font-medium'>
                      Order ID
                    </th>
                    <th className='text-left pb-3 text-sm text-gray-600 font-medium'>
                      Customer
                    </th>
                    <th className='text-left pb-3 text-sm text-gray-600 font-medium'>
                      Product
                    </th>
                    <th className='text-left pb-3 text-sm text-gray-600 font-medium'>
                      Amount
                    </th>
                    <th className='text-left pb-3 text-sm text-gray-600 font-medium'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr
                      key={order.id}
                      className='border-b border-gray-100 last:border-0'
                    >
                      <td className='py-4 text-sm font-medium'>{order.id}</td>
                      <td className='py-4 text-sm'>{order.customer}</td>
                      <td className='py-4 text-sm text-gray-600'>
                        {order.product}
                      </td>
                      <td className='py-4 text-sm font-medium'>
                        {order.amount}
                      </td>
                      <td className='py-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'Processing'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2
              className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
              style={{ fontSize: '20px', fontWeight: '600' }}
            >
              Top Products
            </h2>
            <div className='space-y-4'>
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-semibold text-[#f63a9e]'>
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className='text-sm font-medium'>{product.name}</p>
                      <p className='text-xs text-gray-600'>
                        {product.sales} sales
                      </p>
                    </div>
                  </div>
                  <p className='text-sm font-semibold'>{product.revenue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
