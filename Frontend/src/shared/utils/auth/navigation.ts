const LOGIN_REDIRECT_FLAG = 'auth:login-redirect-in-progress';

export const clearAuthSession = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const redirectToLoginOnce = (): void => {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  if (currentPath === '/login') {
    sessionStorage.removeItem(LOGIN_REDIRECT_FLAG);
    return;
  }

  if (sessionStorage.getItem(LOGIN_REDIRECT_FLAG) === 'true') {
    return;
  }

  sessionStorage.setItem(LOGIN_REDIRECT_FLAG, 'true');
  window.location.replace('/login');
};

export const clearLoginRedirectFlag = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LOGIN_REDIRECT_FLAG);
};
