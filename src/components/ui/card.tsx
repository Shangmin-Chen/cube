import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-[#2d2d2d] bg-[#202020] text-[#d4d4d4] shadow-none transition-colors hover:border-[#404040]',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export { Card };

