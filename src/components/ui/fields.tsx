import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from './button';

function Label({ label, required, counter }: { label?: ReactNode; required?: boolean; counter?: ReactNode }) {
  if (!label && !counter) return null;
  return (
    <span className="label flex items-baseline justify-between gap-2">
      <span>
        {label}
        {required && <b className="text-red-400"> *</b>}
      </span>
      {counter}
    </span>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  return (
    <span className={cn('font-semibold normal-case tabular-nums tracking-normal', n > max ? 'text-red-400' : n > max * 0.9 ? 'text-amber-400' : '')}>
      {n}/{max}
    </span>
  );
}

interface TextFieldProps {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  hint?: ReactNode;
  required?: boolean;
  list?: string;
  type?: string;
  className?: string;
  suffix?: ReactNode;
}

export function TextField({ label, value, onChange, placeholder, max, multiline, rows = 3, mono, hint, required, list, type = 'text', className, suffix }: TextFieldProps) {
  const cls = cn('input', mono && 'font-mono text-xs');
  return (
    <label className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Label label={label} required={required} counter={max ? <Counter n={value.length} max={max} /> : null} />
      {multiline ? (
        <textarea className={cn(cls, 'autosize max-h-[480px] min-h-[64px] resize-y leading-relaxed')} rows={rows} value={value} placeholder={placeholder} spellCheck={!mono} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="flex items-center gap-1.5">
          <input className={cls} type={type} value={value} placeholder={placeholder} list={list} spellCheck={!mono} onChange={(e) => onChange(e.target.value)} />
          {suffix}
        </div>
      )}
      {hint && <small className="text-xs text-muted">{hint}</small>}
    </label>
  );
}

export function CheckField({ label, checked, onChange, className }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-[13px]', className)}>
      <input type="checkbox" className="size-4 accent-mode" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function SelectField<T extends string | number>({ label, value, options, onChange, className }: { label?: ReactNode; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; className?: string }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Label label={label} />
      <select
        className="input cursor-pointer"
        value={String(value)}
        onChange={(e) => {
          const opt = options.find(([v]) => String(v) === e.target.value);
          if (opt) onChange(opt[0]);
        }}
      >
        {options.map(([v, l]) => (
          <option key={String(v)} value={String(v)}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

const SWATCHES = ['#5865f2', '#57f287', '#2dc770', '#fee75c', '#f0a020', '#eb459e', '#ed4245', '#ffffff', '#23272a'];

export function ColorField({ label = 'Color', value, onChange, nullable }: { label?: ReactNode; value: string | null; onChange: (v: string | null) => void; nullable?: boolean }) {
  const empty = nullable ? null : '';
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label label={label} />
      <div className="flex flex-wrap items-center gap-1.5">
        <input type="color" className="h-8 w-9 cursor-pointer rounded-lg border border-line-2 bg-panel p-0.5" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input
          className="input w-24 font-mono text-xs"
          maxLength={7}
          placeholder={nullable ? 'sin color' : '#rrggbb'}
          defaultValue={value ?? ''}
          key={value ?? ''}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (/^#?[0-9a-f]{6}$/i.test(v)) onChange((v.startsWith('#') ? v : `#${v}`).toLowerCase());
            else if (!v) onChange(empty);
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <IconButton title="Quitar color" onClick={() => onChange(empty)}>
          <X />
        </IconButton>
        <div className="flex gap-1">
          {SWATCHES.map((c) => (
            <button key={c} type="button" title={c} className="size-4 rounded border border-white/15 transition hover:scale-125" style={{ background: c }} onClick={() => onChange(c)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, className }: { value: T; options: readonly (readonly [T, ReactNode])[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('inline-flex flex-wrap gap-0.5 rounded-lg border border-line-2 bg-panel p-0.5', className)}>
      {options.map(([v, l]) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => v !== value && onChange(v)}
          className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted transition hover:text-fg [&_svg]:size-3.5', v === value && 'bg-panel-3 text-fg shadow')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Fieldset({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2 rounded-lg border border-line px-2.5 pb-2.5 pt-1', className)}>
      <legend className="label px-1.5">{title}</legend>
      {children}
    </fieldset>
  );
}

export function Note({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  return (
    <div className={cn('rounded-lg border px-2.5 py-1.5 text-[12.5px]', tone === 'warn' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-line bg-panel-2 text-muted')}>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line-2 p-4 text-center text-[13px] text-muted">{children}</div>;
}
