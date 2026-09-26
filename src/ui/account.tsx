import { useState, type FormEvent, type ReactNode } from 'react';
import { useNow } from '../components/Clock';
import { PanelPopoverButton, usePanel } from '../components/Panel';
import { wallpaperStyle } from '../components/Wallpaper';
import { ChevronLeftIcon, EyeIcon, EyeOffIcon } from '../components/icons';
import { detectLocale, resolveLabels, type UiLabels } from '../i18n';
import type { Wallpaper } from '../types';
import { cx } from '../utils';
import { Avatar, Button } from './basic';
import { Checkbox, Field, Input } from './form';
import { ThemeScope, useUiLabels } from './shared';

/* ------------------------------ LoginScreen ------------------------------ */

export interface LoginUser {
  name: string;
  username: string;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  remember: boolean;
}

export interface LoginScreenProps {
  /**
   * Verify the credentials. Throw or return an error message (string) to show
   * it, return `false` for the generic message; anything else counts as success.
   */
  onLogin: (credentials: LoginCredentials) => unknown | Promise<unknown>;
  /** `unlock`: lock screen for `user`, password only. */
  mode?: 'login' | 'unlock';
  user?: LoginUser;
  /** Quick-pick accounts, like a desktop display manager. */
  users?: LoginUser[];
  defaultUsername?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  logo?: ReactNode;
  footer?: ReactNode;
  background?: Exclude<Wallpaper, { type: 'preset' }>;
  showClock?: boolean;
  showRemember?: boolean;
  colorScheme?: 'light' | 'dark';
  accentColor?: string;
  locale?: string;
  labels?: Partial<UiLabels>;
  /** Cover the viewport (`position: fixed`). Default `true`. */
  overlay?: boolean;
  className?: string;
}

const DEFAULT_BG: Exclude<Wallpaper, { type: 'preset' }> = {
  type: 'gradient',
  value: 'radial-gradient(circle at 20% 20%, #3a4f9a 0%, #1d2b64 45%, #0b1026 100%)',
};

