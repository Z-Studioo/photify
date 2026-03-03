import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

const COOKIE_KEY = 'photify_cookie_consent';

type ConsentValue = 'accepted' | 'denied';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY) as ConsentValue | null;
    if (!stored) {
      // Small delay so it doesn't flash immediately on page load
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const handleDeny = () => {
    localStorage.setItem(COOKIE_KEY, 'denied');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className='fixed bottom-24 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-sm z-40'
        >
          <div className='relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden'>
            {/* Top accent bar */}
            <div className='h-1 w-full bg-gradient-to-r from-[#f63a9e] to-purple-500' />

            {/* Dismiss X */}
            <button
              onClick={handleDeny}
              className='absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors'
              aria-label='Dismiss'
            >
              <X className='w-4 h-4' />
            </button>

            <div className='p-5 pr-8'>
              {/* Header */}
              <div className='flex items-center gap-2.5 mb-3'>
                <div className='w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0'>
                  <Cookie className='w-4 h-4 text-[#f63a9e]' />
                </div>
                <h3 className="font-['Bricolage_Grotesque',sans-serif] font-bold text-gray-900 text-sm">
                  We use cookies 🍪
                </h3>
              </div>

              {/* Body */}
              <p className='text-xs text-gray-500 leading-relaxed mb-4'>
                We use cookies to enhance your browsing experience, analyse site
                traffic, and personalise content. By clicking{' '}
                <strong className='text-gray-700'>Accept</strong>, you consent
                to our use of cookies. Read our{' '}
                <Link
                  to='/privacy-policy'
                  className='text-[#f63a9e] hover:underline font-medium'
                  onClick={() => setVisible(false)}
                >
                  Privacy Policy
                </Link>{' '}
                to learn more.
              </p>

              {/* Actions */}
              <div className='flex gap-2'>
                <Button
                  onClick={handleAccept}
                  size='sm'
                  className='flex-1 h-9 text-xs font-semibold bg-gradient-to-r from-[#f63a9e] to-purple-500 hover:opacity-90 text-white rounded-xl shadow-md shadow-pink-200/40 gap-1.5'
                >
                  <ShieldCheck className='w-3.5 h-3.5' />
                  Accept All
                </Button>
                <Button
                  onClick={handleDeny}
                  size='sm'
                  variant='outline'
                  className='flex-1 h-9 text-xs font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-300 rounded-xl gap-1.5'
                >
                  <XCircle className='w-3.5 h-3.5' />
                  Deny
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
