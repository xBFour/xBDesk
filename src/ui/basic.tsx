import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { AlertIcon, CheckIcon, CloseIcon } from '../components/icons';
import { cx } from '../utils';
import { colorFor, initials, useUiLabels } from './shared';

/* -------------------------------- Button -------------------------------- */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Full width. */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', icon, iconRight, loading, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'xbd-button',
        variant !== 'default' && `xbd-button--${variant}`,
        size === 'sm' && 'xbd-button--small',
        size === 'lg' && 'xbd-button--large',
        block && 'xbd-button--block',
        loading && 'is-loading',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="xbd-spinner xbd-spinner--inline" aria-hidden="true" /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name, also shown as tooltip. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx('xbd-icon-button', variant !== 'ghost' && `xbd-icon-button--${variant}`, size === 'sm' && 'xbd-icon-button--small', className)}
      {...rest}
    >
      {icon}
    </button>
  );
});

/* ------------------------------ Badge / Chip ----------------------------- */

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: 'soft' | 'solid' | 'outline';
  icon?: ReactNode;
  /** Shows a remove button — filter chips, tags. */
  onRemove?: () => void;
}

/** Status label / chip. Never wraps; long text is truncated. */
export function Badge({ tone = 'neutral', variant = 'soft', icon, onRemove, className, children, ...rest }: BadgeProps) {
  const labels = useUiLabels();
  return (
    <span className={cx('xbd-badge', `xbd-badge--${tone}`, `xbd-badge--${variant}`, className)} {...rest}>
      {icon}
      <span className="xbd-badge__text">{children}</span>
      {onRemove && (
        <button type="button" className="xbd-badge__remove" aria-label={labels.remove} title={labels.remove} onClick={onRemove}>
          <CloseIcon />
        </button>
      )}
    </span>
  );
}

/* --------------------------------- Card --------------------------------- */

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons shown on the right of the header. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** Remove body padding (tables, lists). */
  flush?: boolean;
}

export function Card({ title, description, actions, footer, flush, className, children, ...rest }: CardProps) {
  return (
    <section className={cx('xbd-card', className)} {...rest}>
      {(title || actions) && (
        <header className="xbd-card__header">
          <div className="xbd-card__heading">
            {title && <h3 className="xbd-card__title">{title}</h3>}
            {description && <p className="xbd-card__description">{description}</p>}
          </div>
          {actions && <div className="xbd-card__actions">{actions}</div>}
        </header>
      )}
      <div className={cx('xbd-card__body', flush && 'is-flush')}>{children}</div>
      {footer && <footer className="xbd-card__footer">{footer}</footer>}
    </section>
  );
}

/* -------------------------------- Avatar -------------------------------- */

export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  status?: 'online' | 'away' | 'busy' | 'offline';
  className?: string;
}

export function Avatar({ name, src, size = 32, status, className }: AvatarProps) {
  return (
    <span
      className={cx('xbd-avatar', className)}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)), background: src ? undefined : colorFor(name) }}
      role="img"
      aria-label={name}
    >
      {src ? <img src={src} alt="" draggable={false} /> : initials(name)}
      {status && <span className={cx('xbd-avatar__status', `is-${status}`)} aria-hidden="true" />}
    </span>
  );
}

/* --------------------------------- Alert -------------------------------- */

export interface AlertProps {
  tone?: Exclude<Tone, 'neutral' | 'accent'>;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ tone = 'info', title, children, icon, onClose, className }: AlertProps) {
  const labels = useUiLabels();
  return (
    <div className={cx('xbd-alert', `xbd-alert--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="xbd-alert__icon">{icon ?? (tone === 'success' ? <CheckIcon /> : <AlertIcon />)}</span>
      <div className="xbd-alert__content">
        {title && <strong className="xbd-alert__title">{title}</strong>}
        {children && <div className="xbd-alert__body">{children}</div>}
      </div>
      {onClose && (
        <button type="button" className="xbd-icon-button xbd-icon-button--small" aria-label={labels.close} onClick={onClose}>
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

/* -------------------------- Progress / Spinner -------------------------- */

export interface ProgressProps {
  value?: number;
  max?: number;
  /** Unknown duration. */
  indeterminate?: boolean;
  label?: string;
  tone?: Tone;
  className?: string;
}

export function Progress({ value = 0, max = 100, indeterminate, label, tone = 'accent', className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cx('xbd-progress', `xbd-progress--${tone}`, indeterminate && 'is-indeterminate', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
    >
      <span className="xbd-progress__bar" style={indeterminate ? undefined : { width: `${pct}%` }} />
    </div>
  );
}

export function Spinner({ size = 18, label }: { size?: number; label?: string }) {
  return <span className="xbd-spinner" style={{ width: size, height: size }} role={label ? 'status' : undefined} aria-label={label} />;
}

/* ------------------------------ Empty state ----------------------------- */

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx('xbd-empty', className)}>
      {icon && <div className="xbd-empty__icon">{icon}</div>}
      <strong className="xbd-empty__title">{title}</strong>
      {description && <p className="xbd-empty__description">{description}</p>}
      {action}
    </div>
  );
}

/* -------------------------------- Toolbar ------------------------------- */

export function Toolbar({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cx('xbd-toolbar', className)} role="toolbar">
      {children}
    </div>
  );
}

export const ToolbarSpacer = () => <span className="xbd-toolbar__spacer" aria-hidden="true" />;
