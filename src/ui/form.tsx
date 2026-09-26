import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../utils';

/* --------------------------------- Field -------------------------------- */

interface FieldValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required?: boolean;
}

const FieldContext = createContext<FieldValue | null>(null);

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  /** Error message; marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  /** Label beside the control instead of above. */
  inline?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, wired for screen readers. */
export function Field({ label, hint, error, required, inline, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: !!error, required }}>
      <div className={cx('xbd-field', inline && 'xbd-field--inline', !!error && 'is-invalid', className)}>
        {label && (
          <label className="xbd-field__label" htmlFor={id}>
            {label}
            {required && <span className="xbd-field__required" aria-hidden="true"> *</span>}
          </label>
        )}
        <div className="xbd-field__control">
          {children}
          {hint && !error && (
            <p id={hintId} className="xbd-field__hint">
              {hint}
            </p>
          )}
          {error && (
            <p id={errorId} className="xbd-field__error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </FieldContext.Provider>
  );
}

/** Props that connect a control to its surrounding <Field>. */
export function useFieldProps(props: { id?: string; required?: boolean; 'aria-describedby'?: string; 'aria-invalid'?: unknown }, invalid?: boolean) {
  const field = useContext(FieldContext);
  return {
    id: props.id ?? field?.id,
    required: props.required ?? field?.required,
    'aria-describedby': props['aria-describedby'] ?? field?.describedBy,
    'aria-invalid': (props['aria-invalid'] as boolean | undefined) ?? (invalid || field?.invalid || undefined),
  };
}

/* ------------------------------ Text inputs ----------------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Leading icon. */
  icon?: ReactNode;
  /** Trailing content: unit, button… */
  suffix?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon, suffix, invalid, className, ...rest }, ref) {
  const field = useFieldProps(rest, invalid);
  const input = <input ref={ref} className={cx('xbd-input', !icon && !suffix && className)} {...rest} {...field} />;
  if (!icon && !suffix) return input;
  return (
    <div className={cx('xbd-input-wrap', field['aria-invalid'] && 'is-invalid', className)}>
      {icon && <span className="xbd-input-wrap__icon">{icon}</span>}
      {input}
      {suffix && <span className="xbd-input-wrap__suffix">{suffix}</span>}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cx('xbd-input', 'xbd-textarea', className)} {...rest} {...useFieldProps(rest, invalid)} />;
});

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

/** Native select (fully accessible, works on touch) with kit styling. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, placeholder, invalid, className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx('xbd-input', 'xbd-select', className)} {...rest} {...useFieldProps(rest, invalid)}>
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options?.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {typeof o.label === 'string' ? o.label : o.value}
        </option>
      ))}
      {children}
    </select>
  );
});

/* ------------------------------- Choices -------------------------------- */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  /** Partially selected (e.g. "select all" with some rows selected). */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, indeterminate, className, ...rest }, ref) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLInputElement);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  const field = useFieldProps(rest);
  const box = <input ref={inner} type="checkbox" className="xbd-check__box" {...rest} {...field} />;
  if (label === undefined) return <span className={cx('xbd-check', className)}>{box}</span>;
  return (
    <label className={cx('xbd-check', className)}>
      {box}
      <span className="xbd-check__label">{label}</span>
    </label>
  );
});

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({ label, className, ...rest }, ref) {
  return (
    <label className={cx('xbd-switch', className)}>
      <input ref={ref} type="checkbox" role="switch" className="xbd-switch__input" {...rest} {...useFieldProps(rest)} />
      <span className="xbd-switch__track" aria-hidden="true" />
      {label !== undefined && <span className="xbd-switch__label">{label}</span>}
    </label>
  );
});

export interface RadioGroupProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  label?: string;
  className?: string;
}

export function RadioGroup({ options, value, onChange, name, orientation = 'vertical', label, className }: RadioGroupProps) {
  const auto = useId();
  const field = useContext(FieldContext);
  return (
    <div role="radiogroup" aria-label={label} aria-labelledby={label ? undefined : field?.id} className={cx('xbd-radios', `xbd-radios--${orientation}`, className)}>
      {options.map((o) => (
        <label key={o.value} className="xbd-check">
          <input
            type="radio"
            className="xbd-check__box xbd-check__box--radio"
            name={name ?? auto}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
          />
          <span className="xbd-check__label">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: ReactNode; icon?: ReactNode }>;
  onChange: (value: T) => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** A small set of mutually exclusive options shown as one control. */
export function SegmentedControl<T extends string>({ value, options, onChange, label, size = 'md', className }: SegmentedControlProps<T>) {
  return (
    <div className={cx('xbd-segmented', size === 'sm' && 'xbd-segmented--small', className)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={cx(value === o.value && 'is-active')} onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
