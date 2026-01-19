import { motion } from 'framer-motion';
import { Home, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-center min-h-screen py-16">
        <div className="text-center">
          {/* 404 Number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 
              className="font-['Bricolage_Grotesque',_sans-serif] text-[#f63a9e] mb-4"
              style={{ fontSize: '120px', fontWeight: '800', lineHeight: '1' }}
            >
              404
            </h1>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 rounded-full bg-[#FFF5FB] flex items-center justify-center shadow-xl border-2 border-[#f63a9e]/30">
              <Package className="w-12 h-12 text-[#f63a9e]" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-['Bricolage_Grotesque',_sans-serif] text-gray-900 mb-4"
            style={{ fontSize: '32px', fontWeight: '700', lineHeight: '1.2' }}
          >
            Page Not Found
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-600 mb-8 max-w-md mx-auto"
            style={{ fontSize: '18px', lineHeight: '1.6' }}
          >
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => navigate('/')}
              className="bg-[#f63a9e] hover:bg-[#e02d8d] text-white rounded-xl h-[56px] px-8 shadow-lg w-full sm:w-auto"
              style={{ fontWeight: '700', fontSize: '16px' }}
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </Button>

            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-2 border-[#f63a9e] text-[#f63a9e] hover:bg-[#FFF5FB] rounded-xl h-[56px] px-8 w-full sm:w-auto"
              style={{ fontWeight: '700', fontSize: '16px' }}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </motion.div>

          {/* Popular Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 pt-8 border-t border-gray-200"
          >
            <p 
              className="text-gray-500 mb-6 uppercase tracking-wider"
              style={{ fontSize: '12px', fontWeight: '600' }}
            >
              Popular Pages
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/category/gallery-walls')}
                className="text-[#f63a9e] hover:underline"
                style={{ fontSize: '16px', fontWeight: '500' }}
              >
                Browse Collection
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/track-order')}
                className="text-[#f63a9e] hover:underline"
                style={{ fontSize: '16px', fontWeight: '500' }}
              >
                Track Order
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/cart')}
                className="text-[#f63a9e] hover:underline"
                style={{ fontSize: '16px', fontWeight: '500' }}
              >
                View Cart
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/contact')}
                className="text-[#f63a9e] hover:underline"
                style={{ fontSize: '16px', fontWeight: '500' }}
              >
                Contact Us
              </button>
            </div>
          </motion.div>

          {/* Floating Decoration */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-10 w-16 h-16 opacity-20"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-400 blur-xl" />
          </motion.div>

          <motion.div
            animate={{ 
              y: [0, 10, 0],
              rotate: [0, -5, 0, 5, 0]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 left-10 w-20 h-20 opacity-20"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 blur-xl" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

