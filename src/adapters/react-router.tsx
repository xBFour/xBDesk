import { useEffect, useRef, type ReactNode } from 'react';
import {
  MemoryRouter,
  useLocation,
  useNavigate,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_LocationContext as LocationContext,
  UNSAFE_RouteContext as RouteContext,
  type Location,
} from 'react-router-dom';
import { useWindow } from '../context';
import type { AppComponentProps, AppDefinition } from '../types';

/*
 * react-router adapter: every window gets its own in-memory router, so pages
 * can use useNavigate/useParams/<Link> without touching the browser URL, and
 * two windows of the same page can sit on different routes.
 */

const EMPTY_ROUTE_CONTEXT = { outlet: null, matches: [], isDataRoute: false };

/**
 * Hides the host application's router from its children. react-router refuses
 * a <Router> inside another one and would resolve nested <Routes> relative to
 * the host route (e.g. `/desktop`), so every router context is reset here.
 */
export function IsolatedRouterScope({ children }: { children: ReactNode }) {
  return (
    <DataRouterContext.Provider value={null}>
      <DataRouterStateContext.Provider value={null}>
        <LocationContext.Provider value={null as never}>
          <RouteContext.Provider value={EMPTY_ROUTE_CONTEXT as never}>{children}</RouteContext.Provider>
        </LocationContext.Provider>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  );
}

function TitleSync({ title }: { title: (location: Location) => string | null | undefined }) {
  const location = useLocation();
  const { setTitle } = useWindow();
  const text = title(location);
  useEffect(() => {
    if (text) setTitle(text);
  }, [text, setTitle]);
  return null;
}

export interface WindowRouterProps {
  /** First entry of the window's history. */
  initialPath: string;
  /** Keep the window title in sync with the current location. */
  title?: (location: Location) => string | null | undefined;
  /** Usually `<Routes>…</Routes>` or your application's route tree. */
  children: ReactNode;
}

/** An in-memory router scoped to one window, isolated from the host router. */
export function WindowRouter({ initialPath, title, children }: WindowRouterProps) {
  return (
    <IsolatedRouterScope>
      <MemoryRouter initialEntries={[initialPath]}>
        {title && <TitleSync title={title} />}
        {children}
      </MemoryRouter>
    </IsolatedRouterScope>
  );
}

export interface RouterAppArgs {
  /** Path to show; re-opening the app with a new `path` navigates the existing window. */
  path?: string;
}

/** Stores the current route so the window reopens there after a page reload. */
function RestoreSync() {
  const location = useLocation();
  const { setRestoreArgs } = useWindow();
  const path = location.pathname + location.search + location.hash;
  useEffect(() => {
    setRestoreArgs({ path } satisfies RouterAppArgs);
  }, [path, setRestoreArgs]);
  return null;
}

/** Navigates when the app is re-opened (single-instance) with new args. */
function ArgsNavigator({ args }: { args: RouterAppArgs | undefined }) {
  const navigate = useNavigate();
  const handled = useRef(args);
  useEffect(() => {
    if (handled.current === args) return;
    handled.current = args;
    if (args?.path) navigate(args.path);
  }, [args, navigate]);
  return null;
}

export interface RouterAppOptions extends Omit<AppDefinition<RouterAppArgs>, 'component'> {
  /** Path opened when the app starts, unless `args.path` is given. */
  path: string;
  /** Rendered inside the window's router — `<Routes>…</Routes>` or your whole route tree. */
  element: ReactNode;
  /** Window title for the current location; the app title is kept when it returns nothing. */
  windowTitle?: (location: Location) => string | null | undefined;
}

/**
 * Turns a route (or an entire route tree) into a desktop app:
 *
 * ```tsx
 * createRouterApp({ id: 'customers', title: 'Customers', path: '/customers', element: <AppRoutes /> })
 * api.openApp('customers', { path: '/customers/42' })
 * ```
 */
export function createRouterApp(options: RouterAppOptions): AppDefinition<RouterAppArgs> {
  const { path, element, windowTitle, ...app } = options;
  function RouterApp({ args }: AppComponentProps<RouterAppArgs>) {
    return (
      <WindowRouter initialPath={args?.path ?? path} title={windowTitle}>
        <ArgsNavigator args={args} />
        <RestoreSync />
        {element}
      </WindowRouter>
    );
  }
  RouterApp.displayName = `RouterApp(${app.id})`;
  return { ...app, component: RouterApp };
}
