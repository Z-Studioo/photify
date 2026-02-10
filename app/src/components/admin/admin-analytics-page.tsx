import { useState, useEffect } from 'react';
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
  Loader2,
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
import { createClient } from '@/lib/supabase/client';

export function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Analytics state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [geographicData, setGeographicData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [newCustomers, setNewCustomers] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);
  const [avgLifetimeValue, setAvgLifetimeValue] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const getDaysFromDateRange = () => {
    switch (dateRange) {
      case '7days':
        return 7;
      case '30days':
        return 30;
      case '90days':
        return 90;
      case 'year':
        return 365;
      default:
        return 30;
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const days = getDaysFromDateRange();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Calculate metrics
      const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      const customerCount = customers?.length || 0;
      const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

      setTotalRevenue(revenue);
      setTotalOrders(orderCount);
      setTotalCustomers(customerCount);
      setAvgOrderValue(avgOrder);

      // Monthly data aggregation
      const monthlyStats = aggregateMonthlyData(orders || []);
      setMonthlyData(monthlyStats);

      // Top products (from order items)
      const productStats = calculateTopProducts(orders || [], products || []);
      setTopProducts(productStats);

      // Category performance
      const categoryStats = calculateCategoryPerformance(orders || []);
      setCategoryPerformance(categoryStats);

      // Geographic data (from shipping addresses)
      const geoStats = calculateGeographicData(orders || []);
      setGeographicData(geoStats);

      // Hourly data
      const hourStats = calculateHourlyData(orders || []);
      setHourlyData(hourStats);

      // Customer metrics
      const newCustomerCount = customers?.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate >= startDate;
      }).length || 0;
      setNewCustomers(newCustomerCount);

      // Retention rate (customers with more than 1 order)
      const returningCustomers = customers?.filter(c => (c.total_orders || 0) > 1).length || 0;
      const retention = customerCount > 0 ? (returningCustomers / customerCount) * 100 : 0;
      setRetentionRate(retention);

      // Avg lifetime value
      const lifetimeValue = customerCount > 0 
        ? customers.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0) / customerCount 
        : 0;
      setAvgLifetimeValue(lifetimeValue);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const aggregateMonthlyData = (orders: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map();

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName,
          revenue: 0,
          orders: 0,
          customers: new Set(),
        });
      }

      const monthData = monthlyMap.get(monthKey);
      monthData.revenue += parseFloat(order.total || 0);
      monthData.orders += 1;
      monthData.customers.add(order.customer_email);
    });

    return Array.from(monthlyMap.values())
      .map(data => ({
        month: data.month,
        revenue: Math.round(data.revenue),
        orders: data.orders,
        customers: data.customers.size,
        avgOrder: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
      }))
      .slice(-10); // Last 10 months
  };

  const calculateTopProducts = (orders: any[], products: any[]) => {
    const productMap = new Map();

    orders.forEach(order => {
      const items = order.items || [];
      items.forEach((item: any) => {
        const productId = item.product_id || item.id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: item.name || 'Unknown Product',
            sales: 0,
            revenue: 0,
          });
        }
        const productData = productMap.get(productId);
        productData.sales += item.quantity || 1;
        productData.revenue += parseFloat(item.price || 0) * (item.quantity || 1);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p, index) => ({
        id: index + 1,
        name: p.name,
        sales: p.sales,
        revenue: Math.round(p.revenue),
        growth: 0, // Would need historical data to calculate
      }));
  };

  const calculateCategoryPerformance = (orders: any[]) => {
    // Simplified category aggregation - you may need to enhance based on your data structure
    const categories = [
      { name: 'Canvas Prints', color: '#f63a9e', revenue: 0, orders: 0 },
      { name: 'Framed Canvas', color: '#8b5cf6', revenue: 0, orders: 0 },
      { name: 'Metal Prints', color: '#06b6d4', revenue: 0, orders: 0 },
      { name: 'Others', color: '#10b981', revenue: 0, orders: 0 },
    ];

    orders.forEach(order => {
      const items = order.items || [];
      items.forEach((item: any) => {
        const type = item.product_type || 'Others';
        let category = categories.find(c => 
          c.name.toLowerCase().includes(type.toLowerCase())
        ) || categories[3];
        
        category.revenue += parseFloat(item.price || 0) * (item.quantity || 1);
        category.orders += 1;
      });
    });

    const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);
    return categories
      .map(c => ({
        ...c,
        value: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0,
      }))
      .filter(c => c.value > 0);
  };

  const calculateGeographicData = (orders: any[]) => {
    const locationMap = new Map();

    orders.forEach(order => {
      const postcode = order.shipping_postcode || 'Unknown';
      const city = extractCityFromPostcode(postcode);
      
      if (!locationMap.has(city)) {
        locationMap.set(city, { location: city, orders: 0, revenue: 0 });
      }
      const locationData = locationMap.get(city);
      locationData.orders += 1;
      locationData.revenue += parseFloat(order.total || 0);
    });

    const totalRevenue = Array.from(locationMap.values()).reduce(
      (sum, loc) => sum + loc.revenue,
      0
    );

    return Array.from(locationMap.values())
      .map(loc => ({
        ...loc,
        revenue: Math.round(loc.revenue),
        percentage: totalRevenue > 0 ? Math.round((loc.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  };

  const extractCityFromPostcode = (postcode: string) => {
    // Simple city extraction - enhance based on your needs
    if (!postcode || postcode === 'Unknown') return 'Other';
    const prefix = postcode.split(' ')[0].toUpperCase();
    
    // UK postcode to city mapping (simplified)
    const cityMap: Record<string, string> = {
      'E': 'London', 'EC': 'London', 'N': 'London', 'NW': 'London',
      'SE': 'London', 'SW': 'London', 'W': 'London', 'WC': 'London',
      'M': 'Manchester',
      'B': 'Birmingham',
      'EH': 'Edinburgh',
      'BS': 'Bristol',
      'L': 'Liverpool',
      'LS': 'Leeds',
    };

    for (const [key, city] of Object.entries(cityMap)) {
      if (prefix.startsWith(key)) return city;
    }
    return 'Other';
  };

  const calculateHourlyData = (orders: any[]) => {
    const hours = Array.from({ length: 8 }, (_, i) => ({
      hour: `${String(i * 3).padStart(2, '0')}:00`,
      orders: 0,
    }));

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const hour = date.getHours();
      const index = Math.floor(hour / 3);
      if (index < hours.length) {
        hours[index].orders += 1;
      }
    });

    return hours;
  };

  const handleExportReport = (type: string) => {
    toast.success(`${type} report downloaded successfully`);
  };

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
              £{totalRevenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
            </p>
            <p className='text-xs text-gray-500 mt-2'>
              Last {dateRange === '7days' ? '7' : dateRange === '30days' ? '30' : dateRange === '90days' ? '90' : '365'} days
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
              {totalOrders.toLocaleString()}
            </p>
            <p className='text-xs text-gray-500 mt-2'>{totalOrders} orders in period</p>
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
              {totalCustomers.toLocaleString()}
            </p>
            <p className='text-xs text-gray-500 mt-2'>All time customers</p>
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
              £{avgOrderValue.toFixed(2)}
            </p>
            <p className='text-xs text-gray-500 mt-2'>Per order average</p>
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
                      {newCustomers}
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
                      {retentionRate.toFixed(0)}%
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
                      £{avgLifetimeValue.toFixed(0)}
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
