import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className='bg-black text-white border-t border-gray-800 mt-16'>
      <div className='max-w-[1400px] mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8'>
          {/* Logo & Description */}
          <div className='lg:col-span-2'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-10 h-10 bg-[#f63a9e] rounded-full flex items-center justify-center'>
                <div className='w-3 h-3 bg-white rounded-full' />
              </div>
              <span
                className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e]"
                style={{ fontSize: '28px', fontWeight: '800' }}
              >
                Photify
              </span>
            </div>
            <p className='text-gray-400 mb-4'>
              At Photify, we&apos;re dedicated to helping you transform your
              cherished moments and creative visions into timeless works of art.
            </p>
          </div>

          {/* Column 1 */}
          <div>
            <h4 className='mb-4'>Shop</h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='/'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to='/category/custom-frames'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  Custom Frames
                </Link>
              </li>
              <li>
                <Link
                  to='/category/gallery-walls'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  Gallery Walls
                </Link>
              </li>
              <li>
                <Link
                  to='/art-collections'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  Art Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className='mb-4'>Help</h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='/contact'
                  className='text-gray-400 hover:text-[#f63a9e]'
                >
                  Customer service
                </Link>
              </li>
              <li>
                <Link
                  to='/contact'
                  className='text-gray-400 hover:text-[#f63a9e]'
                >
                  Return policy
                </Link>
              </li>
              <li>
                <Link
                  to='/track-order'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  Track your order
                </Link>
              </li>
              <li>
                <Link
                  to='/contact'
                  className='text-gray-400 hover:text-[#f63a9e]'
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  to='/admin/login'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className='mb-4'>Follow us</h4>
            <div className='flex gap-3'>
              <a
                href='#'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <Facebook className='w-5 h-5' />
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <Instagram className='w-5 h-5' />
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <Youtube className='w-5 h-5' />
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <Twitter className='w-5 h-5' />
              </a>
            </div>
          </div>
        </div>

        {/* Payment Methods & Social */}
        <div className='border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4'>
          <p className='text-sm text-gray-400'>
            © 2025 Photify. All Rights Reserved.
          </p>
          <div className='flex items-center gap-4'>
            <div className='flex gap-2'>
              <div className='bg-white rounded px-2 py-1'>
                <span className='text-xs font-semibold'>VISA</span>
              </div>
              <div className='bg-white rounded px-2 py-1'>
                <span className='text-xs font-semibold'>MC</span>
              </div>
              <div className='bg-white rounded px-2 py-1'>
                <span className='text-xs font-semibold'>AMEX</span>
              </div>
              <div className='bg-white rounded px-2 py-1'>
                <span className='text-xs font-semibold'>PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
