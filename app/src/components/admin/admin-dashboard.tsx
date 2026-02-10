import { useEffect, useState } from 'react';
import { AdminLayout } from './admin-layout';
import {
  // TrendingUp,
  ShoppingCart,
  // Package,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Calendar,
  Minus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

type RecentOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
  date: string;
};

type StatsSnapshot = {
  currentRevenue: number;
  previousRevenue: number;
  currentOrders: number;
  previousOrders: number;
};

type DateRangeKey = '7days' | '30days' | '90days' | 'year' | 'all';

const getChange = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) {
      return { changeText: '0.0%', trend: 'neutral' };
    }
    return { changeText: '', trend: 'neutral' };
  }

  const delta = ((current - previous) / previous) * 100;
  return {
    changeText: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
    trend: delta >= 0 ? 'up' : 'down',
  };
};

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState<DateRangeKey>('30days');
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statsSnapshot, setStatsSnapshot] = useState<StatsSnapshot>({
    currentRevenue: 0,
    previousRevenue: 0,
    currentOrders: 0,
    previousOrders: 0,
  });

  const getDateRange = (range: DateRangeKey) => {
    const now = new Date();
    if (range === 'all') {
      return { now, startCurrent: null, startPrevious: null, isAllTime: true };
    }
    const startCurrent = new Date(now);
    const startPrevious = new Date(now);

    switch (range) {
      case '7days':
        startCurrent.setDate(now.getDate() - 7);
        startPrevious.setDate(now.getDate() - 14);
        break;
      case '90days':
        startCurrent.setDate(now.getDate() - 90);
        startPrevious.setDate(now.getDate() - 180);
        break;
      case 'year':
        startCurrent.setFullYear(now.getFullYear() - 1);
        startPrevious.setFullYear(now.getFullYear() - 2);
        break;
      case '30days':
      default:
        startCurrent.setDate(now.getDate() - 30);
        startPrevious.setDate(now.getDate() - 60);
        break;
    }

    return { now, startCurrent, startPrevious, isAllTime: false };
  };

  useEffect(() => {
    const fetchRecentOrders = async () => {
      setOrdersLoading(true);
      try {
        const supabase = createClient();
        const { now, startCurrent, isAllTime } = getDateRange(dateRange);
        let query = supabase
          .from('orders')
          .select(
            'id, order_number, customer_name, items, total, status, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(10);
        if (!isAllTime && startCurrent) {
          query = query
            .gte('created_at', startCurrent.toISOString())
            .lt('created_at', now.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        const mapped: RecentOrder[] = (data || []).map(order => {
          const total = Number(order.total);
          return {
            id: order.id,
            orderNumber: order.order_number,
            customer: order.customer_name || 'Unknown',
            product: order.items?.[0]?.name,
            amount: Number.isFinite(total) ? `£${total.toFixed(2)}` : '£0.00',
            status:
              order.status?.charAt(0).toUpperCase() + order.status?.slice(1) ||
              'Pending',
            date: order.created_at,
          };
        });

        if (mapped.length > 0) {
          setRecentOrders(mapped);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchRecentOrders();
  }, []);
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const supabase = createClient();
        const { now, startCurrent, startPrevious, isAllTime } =
          getDateRange(dateRange);

        let query = supabase.from('orders').select('created_at, total');
        if (!isAllTime && startPrevious) {
          query = query
            .gte('created_at', startPrevious.toISOString())
            .lt('created_at', now.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        let currentRevenue = 0;
        let previousRevenue = 0;
        let currentOrders = 0;
        let previousOrders = 0;

        (data || []).forEach(order => {
          if (!order?.created_at) return;
          const createdAt = new Date(order.created_at);
          const total = Number(order.total || 0);

          if (isAllTime || (startCurrent && createdAt >= startCurrent)) {
            currentRevenue += total;
            currentOrders += 1;
          } else {
            previousRevenue += total;
            previousOrders += 1;
          }
        });

        setStatsSnapshot({
          currentRevenue,
          previousRevenue,
          currentOrders,
          previousOrders,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [dateRange]);

  const revenueChange = getChange(
    statsSnapshot.currentRevenue,
    statsSnapshot.previousRevenue
  );
  const ordersChange = getChange(
    statsSnapshot.currentOrders,
    statsSnapshot.previousOrders
  );
  const stats = [
    {
      label: 'Total Revenue',
      value: `£${statsSnapshot.currentRevenue.toLocaleString()}`,
      change: revenueChange.changeText,
      trend: revenueChange.trend,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Total Orders',
      value: `${statsSnapshot.currentOrders}`,
      change: ordersChange.changeText,
      trend: ordersChange.trend,
      icon: ShoppingCart,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    // {
    //   label: 'Products Sold',
    //   value: '1,247',
    //   change: '+15.3%',
    //   trend: 'up',
    //   icon: Package,
    //   bgColor: 'bg-purple-50',
    //   iconColor: 'text-purple-600',
    // },
    // {
    //   label: 'Conversion Rate',
    //   value: '3.24%',
    //   change: '-0.4%',
    //   trend: 'down',
    //   icon: TrendingUp,
    //   bgColor: 'bg-orange-50',
    //   iconColor: 'text-orange-600',
    // },
  ];

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 flex justify-between'>
          <div>
            <h1
              className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
              style={{ fontSize: '32px', fontWeight: '600' }}
            >
              Dashboard Overview
            </h1>
            <p className='text-gray-600'>
              Welcome back! Here&apos;s what&apos;s happening with your store
              today.
            </p>
          </div>

          <Select
            value={dateRange}
            onValueChange={value => setDateRange(value as DateRangeKey)}
          >
            <SelectTrigger className='w-[180px]'>
              <Calendar className='w-4 h-4 mr-2' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7days'>Last 7 days</SelectItem>
              <SelectItem value='30days'>Last 30 days</SelectItem>
              <SelectItem value='90days'>Last 90 days</SelectItem>
              <SelectItem value='year'>This year</SelectItem>
              <SelectItem value='all'>All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {stats.map(stat => {
            const isAllTime = dateRange === 'all';
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
                  {!isAllTime && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.trend === 'up'
                          ? 'text-green-600'
                          : stat.trend === 'down'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {statsLoading ? (
                        <span className='bg-gray-50 rounded-sm border border-gray-200 h-5 w-20 animate-pulse ' />
                      ) : (
                        <>
                          {stat.trend === 'up' ? (
                            <ArrowUp className='w-4 h-4' />
                          ) : stat.trend === 'down' ? (
                            <ArrowDown className='w-4 h-4' />
                          ) : (
                            <Minus className='w-4 h-4' />
                          )}
                          <span>{stat.change}</span>
                        </>
                      )}
                    </div>
                  )}
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
          <div className='lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Recent Orders
              </h2>
              <Button
                variant='default'
                size='sm'
                disabled={recentOrders.length === 0}
                className='cursor-pointer'
              >
                <Link to='/admin/orders' className='flex items-center gap-1'>
                  View All
                </Link>
              </Button>
            </div>
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
                    <th className='text-left pb-3 text-sm text-gray-600 font-medium'>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className='py-6 text-center text-sm text-gray-500'
                      >
                        Loading orders...
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map(order => (
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
                        <td className='py-4 text-sm text-gray-600'>
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          {/* <div className='bg-white rounded-lg border border-gray-200 p-6'>
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
          </div> */}
        </div>
      </div>
    </AdminLayout>
  );
}
