import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

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

  useEffect(() => {
    checkExistingSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          await handleUserSession(session);
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedToken = localStorage.getItem('session_token');
      const storedUser = localStorage.getItem('user');
      
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
          console.log('Session restored:', data.user);
        } else {
          // Session invalid, try to refresh
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await attemptRefresh(refreshToken);
          } else {
            clearStoredAuth();
          }
        }
      } else {
        // Check if there's a Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleUserSession(session);
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      clearStoredAuth();
    } finally {
      setLoading(false);
    }
  };

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
        localStorage.setItem('session_token', data.session.token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        setSessionToken(data.session.token);
        return true;
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
    
    clearStoredAuth();
    return false;
  };

  const handleUserSession = async (supabaseSession) => {
    try {
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

      const response = await fetch('http://localhost:8080/auth/google/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store session data
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('session_token', result.session.token);
        localStorage.setItem('refresh_token', result.session.refresh_token);
        
        setUser(result.user);
        setSessionToken(result.session.token);
        
        console.log('User session created:', result.user);
      } else {
        throw new Error('Failed to create user session');
      }
    } catch (error) {
      console.error('Error handling user session:', error);
      clearStoredAuth();
    }
  };

  const signIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`
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
    } catch (error) {
      console.error('Error signing out:', error);
      handleSignOut();
    }
  };

  const handleSignOut = () => {
    clearStoredAuth();
    setUser(null);
    setSessionToken(null);
  };

  const clearStoredAuth = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('session_token');
    localStorage.removeItem('refresh_token');
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
      const refreshToken = localStorage.getItem('refresh_token');
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