import React from 'react';
import { cn } from '../utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'header' | 'footer';
}

export function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag className={cn('max-w-[1200px] mx-auto px-6 lg:px-8', className)}>
      {children}
    </Tag>
  );
}
