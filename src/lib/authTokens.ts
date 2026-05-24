const ACCESS_TOKEN_KEY = 'cloudshield_access_token';
const REFRESH_TOKEN_KEY = 'cloudshield_refresh_token';
const AUTH_TOKENS_CHANGED_EVENT = 'cloudshield-auth-tokens-changed';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notifyAuthTokenChange();
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
  notifyAuthTokenChange();
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyAuthTokenChange();
}

export function subscribeToAuthTokenChanges(onChange: () => void) {
  const handleCustomEvent = () => onChange();
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY || event.key === REFRESH_TOKEN_KEY || event.key === null) {
      onChange();
    }
  };

  window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

function notifyAuthTokenChange() {
  window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED_EVENT));
}