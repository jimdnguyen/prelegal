import { createContext, createSignal, useContext, ParentComponent } from 'solid-js';

export interface AuthUser {
  user_id: number;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isGuest: boolean;
}

interface AuthContextValue {
  auth: () => AuthState;
  login: (token: string, user: AuthUser) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>();

const STORAGE_KEY = 'prelegal_auth';

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return { user: null, token: null, isGuest: false };
}

export const AuthProvider: ParentComponent = (props) => {
  const [auth, setAuth] = createSignal<AuthState>(loadFromStorage());

  function login(token: string, user: AuthUser) {
    const state = { user, token, isGuest: false };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loginAsGuest() {
    const state = { user: null, token: null, isGuest: true };
    setAuth(state);
    localStorage.removeItem(STORAGE_KEY);
  }

  function logout() {
    setAuth({ user: null, token: null, isGuest: false });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('prelegal_guest_form');
  }

  return (
    <AuthContext.Provider value={{ auth, login, loginAsGuest, logout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
