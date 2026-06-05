/**
 * Animated Toast Component
 *
 * Beautiful toast notifications with smooth animations
 * Replaces basic react-hot-toast with enhanced UX
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function AnimatedToast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const configs = {
    success: {
      icon: '✓',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-900/30 to-emerald-900/30',
      border: 'border-green-500/50',
      iconBg: 'bg-green-500',
    },
    error: {
      icon: '✕',
      gradient: 'from-red-500 to-orange-500',
      bg: 'from-red-900/30 to-orange-900/30',
      border: 'border-red-500/50',
      iconBg: 'bg-red-500',
    },
    warning: {
      icon: '⚠',
      gradient: 'from-yellow-500 to-orange-500',
      bg: 'from-yellow-900/30 to-orange-900/30',
      border: 'border-yellow-500/50',
      iconBg: 'bg-yellow-500',
    },
    info: {
      icon: 'ℹ',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-900/30 to-cyan-900/30',
      border: 'border-blue-500/50',
      iconBg: 'bg-blue-500',
    },
  };

  const config = configs[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${config.bg} border ${config.border} backdrop-blur-sm shadow-2xl`}
        >
          <div className="flex items-center gap-3 p-4 pr-12">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className={`flex items-center justify-center h-8 w-8 rounded-full ${config.iconBg} text-white font-bold text-sm`}
            >
              {config.icon}
            </motion.div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-white font-medium flex-1"
            >
              {message}
            </motion.p>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="absolute top-3 right-3 text-white/50 hover:text-white/80 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </div>

          {/* Progress Bar */}
          {duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={`h-full bg-gradient-to-r ${config.gradient}`}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast Container (manages multiple toasts)
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Expose addToast function globally
  useEffect(() => {
    (window as any).addToast = (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
    };

    return () => {
      delete (window as any).addToast;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <AnimatedToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Helper functions
export const showToast = {
  success: (message: string) => (window as any).addToast?.(message, 'success'),
  error: (message: string) => (window as any).addToast?.(message, 'error'),
  warning: (message: string) => (window as any).addToast?.(message, 'warning'),
  info: (message: string) => (window as any).addToast?.(message, 'info'),
};

export default AnimatedToast;
