import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_URL =
  'https://api.whatsapp.com/send/?phone=447438940960&text&type=phone_number&app_absent=0';

export function WhatsAppButton() {
  const { pathname } = useLocation();

  // Hide on all admin pages and fullscreen customizer pages
  const hidden =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/customize') ||
    pathname.startsWith('/canvas-configurer');

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.a
          href={WHATSAPP_URL}
          target='_blank'
          rel='noopener noreferrer'
          aria-label='Chat with us on WhatsApp'
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className='fixed bottom-6 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-xl focus:outline-none'
          style={{ backgroundColor: '#25D366' }}
        >
          {/* WhatsApp SVG icon */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 48 48'
            width='30'
            height='30'
            fill='white'
          >
            <path d='M24 4C12.95 4 4 12.95 4 24c0 3.55.96 6.86 2.62 9.72L4 44l10.55-2.56A19.88 19.88 0 0 0 24 44c11.05 0 20-8.95 20-20S35.05 4 24 4zm0 36c-3.27 0-6.34-.9-8.96-2.46l-.64-.38-6.26 1.52 1.57-6.1-.42-.67A15.93 15.93 0 0 1 8 24c0-8.82 7.18-16 16-16s16 7.18 16 16-7.18 16-16 16zm8.73-11.96c-.48-.24-2.83-1.4-3.27-1.56-.44-.16-.76-.24-1.08.24-.32.48-1.24 1.56-1.52 1.88-.28.32-.56.36-1.04.12-.48-.24-2.02-.74-3.85-2.37-1.42-1.27-2.38-2.84-2.66-3.32-.28-.48-.03-.74.21-.98.22-.21.48-.56.72-.84.24-.28.32-.48.48-.8.16-.32.08-.6-.04-.84-.12-.24-1.08-2.6-1.48-3.56-.38-.92-.78-.8-1.08-.82-.28-.02-.6-.02-.92-.02s-.84.12-1.28.6c-.44.48-1.68 1.64-1.68 4s1.72 4.64 1.96 4.96c.24.32 3.38 5.16 8.2 7.23 1.15.5 2.04.8 2.74 1.02 1.15.36 2.2.31 3.03.19.92-.14 2.83-1.16 3.23-2.28.4-1.12.4-2.08.28-2.28-.12-.2-.44-.32-.92-.56z' />
          </svg>

          {/* Pulse ring */}
          <span
            className='absolute inset-0 rounded-full animate-ping opacity-30'
            style={{ backgroundColor: '#25D366' }}
          />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
