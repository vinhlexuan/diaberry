import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
  setAuthCookies, 
  getAuthCookies, 
  clearAuthCookies,
  setCookie,
  getCookie 
} from '../utils/CookieUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // Only handle auth state changes after initial session check is complete
        if (!hasCheckedSession) return;
        
        if (event === 'SIGNED_IN' && session) {
          // Only process if we don't already have a session
          if (!sessionToken && !user) {
            await handleUserSession(session);
          }
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [hasCheckedSession, sessionToken, user]);

  const checkExistingSession = async () => {
    try {
      const { user: storedUser, sessionToken: storedToken, refreshToken } = getAuthCookies();
      
      if (storedToken && storedUser) {
        // Validate session with backend
        const response = await fetch('http://localhost:8080/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: storedToken })
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setSessionToken(storedToken);
          console.log('Session restored from cookies:', data.user);
        } else {
          // Session invalid, try to refresh
          if (refreshToken) {
            await attemptRefresh(refreshToken);
          } else {
            clearAuthCookies();
          }
        }
      } else {
        // Check for existing Supabase session (for direct dashboard access after OAuth)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !sessionToken && !user) {
          await handleUserSession(session);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      clearAuthCookies();
    } finally {
      setLoading(false);
      setHasCheckedSession(true);
    }
  };

  useEffect(() => {
    checkExistingSession();
  }, []);

  const attemptRefresh = async (refreshToken) => {
    try {
      const response = await fetch('http://localhost:8080/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        const { user: storedUser } = getAuthCookies();
        
        // Update cookies with new tokens
        setAuthCookies(storedUser, data.session.token, data.session.refresh_token);
        
        setSessionToken(data.session.token);
        setUser(storedUser);
        
        console.log('Session refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
    
    clearAuthCookies();
    return false;
  };

  const handleUserSession = async (supabaseSession) => {
    try {
      // Skip if we already have a session
      if (sessionToken && user) {
        console.log('Session already exists, skipping');
        return;
      }

      const supabaseUser = supabaseSession.user;
      
      const userData = {
        email: supabaseUser.email,
        google_id: supabaseUser.user_metadata?.sub || supabaseUser.id,
        first_name: supabaseUser.user_metadata?.given_name || 
                   supabaseUser.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: supabaseUser.user_metadata?.family_name || 
                  supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture
      };

      console.log('Creating new session for user:', userData);

      const response = await fetch('http://localhost:8080/auth/google/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store session data in cookies
        setAuthCookies(result.user, result.session.token, result.session.refresh_token);
        
        // Set user state
        setUser(result.user);
        setSessionToken(result.session.token);
        
        console.log('New user session created and stored in cookies:', result.user);
        
        // Redirect to dashboard after successful session creation
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      } else {
        throw new Error('Failed to create user session');
      }
    } catch (error) {
      console.error('Error handling user session:', error);
      clearAuthCookies();
    }
  };

  const signIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Invalidate session on backend
      if (sessionToken) {
        await fetch('http://localhost:8080/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: sessionToken })
        });
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      handleSignOut();
      
      // Redirect to login page after sign out
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      handleSignOut();
      window.location.href = '/login';
    }
  };

  const handleSignOut = () => {
    clearAuthCookies();
    setUser(null);
    setSessionToken(null);
    setHasCheckedSession(false);
  };

  // API helper with authentication
  const authenticatedFetch = async (url, options = {}) => {
    if (!sessionToken) {
      throw new Error('No session token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const { refreshToken } = getAuthCookies();
      if (refreshToken && await attemptRefresh(refreshToken)) {
        // Retry with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${sessionToken}`
          }
        });
      } else {
        // Refresh failed, sign out
        handleSignOut();
        throw new Error('Session expired');
      }
    }

    return response;
  };

  const value = {
    user,
    sessionToken,
    loading,
    signIn,
    signOut,
    authenticatedFetch,
    isAuthenticated: !!user && !!sessionToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};