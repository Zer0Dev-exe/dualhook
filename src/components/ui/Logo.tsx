import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Logo de Dualhook: dos ganchos entrelazados, azul (V1) y verde (V2). Igual que docs/logo.svg. */
export function Logo({ className }: { className?: string }) {
  const bg = useId();
  return (
    <svg viewBox="0 0 96 96" className={cn('size-8', className)} aria-label="Dualhook" role="img">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f232b" />
          <stop offset="1" stopColor="#121418" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill={`url(#${bg})`} />
      <rect x="1" y="1" width="94" height="94" rx="23" fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="2" />
      <g fill="none" strokeWidth="8" strokeLinecap="round" transform="translate(48 48) scale(1.12) translate(-48 -48)">
        <circle cx="35" cy="19" r="5" stroke="#5865f2" strokeWidth="6" />
        <path d="M35 24 V54 a11 11 0 0 0 22 0 V46" stroke="#5865f2" />
        <path d="M61 72 V42 a11 11 0 0 0 -22 0 V50" stroke="#2dc770" />
        <circle cx="61" cy="77" r="5" stroke="#2dc770" strokeWidth="6" />
        <path d="M57 52 V46" stroke="#5865f2" />
      </g>
    </svg>
  );
}
