import { useState } from 'react';
import { AdminLayout } from './admin-layout';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Calendar,
  Package,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { toast } from 'sonner';

const monthlyData = [
  {
    month: 'Jan',
    revenue: 18500,
    orders: 245,
    customers: 198,
    avgOrder: 75.51,
  },
  {
    month: 'Feb',
    revenue: 22300,
    orders: 298,
    customers: 234,
    avgOrder: 74.83,
  },
  {
    month: 'Mar',
    revenue: 19800,
    orders: 267,
    customers: 221,
    avgOrder: 74.16,
  },
  {
    month: 'Apr',
    revenue: 25600,
    orders: 342,
    customers: 289,
    avgOrder: 74.85,
  },
  {
    month: 'May',
    revenue: 28900,
    orders: 389,
    customers: 312,
    avgOrder: 74.29,
  },
  {
    month: 'Jun',
    revenue: 31200,
    orders: 425,
    customers: 356,
    avgOrder: 73.41,
  },
  {
    month: 'Jul',
    revenue: 29500,
    orders: 398,
    customers: 334,
    avgOrder: 74.12,
  },
  {
    month: 'Aug',
    revenue: 33800,
    orders: 456,
    customers: 387,
    avgOrder: 74.12,
  },
  {
    month: 'Sep',
    revenue: 36200,
    orders: 487,
    customers: 412,
    avgOrder: 74.33,
  },
  {
    month: 'Oct',
    revenue: 24563,
    orders: 342,
    customers: 298,
    avgOrder: 71.82,
  },
];

const categoryPerformance = [
  {
    name: 'Custom Frames',
    value: 35,
    revenue: 48250,
    orders: 645,
    color: '#f63a9e',
  },
  {
    name: 'Canvas Prints',
    value: 28,
    revenue: 38420,
    orders: 512,
    color: '#8b5cf6',
  },
  {
    name: 'Art Collection',
    value: 21,
    revenue: 29180,
    orders: 387,
    color: '#06b6d4',
  },
  {
    name: 'Photo Prints',
    value: 16,
    revenue: 22150,
    orders: 298,
    color: '#10b981',
  },
];

const topProducts = [
  {
    id: 1,
    name: 'Ocean Dreams Canvas',
    sales: 145,
    revenue: 5800,
    growth: 12.5,
  },
  { id: 2, name: 'Wild Lion Print', sales: 132, revenue: 4620, growth: 8.3 },
  { id: 3, name: 'Buddha Serenity', sales: 128, revenue: 5120, growth: -2.1 },
  { id: 4, name: 'Abstract Waves', sales: 114, revenue: 3990, growth: 15.7 },
  { id: 5, name: 'Mountain Vista', sales: 98, revenue: 3430, growth: 6.2 },
];

const geographicData = [
  { location: 'London', orders: 1245, revenue: 92840, percentage: 32 },
  { location: 'Manchester', orders: 687, revenue: 51225, percentage: 18 },
  { location: 'Birmingham', orders: 534, revenue: 39780, percentage: 14 },
  { location: 'Edinburgh', orders: 423, revenue: 31545, percentage: 11 },
  { location: 'Bristol', orders: 389, revenue: 28995, percentage: 10 },
  { location: 'Other', orders: 571, revenue: 40315, percentage: 15 },
];

const hourlyData = [
  { hour: '00:00', orders: 12 },
  { hour: '03:00', orders: 8 },
  { hour: '06:00', orders: 15 },
  { hour: '09:00', orders: 45 },
  { hour: '12:00', orders: 67 },
  { hour: '15:00', orders: 82 },
  { hour: '18:00', orders: 95 },
  { hour: '21:00', orders: 58 },
];

