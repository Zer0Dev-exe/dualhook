import { ChevronDown } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useUi } from '@/store/ui';

interface CardProps {
  /** Si se indica, la tarjeta es plegable y recuerda su estado. */
  id?: string;
  title: ReactNode;
  icon?: ReactNode;
  tag?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  style?: CSSProperties;
  compact?: boolean;
}

export function Card({ id, title, icon, tag, summary, actions, children, className, headerClassName, style, compact }: CardProps) {
  const collapsed = useUi((s) => (id ? !!s.collapsed[id] : false));
  const toggle = useUi((s) => s.toggleCollapsed);
  return (
    <div className={cn('card', className)} style={style}>
      <div
        className={cn('flex min-h-[42px] select-none items-center gap-2 px-3', compact ? 'py-1' : 'py-1.5', id && 'cursor-pointer', headerClassName)}
        onClick={(e) => {
          if (!id || (e.target as HTMLElement).closest('button, input, select, label, a')) return;
          toggle(id);
        }}
      >
        {id && <ChevronDown className={cn('size-3.5 shrink-0 text-muted transition-transform', collapsed && '-rotate-90')} />}
        {icon && <span className="flex shrink-0 text-mode [&_svg]:size-4">{icon}</span>}
        <span className="whitespace-nowrap font-semibold">{title}</span>
        {tag}
        {summary && <span className="min-w-0 truncate text-[12.5px] text-muted">{summary}</span>}
        <span className="flex-1" />
        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>
      {!collapsed && <div className="flex flex-col gap-2.5 px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('whitespace-nowrap rounded-full bg-panel-3 px-2 py-px text-[11px] font-bold text-muted', className)}>{children}</span>;
}

export function ModePill({ mode, children, className }: { mode: 'v1' | 'v2'; children?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block rounded px-1.5 py-px text-[10.5px] font-extrabold tracking-wide', mode === 'v1' ? 'bg-v1 text-white' : 'bg-v2 text-[#062b16]', className)}>
      {children ?? mode.toUpperCase()}
    </span>
  );
}
