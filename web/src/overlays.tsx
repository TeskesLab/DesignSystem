import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { flushSync } from 'react-dom';
import { tabbable } from 'tabbable';

function CloseIcon() {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>;
}

export interface TabItem {
  id: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  label: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activation?: 'automatic' | 'manual';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Tabs({ label, items, value, defaultValue, onValueChange, activation = 'automatic', orientation = 'horizontal', className }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items.find(item => !item.disabled)?.id);
  const enabled = items.filter(item => !item.disabled);
  const requested = value ?? internal;
  const selected = enabled.some(item => item.id === requested) ? requested : enabled[0]?.id;
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    if (id !== selected) onValueChange?.(id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const index = enabled.findIndex(item => item.id === id);
    let next = index;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else if (event.key === (orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % enabled.length;
    else if (event.key === (orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft')) next = (index + enabled.length - 1) % enabled.length;
    else return;
    event.preventDefault();
    const target = enabled[next];
    if (target) {
      refs.current.get(target.id)?.focus();
      if (activation === 'automatic') select(target.id);
    }
  };
  return <div className={className}>
    <div className="tl-tabs" role="tablist" aria-label={label} aria-orientation={orientation}>
      {items.map(item => <button key={item.id} ref={node => { if (node) refs.current.set(item.id, node); else refs.current.delete(item.id); }} type="button" role="tab" id={`${baseId}-tab-${encodeURIComponent(item.id)}`} aria-controls={`${baseId}-panel-${encodeURIComponent(item.id)}`} aria-selected={selected === item.id} tabIndex={selected === item.id ? 0 : -1} disabled={item.disabled} onClick={() => select(item.id)} onKeyDown={event => onKeyDown(event, item.id)}>{item.label}</button>)}
    </div>
    {items.map(item => <div key={item.id} role="tabpanel" id={`${baseId}-panel-${encodeURIComponent(item.id)}`} aria-labelledby={`${baseId}-tab-${encodeURIComponent(item.id)}`} hidden={selected !== item.id} tabIndex={0}>{item.panel}</div>)}
  </div>;
}

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
const toneClass: Record<StatusTone, string> = { neutral: '', info: 'info', success: 'success', warning: 'warning', danger: 'error-state' };

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
  className?: string;
}
export function StatusBadge({ children, tone = 'neutral', icon, className = '' }: StatusBadgeProps) {
  return <span className={`tl-badge ${toneClass[tone]} ${className}`}>{icon}{children}</span>;
}

export interface CalloutProps {
  title: ReactNode;
  children: ReactNode;
  tone?: Exclude<StatusTone, 'neutral'>;
  icon?: ReactNode;
  action?: ReactNode;
  urgent?: boolean;
  className?: string;
}
export function Callout({ title, children, tone = 'info', icon, action, urgent = false, className = '' }: CalloutProps) {
  return <div className={`tl-callout ${toneClass[tone]} ${className}`} role={urgent ? 'alert' : undefined}>{icon}<div><strong>{title}</strong><div className="tl-callout-body">{children}</div>{action}</div></div>;
}

export interface DialogProps {
  open: boolean;
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  onRequestClose: () => void;
  initialFocus?: RefObject<HTMLElement | null>;
  returnFocus?: RefObject<HTMLElement | null>;
  closeLabel?: string;
  className?: string;
}

function Modal({ open, title, eyebrow, description, children, actions, onRequestClose, initialFocus, returnFocus, closeLabel = 'Close', className = '' }: DialogProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const initialFocusRef = useRef(initialFocus);
  const returnFocusRef = useRef(returnFocus);
  initialFocusRef.current = initialFocus;
  returnFocusRef.current = returnFocus;
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    (initialFocusRef.current?.current ?? heading.current)?.focus({ preventScroll: true });
    // Keep setup and teardown in the same effect so StrictMode reopens after cleanup.
    return () => {
      if (element.open) element.close();
      const target = returnFocusRef.current?.current ?? opener.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [open]);
  const containFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab' || event.defaultPrevented) return;
    const stops = tabbable(event.currentTarget);
    const current = document.activeElement;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!first) {
      event.preventDefault();
      heading.current?.focus({ preventScroll: true });
    } else if (event.shiftKey && (current === first || !stops.includes(current as HTMLElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const titleHeading = <h2 ref={heading} id={`${id}-title`} tabIndex={-1}>{title}</h2>;
  return <dialog ref={dialog} data-density="comfortable" className={`tl-dialog ${className}`} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} onKeyDown={containFocus} onCancel={event => { event.preventDefault(); onRequestClose(); }} onClose={event => { if (open && !event.currentTarget.open) onRequestClose(); }}>
    <div className="dialog-head">{eyebrow ? <div><div className="eyebrow">{eyebrow}</div>{titleHeading}</div> : titleHeading}<button type="button" className="tl-button icon-only" onClick={onRequestClose} aria-label={closeLabel}><CloseIcon /></button></div>
    {description && <p id={`${id}-description`}>{description}</p>}{children}{actions && <div className="dialog-actions">{actions}</div>}
  </dialog>;
}

export function Dialog(props: DialogProps) { return <Modal {...props} />; }

export interface DrawerProps extends DialogProps {
  modal: boolean;
}
function InspectorDrawer({ title, eyebrow, description, children, actions, onRequestClose, returnFocus, closeLabel, className }: DrawerProps) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef(returnFocus);
  returnFocusRef.current = returnFocus;
  useLayoutEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (root.current?.contains(document.activeElement)) {
        const target = returnFocusRef.current?.current ?? opener.current;
        if (target?.isConnected) target.focus({ preventScroll: true });
      }
    };
  }, []);
  const titleHeading = <h2 id={`${id}-title`}>{title}</h2>;
  return <aside ref={root} data-density="comfortable" className={`tl-dialog tl-drawer tl-inspector-drawer ${className ?? ''}`} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}>
    <div className="dialog-head">{eyebrow ? <div><div className="eyebrow">{eyebrow}</div>{titleHeading}</div> : titleHeading}<button type="button" className="tl-button icon-only" onClick={onRequestClose} aria-label={closeLabel ?? 'Close'}><CloseIcon /></button></div>
    {description && <p id={`${id}-description`}>{description}</p>}{children}{actions && <div className="dialog-actions">{actions}</div>}
  </aside>;
}
export function Drawer({ modal, ...props }: DrawerProps) {
  if (modal) return <Modal {...props} className={`tl-drawer ${props.className ?? ''}`} />;
  return props.open ? <InspectorDrawer {...props} modal={false} /> : null;
}

