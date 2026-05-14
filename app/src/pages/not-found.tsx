import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  ArrowUpRight,
  Frame,
  Sparkles,
  Images,
  Truck,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { buildMeta } from '@/lib/seo';
import type { Route } from './+types/not-found';

export const meta: Route.MetaFunction = () =>
  buildMeta({
    title: 'Page Not Found | Photify',
    description: "The page you're looking for doesn't exist on Photify.",
    path: '/404',
    noindex: true,
  });

interface Destination {
  icon: React.ComponentType<{ className?: string }>;
  number: string;
  title: string;
  description: string;
  href: string;
}

const destinations: Destination[] = [
  {
    icon: Frame,
    number: '01',
    title: 'Browse products',
    description: 'Premium canvas, framed prints, and curated wall art.',
    href: '/products',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Create a custom print',
    description: 'Upload a photo and we’ll turn it into something special.',
    href: '/customize/single-canvas',
  },
  {
    icon: Images,
    number: '03',
    title: 'Stock image gallery',
    description: 'A curated collection from abstract to traditional.',
    href: '/stock-images',
  },
  {
    icon: Truck,
    number: '04',
    title: 'Track your order',
    description: 'Check delivery progress with your order number.',
    href: '/track-order',
  },
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Mona_Sans',_sans-serif]">
      <Header />

      <main className='flex-1'>
        {/* Hero — centered, 404-led */}
        <section className='relative border-b border-gray-200 overflow-hidden'>
          {/* Subtle grid backdrop to signal "broken / off the map" */}
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_75%)]'
          />

          <div className='relative max-w-[1100px] mx-auto px-6 md:px-12 pt-20 md:pt-24 pb-16 md:pb-20 text-center'>
            {/* Status pill */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#f63a9e]/25 bg-[#FFF5FB] mb-10'
            >
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f63a9e] opacity-60' />
                <span className='relative inline-flex h-2 w-2 rounded-full bg-[#f63a9e]' />
              </span>
              <span
                className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e]'
                style={{ fontWeight: 600 }}
              >
                Error 404 · Page not found
              </span>
            </motion.div>

            {/* Giant 404 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5, ease: 'easeOut' }}
              className='relative mx-auto'
            >
              {/* Soft halo behind */}
              <div
                aria-hidden='true'
                className='absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto h-[60%] max-w-[640px] bg-[#FFF5FB] blur-3xl opacity-80 rounded-full'
              />

              <h1
                className="relative font-['Bricolage_Grotesque',_sans-serif] text-gray-900 leading-none"
                style={{
                  fontSize: 'clamp(120px, 22vw, 260px)',
                  fontWeight: 800,
                  letterSpacing: '-0.06em',
                }}
                aria-label='404'
              >
                <span>4</span>
                <motion.span
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
                  transition={{
                    delay: 0.6,
                    duration: 1.4,
                    ease: 'easeInOut',
                  }}
                  className='inline-block text-[#f63a9e]'
                  style={{ transformOrigin: '50% 55%' }}
                >
                  0
                </motion.span>
                <span>4</span>

                {/* Glitch / "broken" sparkles */}
                <motion.span
                  aria-hidden='true'
                  animate={{ y: [0, -4, 0], rotate: [0, 12, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className='absolute -top-2 right-[18%] sm:right-[22%] text-[#f63a9e]/70'
                >
                  <Sparkles className='w-5 h-5 sm:w-6 sm:h-6' />
                </motion.span>
                <motion.span
                  aria-hidden='true'
                  animate={{ y: [0, 4, 0], rotate: [0, -10, 0] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className='absolute -bottom-1 left-[18%] sm:left-[22%] text-gray-300'
                >
                  <Sparkles className='w-4 h-4 sm:w-5 sm:h-5' />
                </motion.span>
              </h1>

              {/* Caption strip under the 404 */}
              <div className='relative -mt-2 sm:-mt-4 flex items-center justify-center gap-3'>
                <span
                  aria-hidden='true'
                  className='h-px w-10 sm:w-16 bg-gray-200'
                />
                <span
                  className='text-[11px] uppercase tracking-[0.24em] text-gray-400'
                  style={{ fontWeight: 600 }}
                >
                  Lost in the gallery
                </span>
                <span
                  aria-hidden='true'
                  className='h-px w-10 sm:w-16 bg-gray-200'
                />
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className='mt-10 md:mt-12 max-w-xl mx-auto'
            >
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
                style={{
                  fontSize: 'clamp(22px, 2.6vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Oops — this print didn&rsquo;t develop.
              </h2>
              <p className='text-gray-600 text-[16px] leading-relaxed'>
                The page you were looking for isn&rsquo;t here. It may have
                moved, been renamed, or never existed at all.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
              className='mt-8 flex flex-wrap items-center justify-center gap-3'
            >
              <Button
                onClick={() => navigate('/')}
                className='bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-lg h-11 px-5 shadow-none transition-colors'
                style={{ fontWeight: 600, fontSize: '14px' }}
              >
                <Home className='w-4 h-4 mr-2' />
                Back to homepage
              </Button>

              <button
                type='button'
                onClick={() => navigate(-1)}
                className='inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-gray-300 hover:border-gray-900 text-gray-900 text-sm transition-colors'
                style={{ fontWeight: 500 }}
              >
                <ArrowLeft className='w-4 h-4' />
                Go back
              </button>
            </motion.div>
          </div>
        </section>

        {/* Summary strip — quick reassurance */}
        <section className='border-b border-gray-200 bg-gray-50/60'>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-10'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-6'>
              {[
                {
                  title: 'No data was lost',
                  desc: 'Your cart and uploads are still safe.',
                },
                {
                  title: 'We log broken links',
                  desc: 'So we can fix them quickly behind the scenes.',
                },
                {
                  title: 'Need a hand?',
                  desc: 'Our team replies within one working day.',
                },
              ].map((item, i) => (
                <div key={i} className='border-l-2 border-[#f63a9e]/60 pl-4'>
                  <p
                    className='text-gray-900 mb-1 text-[15px]'
                    style={{ fontWeight: 600 }}
                  >
                    {item.title}
                  </p>
                  <p className='text-gray-500 text-sm leading-relaxed'>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular destinations */}
        <section>
          <div className='max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20'>
            <div className='mb-10 md:mb-12 max-w-2xl'>
              <p
                className='text-[11px] uppercase tracking-[0.18em] text-[#f63a9e] mb-3'
                style={{ fontWeight: 600 }}
              >
                Popular destinations
              </p>
              <h2
                className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-3"
                style={{
                  fontSize: 'clamp(26px, 3vw, 32px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                Pick a path back.
              </h2>
              <p className='text-gray-500 text-[16px] leading-relaxed'>
                A few of the places customers visit most. One of these is
                probably what you were after.
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-gray-200 rounded-2xl overflow-hidden'>
              {destinations.map((dest, i) => {
                const Icon = dest.icon;
                return (
                  <motion.div
                    key={dest.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.15 + i * 0.06,
                      duration: 0.4,
                      ease: 'easeOut',
                    }}
                    className={`relative group ${
                      i < destinations.length - 1
                        ? 'border-b sm:border-b border-gray-200'
                        : ''
                    } ${
                      // Vertical dividers on lg
                      i < destinations.length - 1
                        ? 'lg:border-b-0 lg:border-r lg:border-gray-200'
                        : ''
                    } ${
                      // Mid divider on sm (2-col)
                      i % 2 === 0 ? 'sm:border-r sm:border-gray-200' : ''
                    } ${
                      // Bottom border control on sm
                      i < destinations.length - 2 ? 'sm:border-b' : 'sm:border-b-0'
                    }`}
                  >
                    <Link
                      to={dest.href}
                      className='block h-full p-6 md:p-7 hover:bg-gray-50/70 transition-colors focus-visible:outline-none focus-visible:bg-gray-50'
                    >
                      <div className='flex items-center justify-between mb-8'>
                        <div className='w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center transition-colors group-hover:border-[#f63a9e]/40 group-hover:bg-[#FFF5FB]'>
                          <Icon className='w-[18px] h-[18px] text-gray-700 group-hover:text-[#f63a9e] transition-colors' />
                        </div>
                        <span
                          className='text-[10px] tabular-nums text-gray-300 tracking-widest'
                          style={{ fontWeight: 600 }}
                        >
                          {dest.number}
                        </span>
                      </div>

                      <h3
                        className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                        style={{
                          fontSize: '17px',
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.3,
                        }}
                      >
                        {dest.title}
                      </h3>
                      <p className='text-gray-500 text-[13.5px] leading-relaxed mb-6'>
                        {dest.description}
                      </p>

                      <span className='inline-flex items-center gap-1.5 text-[13px] text-gray-500 group-hover:text-[#f63a9e] transition-colors'>
                        <span style={{ fontWeight: 600 }}>Visit</span>
                        <ArrowUpRight className='w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Help footer */}
            <div className='mt-16 md:mt-20 border-t border-gray-200 pt-10 md:pt-12'>
              <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6'>
                <div className='max-w-md'>
                  <h3
                    className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-2"
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    Still can&rsquo;t find it?
                  </h3>
                  <p className='text-gray-500 text-[15px] leading-relaxed'>
                    Drop us a note with what you were looking for and
                    we&rsquo;ll point you in the right direction.
                  </p>
                </div>
                <div className='flex flex-wrap gap-3'>
                  <a
                    href='mailto:support@photify.co'
                    className='inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm transition-colors'
                    style={{ fontWeight: 500 }}
                  >
                    <Mail className='w-4 h-4' />
                    Email us
                  </a>
                  <Link
                    to='/contact'
                    className='inline-flex items-center gap-2 border border-gray-300 hover:border-gray-900 text-gray-900 px-5 py-2.5 rounded-lg text-sm transition-colors'
                    style={{ fontWeight: 500 }}
                  >
                    Contact form
                    <ArrowUpRight className='w-4 h-4' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
