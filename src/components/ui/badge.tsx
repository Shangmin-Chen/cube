import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'amber' | 'indigo' | 'purple' | 'emerald' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#2d2d2d] text-[#d4d4d4] border-[#383838]',
    amber: 'bg-[#2d2d2d] text-[#eab308] border-[#eab308]/40',
    indigo: 'bg-[#2d2d2d] text-[#818cf8] border-[#818cf8]/40',
    purple: 'bg-[#2d2d2d] text-[#c084fc] border-[#c084fc]/40',
    emerald: 'bg-[#2d2d2d] text-[#4ade80] border-[#4ade80]/40',
    outline: 'text-[#888888] border-[#2d2d2d]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
