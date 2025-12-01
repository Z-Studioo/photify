// import React, { createContext, useContext, useState } from 'react';
// import { motion, AnimatePresence } from 'motion/react';

// interface Toast {
//   id: string;
//   message: string;
//   type: 'success' | 'error';
//   duration?: number;
// }

// interface ToastContextType {
//   toasts: Toast[];
//   addToast: (message: string, type: 'success' | 'error', duration?: number) => void;
//   removeToast: (id: string) => void;
// }

// const ToastContext = createContext<ToastContextType | undefined>(undefined);

// export function ToastProvider({ children }: { children: React.ReactNode }) {
//   const [toasts, setToasts] = useState<Toast[]>([]);

//   const addToast = (message: string, type: 'success' | 'error', duration = 3000) => {
//     const id = Math.random().toString(36).substring(2, 9);
//     const newToast: Toast = { id, message, type, duration };
    
//     setToasts(prev => [...prev, newToast]);
    
//     if (duration > 0) {
//       setTimeout(() => {
//         removeToast(id);
//       }, duration);
//     }
//   };

//   const removeToast = (id: string) => {
//     setToasts(prev => prev.filter(toast => toast.id !== id));
//   };

//   return (
//     <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
//       {children}
//       <ToastContainer />
//     </ToastContext.Provider>
//   );
// }

// function ToastContainer() {
//   const { toasts, removeToast } = useToast();

//   return (
//     <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2">
//       <AnimatePresence>
//         {toasts.map((toast) => (
//           <motion.div
//             key={toast.id}
//             initial={{ opacity: 0, x: 100, scale: 0.9 }}
//             animate={{ opacity: 1, x: 0, scale: 1 }}
//             exit={{ opacity: 0, x: 100, scale: 0.9 }}
//             transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
//             className={`flex items-center justify-between p-3 sm:p-4 rounded-lg shadow-lg w-full max-w-full sm:min-w-80 sm:max-w-md ${
//               toast.type === 'success' 
//                 ? 'bg-green-500 text-white' 
//                 : 'bg-red-500 text-white'
//             }`}
//           >
//             <span className="font-medium text-sm sm:text-base pr-2">{toast.message}</span>
//             <button
//               onClick={() => removeToast(toast.id)}
//               className="flex-shrink-0 text-white hover:text-gray-200 transition-colors text-lg sm:text-base"
//             >
//               ×
//             </button>
//           </motion.div>
//         ))}
//       </AnimatePresence>
//     </div>
//   );
// }

// export function useToast() {
//   const context = useContext(ToastContext);
//   if (context === undefined) {
//     throw new Error('useToast must be used within a ToastProvider');
//   }
//   return context;
// }


import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: 'success' | 'error' | 'warning', duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getToastIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg shadow-lg w-full max-full sm:min-w-80 sm:max-w-md ${getToastStyles(toast.type)}`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getToastIcon(toast.type)}
            </div>
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm sm:text-base block leading-tight">
                {toast.message}
              </span>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors text-lg sm:text-base mt-0.5"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}