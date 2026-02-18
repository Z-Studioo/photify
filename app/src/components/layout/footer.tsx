import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';

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
                  to='/products'
                  className='text-gray-400 hover:text-[#f63a9e] transition-colors'
                >
                  All Products
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
                  Art Collections
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
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className='mb-4'>Follow us</h4>
            <div className='flex gap-3'>
              <a
                href='https://www.facebook.com/@photifyprints'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <Facebook className='w-5 h-5' />
              </a>
              <a
                href='https://www.instagram.com/photify.co'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <Instagram className='w-5 h-5' />
              </a>
              <a
                href='https://www.tiktok.com/@photify.co'
                target='_blank'
                rel='noopener noreferrer'
                className='w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#f63a9e] transition-colors'
              >
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Payment Methods & Social */}
        <div className='border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6'>
          <p className='text-sm text-gray-400'>
            © {new Date().getFullYear()} Photify. All Rights Reserved.
          </p>
          <div className='flex flex-col items-center md:items-end gap-2'>
            <p className='text-xs text-gray-500'>Secure payments with</p>
            <div className='flex items-center gap-3'>
              <div className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 hover:border-[#f63a9e] transition-colors'>
                <span className='text-sm font-bold text-white tracking-wider'>VISA</span>
              </div>
              <div className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 hover:border-[#f63a9e] transition-colors'>
                <span className='text-sm font-bold text-white tracking-wider'>Mastercard</span>
              </div>
              <div className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 hover:border-[#f63a9e] transition-colors'>
                <span className='text-sm font-bold text-white tracking-wider'>AMEX</span>
              </div>
              <div className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 hover:border-[#f63a9e] transition-colors'>
                <span className='text-sm font-bold text-[#0070ba]'>Pay</span>
                <span className='text-sm font-bold text-[#00a3e0]'>Pal</span>
              </div>
              <div className='bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 hover:border-[#f63a9e] transition-colors'>
                <span className='text-sm font-bold text-[#635bff]'>Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
