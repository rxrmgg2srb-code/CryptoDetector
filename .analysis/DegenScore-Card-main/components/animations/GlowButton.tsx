import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
}

export const GlowButton = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
}: GlowButtonProps) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all';
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-800 text-indigo-400 border border-indigo-500 hover:bg-gray-700',
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      whileHover={
        !disabled
          ? {
              scale: 1.05,
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {children}
    </motion.button>
  );
};
