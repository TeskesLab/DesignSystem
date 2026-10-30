import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type DisclosureProps = ComponentPropsWithoutRef<'details'> & { summary: ReactNode };
export function Disclosure({ summary, children, ...props }: DisclosureProps) {
  return <details {...props}><summary>{summary}</summary>{children}</details>;
}

export interface ProgressProps {
  label: string;
  value?: number;
  max?: number;
}
/** Omit value when the amount of completed work is not known. */
export function Progress({ label, value, max = 100 }: ProgressProps) {
  return <progress className="tl-progress" value={value} max={max} aria-label={label} />;
}

export interface EmptyStateProps {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}
export function EmptyState({ title, children, action, icon }: EmptyStateProps) {
  return <div className="tl-empty">{icon}<h3>{title}</h3><p>{children}</p>{action}</div>;
}

export interface CodeBlockProps {
  label: string;
  children: string;
}
export function CodeBlock({ label, children }: CodeBlockProps) {
  return <pre tabIndex={0} aria-label={label}><code>{children}</code></pre>;
}

export type TableProps = ComponentPropsWithoutRef<'table'> & { label: string };
/** Supply semantic caption, header and body markup. Sorting and pagination remain controlled by the caller. */
export function Table({ label, className = '', children, ...props }: TableProps) {
  return <div className="table-scroll" tabIndex={0} role="region" aria-label={label}>
    <table {...props} className={`tl-table ${className}`}>{children}</table>
  </div>;
}
