import { clearAuthTokens, getAccessToken, getRefreshToken, setAccessToken } from './authTokens';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  const res = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json().catch(() => ({}));
  const nextToken = data?.data?.accessToken;
  if (typeof nextToken === 'string' && nextToken.length > 0) {
    setAccessToken(nextToken);
    return nextToken;
  }

  clearAuthTokens();
  return null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestInit = { ...init, headers };
  const res = await fetch(`${API_BASE}${path}`, requestInit);
  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    return data;
  }

  const canRefresh = res.status === 401 && !path.startsWith('/auth/') && Boolean(getRefreshToken());
  if (canRefresh) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      const retryHeaders = new Headers(init.headers || {});
      if (!retryHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${nextToken}`);

      const retryRes = await fetch(`${API_BASE}${path}`, { ...init, headers: retryHeaders });
      const retryData = await retryRes.json().catch(() => ({}));
      if (retryRes.ok) {
        return retryData;
      }

      throw new Error(retryData.message || 'API request failed');
    }
  }

  if (res.status === 401 && !path.startsWith('/auth/')) {
    clearAuthTokens();
  }

  throw new Error(data.message || 'API request failed');
}
