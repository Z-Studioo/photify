'use client';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  Home,
  Package,
  Grid,
  Palette,
  Wand2,
  MapPin,
  Mail,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { SearchModal } from './search-modal';

export function Header() {
  const { cartItems } = useCart();
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Detect operating system - initialize to safe defaults to prevent hydration mismatch
  const [isMac, setIsMac] = useState(true); // Default to Mac (shows ⌘)
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Detect OS
    const userAgent = window.navigator.userAgent;
    const isMacOS = /Mac|iPhone|iPad|iPod/.test(userAgent);
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );

    setIsMac(isMacOS);
    setIsMobile(isMobileDevice);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'All Products', icon: Package },
    { href: '/category/gallery-walls', label: 'Browse Collection', icon: Grid },
    { href: '/art-collections', label: 'Art Collections', icon: Palette },
    { href: '/ai-tools', label: 'AI Tools', icon: Wand2 },
    { href: '/track-order', label: 'Track Order', icon: MapPin },
    { href: '/contact', label: 'Contact Us', icon: Mail },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b transition-all duration-300 ${
          isScrolled ? 'border-gray-200 shadow-lg' : 'border-gray-100 shadow-sm'
        }`}
      >
        <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16 sm:h-[72px]'>
            {/* Logo */}
            <Link to='/' className='flex items-center flex-shrink-0 group'>
              <motion.img
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                src='https://5fa4a340f8c967ae9d08053cb424cc05.cdn.bubble.io/f1742289951059x587038808958525700/Frame%2012.svg'
                alt='Photify'
                className='h-8 sm:h-10 w-auto transition-opacity group-hover:opacity-90'
              />
            </Link>

            {/* Search Button - Desktop/Tablet */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSearchModalOpen(true)}
              className='hidden sm:flex flex-1 max-w-2xl mx-6 lg:mx-16 h-12 items-center gap-3 px-5 bg-gray-50 border border-gray-200 rounded-full hover:bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 group'
            >
              <Search className='w-4.5 h-4.5 text-gray-400 group-hover:text-[#f63a9e] transition-colors' />
              <span className='text-sm text-gray-500 group-hover:text-gray-700 transition-colors'>
                Search for products...
              </span>
              {isMounted && !isMobile && (
                <div className='ml-auto flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 bg-white rounded-md border border-gray-200 font-medium shadow-sm'>
                  <span>{isMac ? '⌘K' : 'Ctrl+K'}</span>
                </div>
              )}
            </motion.button>

            {/* Actions */}
            <div className='flex items-center gap-1.5 sm:gap-2'>
              {/* Search Button - Mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchModalOpen(true)}
                className='sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors'
                aria-label='Search'
              >
                <Search className='w-5 h-5 text-gray-700' />
              </motion.button>

              {/* Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors'
                aria-label='Menu'
              >
                <Menu className='w-5 h-5 text-gray-700' />
              </motion.button>

              {/* Cart Button */}
              <Link to='/cart'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors'
                  aria-label='Shopping Cart'
                >
                  <ShoppingCart className='w-5 h-5 text-gray-700' />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className='absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-[#f63a9e] to-[#e02a8e] text-white text-xs font-semibold rounded-full shadow-md'
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Navigation Menu */}
      {/* Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: mobileMenuOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className='fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50'
      >
        <div className='flex flex-col h-full'>
          {/* Drawer Header */}
          <div className='flex items-center justify-between px-6 py-6 border-b border-gray-100'>
            <div className='flex items-center gap-3'>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className='w-2 h-8 bg-gradient-to-b from-[#f63a9e] to-[#e02a8e] rounded-full shadow-sm'
              />
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900"
                style={{ fontSize: '20px', fontWeight: '600' }}
              >
                Navigation
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(false)}
              className='flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors'
              aria-label='Close menu'
            >
              <X className='w-5 h-5 text-gray-600' />
            </motion.button>
          </div>

          {/* Navigation Links */}
          <nav className='flex-1 overflow-y-auto py-4 px-3'>
            <div className='space-y-1'>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#f63a9e]/10 to-transparent text-[#f63a9e] shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-[#f63a9e]' : 'text-gray-400'}`}
                      />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='ml-auto w-1.5 h-1.5 rounded-full bg-[#f63a9e]'
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </nav>

          {/* Drawer Footer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='border-t border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-white'
          >
            <div className='flex items-center justify-between mb-4'>
              <span className='text-sm font-medium text-gray-600'>
                Your Cart
              </span>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='px-3 py-1 text-sm font-semibold text-[#f63a9e] bg-[#f63a9e]/10 rounded-full'
                >
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </motion.span>
              )}
            </div>
            <Link to='/cart' onClick={() => setMobileMenuOpen(false)}>
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(246, 58, 158, 0.3)',
                }}
                whileTap={{ scale: 0.98 }}
                className='w-full h-12 bg-gradient-to-r from-[#f63a9e] to-[#e02a8e] text-white rounded-full shadow-lg transition-all duration-200'
                style={{ fontWeight: '600' }}
              >
                {totalItems > 0 ? 'View Cart' : 'Start Shopping'}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
