/**
 * Cookie utility functions for authentication
 */

// Set a cookie with expiration
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;
};

// Get a cookie value
export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

// Delete a cookie
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Set authentication cookies
export const setAuthCookies = (user, sessionToken, refreshToken) => {
  setCookie('user', JSON.stringify(user), 30); // 30 days for user data
  setCookie('session_token', sessionToken, 7); // 7 days for session token
  setCookie('refresh_token', refreshToken, 30); // 30 days for refresh token
};

// Get authentication cookies
export const getAuthCookies = () => {
  const userCookie = getCookie('user');
  const sessionToken = getCookie('session_token');
  const refreshToken = getCookie('refresh_token');
  
  return {
    user: userCookie ? JSON.parse(userCookie) : null,
    sessionToken,
    refreshToken
  };
};

// Clear all authentication cookies
export const clearAuthCookies = () => {
  deleteCookie('user');
  deleteCookie('session_token');
  deleteCookie('refresh_token');
};