export interface NavigationItem {
  href: string;
  label: ReactNode;
  current?: boolean;
}
export interface NavigationGroup {
  label?: string;
  items: readonly NavigationItem[];
}
export interface NavigationProps {
  brand: ReactNode;
  groups: readonly NavigationGroup[];
  label?: string;
  menuLabel?: string;
  onNavigate?: (item: NavigationItem) => void;
}
export function Navigation({ brand, groups, label = 'Main navigation', menuLabel = 'Menu', onNavigate }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const renderLinks = (mobile: boolean) => <nav className="tl-navigation-links" aria-label={label}>{groups.map((group, index) => <div key={group.label ?? index}>{group.label && <div className="nav-group">{group.label}</div>}<div className="nav-links">{group.items.map(item => <a key={item.href} href={item.href} aria-current={item.current ? 'page' : undefined} onClick={event => { if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; if (mobile) flushSync(() => setOpen(false)); onNavigate?.(item); }}>{item.label}</a>)}</div></div>)}</nav>;
  return <><div className="tl-navigation-desktop"><div className="tl-navigation-brand">{brand}</div>{renderLinks(false)}</div><div className="tl-navigation-mobile"><div className="tl-navigation-brand">{brand}</div><button type="button" className="tl-button icon-only" onClick={() => setOpen(true)} aria-label={menuLabel} aria-haspopup="dialog" aria-expanded={open}><svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button><Dialog open={open} title={label} className="tl-navigation-dialog" onRequestClose={() => setOpen(false)}>{renderLinks(true)}</Dialog></div></>;
}

export interface ToastProps {
  open: boolean;
  message: string;
  onDismiss: () => void;
  action?: ReactNode;
  duration?: number;
  dismissLabel?: string;
}
export function Toast({ open, message, onDismiss, action, duration = 8000, dismissLabel = 'Dismiss notification' }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const clock = useRef({ open: false, message, duration, remaining: duration });
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => { if (!open) { setHovered(false); setFocused(false); } }, [open]);
  useEffect(() => {
    const previous = clock.current;
    if (!open || !previous.open || previous.message !== message || previous.duration !== duration) {
      clock.current = { open, message, duration, remaining: duration };
    }
    if (!open || hovered || focused || duration <= 0) return;
    const current = clock.current;
    const start = Date.now();
    const timer = window.setTimeout(() => dismiss.current(), current.remaining);
    return () => {
      window.clearTimeout(timer);
      current.remaining = Math.max(0, current.remaining - (Date.now() - start));
    };
  }, [open, message, duration, hovered, focused]);
  return <><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{open ? message : ''}</div>{open && <div className="tl-toast" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}><span>{message}</span>{action}<button type="button" className="tl-button icon-only" onClick={onDismiss} aria-label={dismissLabel}><CloseIcon /></button></div>}</>;
}