export function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  const handleExportReport = (type: string) => {
    toast.success(`${type} report downloaded successfully`);
  };

  return (
    <AdminLayout>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-start justify-between mb-4'>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] mb-2"
                style={{ fontSize: '32px', fontWeight: '600' }}
              >
                Analytics & Reports
              </h1>
              <p className='text-gray-600'>
                Track your business performance and insights
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className='w-[180px]'>
                  <Calendar className='w-4 h-4 mr-2' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='7days'>Last 7 days</SelectItem>
                  <SelectItem value='30days'>Last 30 days</SelectItem>
                  <SelectItem value='90days'>Last 90 days</SelectItem>
                  <SelectItem value='year'>This year</SelectItem>
                  <SelectItem value='custom'>Custom range</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                className='gap-2'
                onClick={() => handleExportReport('Full')}
              >
                <Download className='w-4 h-4' />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-green-600' />
              </div>
              <div className='flex items-center gap-1 text-green-600 text-sm'>
                <ArrowUpRight className='w-4 h-4' />
                <span>18.2%</span>
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-1'>Total Revenue</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              £284,700
            </p>
            <p className='text-xs text-gray-500 mt-2'>
              vs. £241,300 last period
            </p>
          </div>

          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center'>
                <ShoppingCart className='w-6 h-6 text-blue-600' />
              </div>
              <div className='flex items-center gap-1 text-blue-600 text-sm'>
                <ArrowUpRight className='w-4 h-4' />
                <span>12.5%</span>
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-1'>Total Orders</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              3,849
            </p>
            <p className='text-xs text-gray-500 mt-2'>vs. 3,421 last period</p>
          </div>

          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center'>
                <Users className='w-6 h-6 text-purple-600' />
              </div>
              <div className='flex items-center gap-1 text-purple-600 text-sm'>
                <ArrowUpRight className='w-4 h-4' />
                <span>24.8%</span>
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-1'>Total Customers</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              2,847
            </p>
            <p className='text-xs text-gray-500 mt-2'>vs. 2,281 last period</p>
          </div>

          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-orange-600' />
              </div>
              <div className='flex items-center gap-1 text-orange-600 text-sm'>
                <ArrowUpRight className='w-4 h-4' />
                <span>5.2%</span>
              </div>
            </div>
            <p className='text-sm text-gray-600 mb-1'>Avg Order Value</p>
            <p
              className="font-['Bricolage_Grotesque',_sans-serif]"
              style={{ fontSize: '28px', fontWeight: '600' }}
            >
              £73.95
            </p>
            <p className='text-xs text-gray-500 mt-2'>vs. £70.29 last period</p>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-4 lg:w-auto lg:inline-grid'>
            <TabsTrigger value='overview' className='gap-2'>
              <BarChart3 className='w-4 h-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='sales' className='gap-2'>
              <TrendingUp className='w-4 h-4' />
              Sales
            </TabsTrigger>
            <TabsTrigger value='products' className='gap-2'>
              <Package className='w-4 h-4' />
              Products
            </TabsTrigger>
            <TabsTrigger value='customers' className='gap-2'>
              <Users className='w-4 h-4' />
              Customers
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Revenue Trend Chart */}
              <div className='lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif]"
                    style={{ fontSize: '20px', fontWeight: '600' }}
                  >
                    Revenue & Orders Trend
                  </h2>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleExportReport('Revenue Trend')}
                  >
                    <Download className='w-4 h-4' />
                  </Button>
                </div>
                <ResponsiveContainer width='100%' height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient
                        id='colorRevenue'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='5%'
                          stopColor='#f63a9e'
                          stopOpacity={0.3}
                        />
                        <stop
                          offset='95%'
                          stopColor='#f63a9e'
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis dataKey='month' stroke='#888' fontSize={12} />
                    <YAxis stroke='#888' fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      stroke='#f63a9e'
                      strokeWidth={2}
                      fillOpacity={1}
                      fill='url(#colorRevenue)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Category Distribution */}
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif]"
                    style={{ fontSize: '20px', fontWeight: '600' }}
                  >
                    Category Split
                  </h2>
                  <PieChartIcon className='w-5 h-5 text-gray-400' />
                </div>
                <ResponsiveContainer width='100%' height={200}>
                  <PieChart>
                    <Pie
                      data={categoryPerformance}
                      cx='50%'
                      cy='50%'
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey='value'
                    >
                      {categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-4 space-y-2'>
                  {categoryPerformance.map(cat => (
                    <div
                      key={cat.name}
                      className='flex items-center justify-between text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className='text-gray-700'>{cat.name}</span>
                      </div>
                      <span className='font-medium'>{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Geographic Performance */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2
                  className="font-['Bricolage_Grotesque',_sans-serif]"
                  style={{ fontSize: '20px', fontWeight: '600' }}
                >
                  Sales by Location
                </h2>
                <MapPin className='w-5 h-5 text-gray-400' />
              </div>
              <div className='space-y-4'>
                {geographicData.map(location => (
                  <div key={location.location}>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-3'>
                        <MapPin className='w-4 h-4 text-gray-400' />
                        <span className='text-sm font-medium'>
                          {location.location}
                        </span>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-medium'>
                          £{location.revenue.toLocaleString()}
                        </p>
                        <p className='text-xs text-gray-600'>
                          {location.orders} orders
                        </p>
                      </div>
                    </div>
                    <div className='w-full bg-gray-100 rounded-full h-2'>
                      <div
                        className='bg-[#f63a9e] h-2 rounded-full transition-all'
                        style={{ width: `${location.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value='sales' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Sales by Time */}
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif]"
                    style={{ fontSize: '20px', fontWeight: '600' }}
                  >
                    Orders by Time of Day
                  </h2>
                  <Clock className='w-5 h-5 text-gray-400' />
                </div>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis dataKey='hour' stroke='#888' fontSize={12} />
                    <YAxis stroke='#888' fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey='orders'
                      fill='#f63a9e'
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Comparison */}
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif]"
                    style={{ fontSize: '20px', fontWeight: '600' }}
                  >
                    Monthly Comparison
                  </h2>
                  <TrendingUp className='w-5 h-5 text-gray-400' />
                </div>
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                    <XAxis dataKey='month' stroke='#888' fontSize={12} />
                    <YAxis stroke='#888' fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='revenue'
                      stroke='#f63a9e'
                      strokeWidth={2}
                      name='Revenue (£)'
                    />
                    <Line
                      type='monotone'
                      dataKey='orders'
                      stroke='#8b5cf6'
                      strokeWidth={2}
                      name='Orders'
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-100 p-6'>
                <p className='text-sm text-gray-600 mb-2'>Peak Sales Day</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  Saturday
                </p>
                <p className='text-sm text-gray-600'>28% of weekly sales</p>
              </div>

              <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100 p-6'>
                <p className='text-sm text-gray-600 mb-2'>Peak Hour</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  6-9 PM
                </p>
                <p className='text-sm text-gray-600'>35% of daily orders</p>
              </div>

              <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100 p-6'>
                <p className='text-sm text-gray-600 mb-2'>Conversion Rate</p>
                <p
                  className="font-['Bricolage_Grotesque',_sans-serif] mb-1"
                  style={{ fontSize: '24px', fontWeight: '600' }}
                >
                  3.8%
                </p>
                <p className='text-sm text-gray-600'>From total visitors</p>
              </div>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value='products' className='space-y-6'>
            {/* Top Products */}
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                  <h2
                    className="font-['Bricolage_Grotesque',_sans-serif]"
                    style={{ fontSize: '20px', fontWeight: '600' }}
                  >
                    Top Selling Products
                  </h2>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleExportReport('Product Performance')}
                  >
                    <Download className='w-4 h-4' />
                  </Button>
                </div>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                        Rank
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                        Product
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                        Sales
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                        Revenue
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider'>
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {topProducts.map((product, index) => (
                      <tr key={product.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-medium text-sm'>
                            {index + 1}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <p className='text-sm font-medium text-gray-900'>
                            {product.name}
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <p className='text-sm text-gray-900'>
                            {product.sales} units
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <p className='text-sm font-medium text-gray-900'>
                            £{product.revenue.toLocaleString()}
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <div
                            className={`flex items-center gap-1 text-sm ${
                              product.growth >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {product.growth >= 0 ? (
                              <ArrowUpRight className='w-4 h-4' />
                            ) : (
                              <ArrowDownRight className='w-4 h-4' />
                            )}
                            <span>{Math.abs(product.growth)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Category Performance
              </h2>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis dataKey='name' stroke='#888' fontSize={12} />
                  <YAxis stroke='#888' fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey='revenue' fill='#f63a9e' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value='customers' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center'>
                    <Users className='w-6 h-6 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>New Customers</p>
                    <p
                      className="font-['Bricolage_Grotesque',_sans-serif]"
                      style={{ fontSize: '24px', fontWeight: '600' }}
                    >
                      912
                    </p>
                  </div>
                </div>
                <p className='text-xs text-purple-600'>+32% this month</p>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center'>
                    <TrendingUp className='w-6 h-6 text-green-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Retention Rate</p>
                    <p
                      className="font-['Bricolage_Grotesque',_sans-serif]"
                      style={{ fontSize: '24px', fontWeight: '600' }}
                    >
                      68%
                    </p>
                  </div>
                </div>
                <p className='text-xs text-green-600'>Returning customers</p>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center'>
                    <ShoppingCart className='w-6 h-6 text-blue-600' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Avg Lifetime Value</p>
                    <p
                      className="font-['Bricolage_Grotesque',_sans-serif]"
                      style={{ fontSize: '24px', fontWeight: '600' }}
                    >
                      £243
                    </p>
                  </div>
                </div>
                <p className='text-xs text-blue-600'>Per customer</p>
              </div>
            </div>

            {/* Customer Growth */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] mb-6"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Customer Growth
              </h2>
              <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient
                      id='colorCustomers'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis dataKey='month' stroke='#888' fontSize={12} />
                  <YAxis stroke='#888' fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type='monotone'
                    dataKey='customers'
                    stroke='#8b5cf6'
                    strokeWidth={2}
                    fillOpacity={1}
                    fill='url(#colorCustomers)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
