import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#1a1a2e] border border-white/[0.06] rounded-2xl',
        paddingClasses[padding],
        hover && 'transition-all duration-300 hover:border-purple-500/30 hover:bg-[#22223a] hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}
