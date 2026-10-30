import { useId, useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

function classes(...values: (string | undefined | false)[]) {
  return values.filter(Boolean).join(' ');
}

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  busy?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Button({ variant = 'secondary', busy = false, disabled, leadingIcon, trailingIcon, children, className, onClick, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} className={classes('tl-button', variant !== 'secondary' && variant, className)} disabled={disabled} aria-disabled={busy || undefined} aria-busy={busy || undefined} onClick={event => {
    if (busy || disabled) { event.preventDefault(); event.stopPropagation(); return; }
    onClick?.(event);
  }}>
    {busy ? <span className="spinner" aria-hidden="true" /> : leadingIcon}
    {children}{trailingIcon}
  </button>;
}

export type LinkProps = ComponentPropsWithoutRef<'a'> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' };
export function Link({ variant, className, ...props }: LinkProps) {
  return <a {...props} className={classes(variant && 'tl-button', variant && variant !== 'secondary' && variant, className) || undefined} />;
}

type FieldDescription = { label: ReactNode; helperText?: ReactNode; errorText?: ReactNode };
function descriptionIds(id: string, helperText: ReactNode, errorText: ReactNode, existing?: string) {
  return [existing, helperText != null && `${id}-hint`, errorText != null && `${id}-error`].filter(Boolean).join(' ') || undefined;
}
function FieldMessages({ id, helperText, errorText }: { id: string; helperText?: ReactNode; errorText?: ReactNode }) {
  return <>{helperText != null && <p className="hint" id={`${id}-hint`}>{helperText}</p>}{errorText != null && <p className="error" id={`${id}-error`}>{errorText}</p>}</>;
}

export type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> & FieldDescription;
export function TextField({ id: providedId, label, helperText, errorText, className, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: TextFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return <div className="tl-field"><label htmlFor={id}>{label}</label><input {...props} id={id} className={classes('tl-input', className)} aria-describedby={descriptionIds(id, helperText, errorText, describedBy)} aria-invalid={errorText != null ? true : invalid} /><FieldMessages id={id} helperText={helperText} errorText={errorText} /></div>;
}

export type SelectProps = ComponentPropsWithoutRef<'select'> & FieldDescription;
export function Select({ id: providedId, label, helperText, errorText, className, 'aria-describedby': describedBy, 'aria-invalid': invalid, children, ...props }: SelectProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return <div className="tl-field"><label htmlFor={id}>{label}</label><select {...props} id={id} className={className} aria-describedby={descriptionIds(id, helperText, errorText, describedBy)} aria-invalid={errorText != null ? true : invalid}>{children}</select><FieldMessages id={id} helperText={helperText} errorText={errorText} /></div>;
}

export type CheckboxProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'children'> & { label: ReactNode; indeterminate?: boolean };
export function Checkbox({ label, indeterminate = false, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <label className={classes('check-row', className)}><input {...props} ref={ref} type="checkbox" />{label}</label>;
}

export type SwitchProps = Omit<CheckboxProps, 'indeterminate'> & { helperText?: ReactNode };
export function Switch({ label, helperText, id: providedId, className, 'aria-describedby': describedBy, ...props }: SwitchProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return <div className="tl-field"><label className={classes('check-row', className)} htmlFor={id}><input {...props} id={id} type="checkbox" role="switch" aria-describedby={descriptionIds(id, helperText, undefined, describedBy)} />{label}</label><FieldMessages id={id} helperText={helperText} /></div>;
}

export type RadioGroupProps = Omit<ComponentPropsWithoutRef<'fieldset'>, 'children'> & { label: ReactNode; children: ReactNode; helperText?: ReactNode; errorText?: ReactNode };
export function RadioGroup({ id: providedId, label, children, helperText, errorText, className, 'aria-describedby': describedBy, ...props }: RadioGroupProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return <fieldset {...props} id={id} className={classes('tl-field', className)} aria-describedby={descriptionIds(id, helperText, errorText, describedBy)}><legend>{label}</legend>{children}<FieldMessages id={id} helperText={helperText} errorText={errorText} /></fieldset>;
}
export type RadioProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'children'> & { label: ReactNode };
export function Radio({ label, className, ...props }: RadioProps) {
  return <label className={classes('check-row', className)}><input {...props} type="radio" />{label}</label>;
}
