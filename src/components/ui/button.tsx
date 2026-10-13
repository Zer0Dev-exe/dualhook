import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border border-line-2 bg-panel-3 text-fg hover:border-[#46505e] hover:bg-[#2b3039]',
        primary: 'bg-fg font-semibold text-bg hover:bg-white',
        v1: 'border border-v1/30 bg-v1/15 font-semibold text-v1-soft hover:bg-v1/25',
        v2: 'border border-v2/30 bg-v2/15 font-semibold text-v2-soft hover:bg-v2/25',
        ghost: 'text-muted hover:bg-panel-3 hover:text-fg',
        danger: 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
        dashed: 'border border-dashed border-line-2 text-muted hover:border-[#4b5260] hover:text-fg',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5',
        lg: 'h-10 px-5',
        icon: 'size-7 rounded-md [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

/** Botón de icono discreto (acciones de lista). */
export const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { danger?: boolean }>(({ className, danger, ...props }, ref) => (
  <Button ref={ref} variant="ghost" size="icon" className={cn(danger && 'hover:text-red-400', className)} {...props} />
));
IconButton.displayName = 'IconButton';
