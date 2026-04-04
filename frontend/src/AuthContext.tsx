import { createContext, createSignal, useContext, ParentComponent } from 'solid-js';

export interface AuthUser {
  user_id: number;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AuthContextValue {
  auth: () => AuthState;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>();

const STORAGE_KEY = 'prelegal_auth';

function loadFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { user: null, token: null };
}

export const AuthProvider: ParentComponent = (props) => {
  const [auth, setAuth] = createSignal<AuthState>(loadFromStorage());

  function login(token: string, user: AuthUser) {
    const state = { user, token };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function logout() {
    setAuth({ user: null, token: null });
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
