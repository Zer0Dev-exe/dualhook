import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mode/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border border-line-2 bg-panel-3 text-fg hover:border-[#46505e] hover:bg-[#2b3039]',
        primary: 'bg-mode font-semibold text-white shadow-sm hover:brightness-110',
        v1: 'bg-v1 font-semibold text-white hover:brightness-110',
        v2: 'bg-v2 font-semibold text-[#052513] hover:brightness-110',
        ghost: 'text-muted hover:bg-panel-3 hover:text-fg',
        danger: 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
        dashed: 'border border-dashed border-mode/50 bg-mode/10 text-fg hover:border-solid hover:border-mode',
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
