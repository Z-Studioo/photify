import { type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Palette,
  Settings,
  LogOut,
  BarChart3,
  Users,
  Grid3x3,
  Home,
  Tag,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAdmin();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Palette, label: 'Art Collection', path: '/admin/art-collection' },
    { icon: Grid3x3, label: 'Categories', path: '/admin/categories' },
    { icon: Home, label: 'Rooms', path: '/admin/rooms' },
    { icon: Tag, label: 'Promotions', path: '/admin/promotions' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-['Mona_Sans',_sans-serif]">
      {/* Top Header */}
      <header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
        <div className='px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-[#f63a9e] rounded-full flex items-center justify-center'>
              <div className='w-3 h-3 bg-white rounded-full' />
            </div>
            <div>
              <h1
                className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e]"
                style={{ fontSize: '24px', fontWeight: '800' }}
              >
                Photify Admin
              </h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className='flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
          >
            <LogOut className='w-4 h-4' />
            <span className='text-sm'>Logout</span>
          </button>
        </div>
      </header>

      <div className='flex h-[calc(100vh-73px)]'>
        {/* Sidebar - Fixed */}
        <aside className='w-64 bg-white border-r border-gray-200 h-full overflow-y-auto flex-shrink-0'>
          <nav className='p-4 space-y-1'>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-pink-50 text-[#f63a9e]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className='w-5 h-5' />
                  <span className='font-medium'>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content - Scrollable */}
        <main className='flex-1 overflow-y-auto p-8 flex justify-center'>
          <div className='w-full max-w-[1600px]'>{children}</div>
        </main>
      </div>
    </div>
  );
}
