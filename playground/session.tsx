import { createContext, useContext } from 'react';

// Demo oturumu: gerçek kimlik doğrulama yok; kullanıcı bu tarayıcı sekmesinde (sessionStorage) tutulur.

export interface DemoUser {
  name: string;
  username: string;
  email: string;
  role: string;
}

export const DEMO_USERS: DemoUser[] = [
  { name: 'Demo Kullanıcı', username: 'demo', email: 'demo@example.com', role: 'Yönetici' },
  { name: 'Ayşe Demir', username: 'ayse', email: 'ayse@example.com', role: 'Muhasebe' },
];

const KEY = 'xbdesk-demo-user';

export function loadUser(): DemoUser | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: DemoUser | null): void {
  try {
    if (user) sessionStorage.setItem(KEY, JSON.stringify(user));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* depolama kapalı olabilir */
  }
}

const DemoUserContext = createContext<DemoUser>(DEMO_USERS[0]);
export const DemoUserProvider = DemoUserContext.Provider;
export const useDemoUser = () => useContext(DemoUserContext);
