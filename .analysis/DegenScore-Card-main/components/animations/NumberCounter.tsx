import { useEffect, useState } from 'react';
import { useSpring, useTransform } from 'framer-motion';

interface NumberCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const NumberCounter = ({ value, duration = 1, className = '' }: NumberCounterProps) => {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.onChange((latest) => setDisplayValue(latest));
  }, [display]);

  return <span className={className}>{displayValue}</span>;
};