/** Full-screen sign-in / lock screen in the desktop's visual language. Works with or without <Desktop>. */
export function LoginScreen({
  onLogin,
  mode = 'login',
  user,
  users = [],
  defaultUsername = '',
  title,
  subtitle,
  logo,
  footer,
  background = DEFAULT_BG,
  showClock = true,
  showRemember = true,
  colorScheme = 'dark',
  accentColor = '#3584e4',
  locale: localeProp,
  labels: labelOverrides,
  overlay = true,
  className,
}: LoginScreenProps) {
  const locale = localeProp ?? detectLocale();
  const L = resolveLabels(locale, { ui: labelOverrides }).ui;
  const now = useNow(1000);
  const [picked, setPicked] = useState<LoginUser | null>(user ?? (users.length === 1 ? users[0] : null));
  const [other, setOther] = useState(!user && users.length === 0);
  const [username, setUsername] = useState(user?.username ?? defaultUsername);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const activeUser = mode === 'unlock' ? user : picked;
  const needsPicker = mode === 'login' && !activeUser && !other && users.length > 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const name = activeUser?.username ?? username.trim();
    if (!name || !password) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onLogin({ username: name, password, remember });
      if (typeof result === 'string' || result === false) {
        setError(typeof result === 'string' ? result : L.loginFailed);
        setShake((n) => n + 1);
        setPassword('');
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : L.loginFailed);
      setShake((n) => n + 1);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const bgStyle = background.type === 'custom' ? undefined : wallpaperStyle(background);

  return (
    <ThemeScope colorScheme={colorScheme} accentColor={accentColor} locale={locale} labels={labelOverrides} className={cx('xbd-login', overlay && 'is-overlay', className)}>
      <div className="xbd-login__bg" style={bgStyle} aria-hidden="true">
        {background.type === 'custom' && background.render()}
      </div>
      <div className="xbd-login__shade" aria-hidden="true" />
      {showClock && (
        <div className="xbd-login__clock" aria-hidden="true">
          <time>{now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time>
          <span>{now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      )}
      <form key={shake} className={cx('xbd-login__card', shake > 0 && 'is-shaking')} onSubmit={submit} noValidate>
        {(logo || title) && (
          <div className="xbd-login__brand">
            {logo}
            {title && <h1 className="xbd-login__title">{title}</h1>}
            {subtitle && <p className="xbd-login__subtitle">{subtitle}</p>}
          </div>
        )}

        {needsPicker ? (
          <div className="xbd-login__users" role="list">
            {users.map((u) => (
              <button key={u.username} type="button" role="listitem" className="xbd-login__user-tile" onClick={() => setPicked(u)}>
                <Avatar name={u.name} src={u.avatar} size={44} />
                <span>{u.name}</span>
              </button>
            ))}
            <button type="button" role="listitem" className="xbd-login__user-tile" onClick={() => setOther(true)}>
              <Avatar name="?" size={44} />
              <span>{L.otherUser}</span>
            </button>
          </div>
        ) : (
          <>
            {activeUser ? (
              <div className="xbd-login__identity">
                <Avatar name={activeUser.name} src={activeUser.avatar} size={72} />
                <strong>{activeUser.name}</strong>
                {mode === 'login' && users.length > 1 && (
                  <button
                    type="button"
                    className="xbd-login__switch"
                    onClick={() => {
                      setPicked(null);
                      setPassword('');
                      setError(null);
                    }}
                  >
                    <ChevronLeftIcon /> {L.otherUser}
                  </button>
                )}
              </div>
            ) : (
              <Field label={L.username}>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
              </Field>
            )}
            <Field label={L.password}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus={!!activeUser}
                required
                suffix={
                  <button
                    type="button"
                    className="xbd-login__reveal"
                    aria-label={showPassword ? L.hidePassword : L.showPassword}
                    title={showPassword ? L.hidePassword : L.showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />
            </Field>
            {mode === 'login' && showRemember && <Checkbox label={L.rememberMe} checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            {error && (
              <p className="xbd-login__error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" block loading={busy} disabled={!password || !(activeUser || username.trim())}>
              {busy ? L.signingIn : mode === 'unlock' ? L.unlock : L.signIn}
            </Button>
          </>
        )}
      </form>
      {footer && <div className="xbd-login__footer">{footer}</div>}
    </ThemeScope>
  );
}

/* -------------------------------- UserMenu ------------------------------- */

export interface UserMenuAction {
  id?: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

export interface UserMenuProps {
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  /** Show the name next to the avatar on horizontal panels. */
  showName?: boolean;
  onProfile?: () => void;
  onSettings?: () => void;
  onLock?: () => void;
  onLogout?: () => void;
  /** Extra entries between the built-in ones. */
  actions?: UserMenuAction[];
}

const glyph = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ProfileGlyph = glyph('M8 8a3 3 0 100-6 3 3 0 000 6zM2.5 14c.8-2.6 3-4 5.5-4s4.7 1.4 5.5 4');
const SettingsGlyph = glyph('M8 10a2 2 0 100-4 2 2 0 000 4zM13 8a5 5 0 00-.1-1l1.4-1.1-1.5-2.6-1.7.6a5 5 0 00-1.7-1L9 1H7l-.4 1.9a5 5 0 00-1.7 1l-1.7-.6-1.5 2.6L3.1 7a5 5 0 000 2l-1.4 1.1 1.5 2.6 1.7-.6a5 5 0 001.7 1L7 15h2l.4-1.9a5 5 0 001.7-1l1.7.6 1.5-2.6L12.9 9c.1-.3.1-.7.1-1z');
const LockGlyph = glyph('M4.5 7V5a3.5 3.5 0 017 0v2M3.5 7h9v7h-9z');
const LogoutGlyph = glyph('M6 14H3.5a1 1 0 01-1-1V3a1 1 0 011-1H6M10.5 11l3-3-3-3M13.5 8H6');

/** Panel widget: avatar button with the account card and actions (profile, settings, lock, log out). */
export function UserMenu({ name, email, role, avatar, showName, onProfile, onSettings, onLock, onLogout, actions = [] }: UserMenuProps) {
  const L = useUiLabels();
  const { vertical } = usePanel();
  const entries: UserMenuAction[] = [
    ...(onProfile ? [{ id: 'profile', label: L.profile, icon: ProfileGlyph, onSelect: onProfile }] : []),
    ...(onSettings ? [{ id: 'settings', label: L.settings, icon: SettingsGlyph, onSelect: onSettings }] : []),
    ...actions,
  ];
  const session: UserMenuAction[] = [
    ...(onLock ? [{ id: 'lock', label: L.lock, icon: LockGlyph, onSelect: onLock }] : []),
    ...(onLogout ? [{ id: 'logout', label: L.logout, icon: LogoutGlyph, onSelect: onLogout, danger: true }] : []),
  ];
  const renderAction = (a: UserMenuAction, close: () => void, i: number) => (
    <button
      key={a.id ?? i}
      type="button"
      className={cx('xbd-usermenu__action', a.danger && 'is-danger')}
      onClick={() => {
        close();
        a.onSelect();
      }}
    >
      {a.icon}
      <span>{a.label}</span>
    </button>
  );
  return (
    <PanelPopoverButton
      className="xbd-usermenu-button"
      title={name}
      aria-label={name}
      align="end"
      popoverClassName="xbd-popover--usermenu"
      content={(close) => (
        <div className="xbd-usermenu">
          <div className="xbd-usermenu__who">
            <Avatar name={name} src={avatar} size={48} />
            <div>
              <strong>{name}</strong>
              {email && <span>{email}</span>}
              {role && <span className="xbd-usermenu__role">{role}</span>}
            </div>
          </div>
          {entries.length > 0 && <div className="xbd-usermenu__group">{entries.map((a, i) => renderAction(a, close, i))}</div>}
          {session.length > 0 && <div className="xbd-usermenu__group">{session.map((a, i) => renderAction(a, close, i))}</div>}
        </div>
      )}
    >
      <Avatar name={name} src={avatar} size={24} />
      {showName && !vertical && <span className="xbd-usermenu-button__name">{name}</span>}
    </PanelPopoverButton>
  );
}
