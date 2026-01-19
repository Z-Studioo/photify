import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap } from 'lucide-react';

export function AILoader() {
  return (
    <div className='fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center'>
      {/* Animated background particles */}
      <div className='absolute inset-0 overflow-hidden'>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute w-1 h-1 bg-white rounded-full'
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className='relative z-10 flex flex-col items-center'>
        {/* Central AI Brain Animation */}
        <div className='relative w-32 h-32 mb-8'>
          {/* Outer rotating circle */}
          <motion.div
            className='absolute inset-0 border-4 border-[#f63a9e]/30 rounded-full'
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className='absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#f63a9e] rounded-full shadow-lg shadow-[#f63a9e]/50' />
          </motion.div>

          {/* Middle rotating circle */}
          <motion.div
            className='absolute inset-2 border-4 border-purple-400/30 rounded-full'
            animate={{ rotate: -360 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className='absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50' />
          </motion.div>

          {/* Inner rotating circle */}
          <motion.div
            className='absolute inset-4 border-4 border-cyan-400/30 rounded-full'
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className='absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50' />
          </motion.div>

          {/* Center Brain Icon */}
          <motion.div
            className='absolute inset-0 flex items-center justify-center'
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className='w-12 h-12 bg-gradient-to-br from-[#f63a9e] to-purple-600 rounded-full flex items-center justify-center shadow-2xl'>
              <Brain className='w-6 h-6 text-white' />
            </div>
          </motion.div>

          {/* Orbiting icons */}
          <motion.div
            className='absolute top-1/2 left-1/2'
            style={{ marginLeft: '-12px', marginTop: '-12px' }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.div
              className='absolute'
              style={{ left: '80px', top: '0px' }}
              animate={{
                scale: [1, 1.3, 1],
                rotate: -360,
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Sparkles className='w-5 h-5 text-yellow-400' />
            </motion.div>
          </motion.div>

          <motion.div
            className='absolute top-1/2 left-1/2'
            style={{ marginLeft: '-12px', marginTop: '-12px' }}
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.div
              className='absolute'
              style={{ left: '-80px', top: '0px' }}
              animate={{
                scale: [1, 1.3, 1],
                rotate: 360,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Zap className='w-5 h-5 text-cyan-400' />
            </motion.div>
          </motion.div>
        </div>

        {/* Text Animation */}
        <motion.h2
          className="font-['Bricolage_Grotesque',_sans-serif] text-white text-center mb-4"
          style={{ fontSize: '32px', fontWeight: '700' }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          AI is Creating Your Artwork
        </motion.h2>

        {/* Loading steps */}
        <div className='space-y-2 min-w-[300px]'>
          {[
            'Analyzing prompt',
            'Generating composition',
            'Adding details',
            'Finalizing artwork',
          ].map((step, index) => (
            <motion.div
              key={step}
              className='flex items-center gap-3'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.8,
                duration: 0.5,
              }}
            >
              <motion.div
                className='w-2 h-2 rounded-full bg-gradient-to-r from-[#f63a9e] to-purple-600'
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  delay: index * 0.8,
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              <motion.p
                className='text-white/80 text-sm'
                animate={{
                  opacity: [0.5, 1],
                }}
                transition={{
                  delay: index * 0.8,
                  duration: 0.5,
                }}
              >
                {step}
              </motion.p>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <motion.div className='w-64 h-2 bg-white/10 rounded-full mt-8 overflow-hidden'>
          <motion.div
            className='h-full bg-gradient-to-r from-[#f63a9e] via-purple-600 to-cyan-400 rounded-full'
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 15,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Subtext */}
        <motion.p
          className='text-white/60 text-sm mt-6 text-center max-w-md'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Our AI is working its magic to create unique variations based on your
          prompt
        </motion.p>
      </div>

      {/* Corner glow effects */}
      <div className='absolute top-0 left-0 w-96 h-96 bg-[#f63a9e]/20 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl' />
    </div>
  );
}
