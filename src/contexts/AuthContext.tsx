import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken as persistAccessToken,
  setRefreshToken as persistRefreshToken,
  subscribeToAuthTokenChanges,
} from '../lib/authTokens';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const isAuthenticated = Boolean(accessToken);

  useEffect(() => {
    return subscribeToAuthTokenChanges(() => {
      setAccessToken(getAccessToken());
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, organizationSlug: 'default-org' }),
    });

    setAccessToken(res.data.accessToken);
    persistAccessToken(res.data.accessToken);
    persistRefreshToken(res.data.refreshToken);
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    setAccessToken(null);
    clearAuthTokens();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
