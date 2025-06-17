import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (hasProcessed.current) {
        console.log('Already processed, skipping...');
        return;
      }

      hasProcessed.current = true;

      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data?.session?.user) {
          setStatus('Authentication successful! Creating user...');
          
          const user = data.session.user;
          
          const userData = {
            email: user.email,
            google_id: user.user_metadata?.sub || user.id,
            first_name: user.user_metadata?.given_name || 
                       user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.family_name || 
                      user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
          };

          console.log('Sending user data to backend:', userData);

          const response = await fetch('http://localhost:8080/auth/google/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
          });

          if (response.ok) {
            const result = await response.json();
            console.log('User created/updated:', result.user);
            setStatus('User created successfully! Redirecting to dashboard...');
            
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('supabase_session', JSON.stringify(data.session));
            
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1500);
          } else if (response.status === 409) {
            setStatus('User already exists! Redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create user in database');
          }
        } else {
          setStatus('No session found. Try logging in again.');
        }
      } catch (error) {
        console.error('Error processing authentication:', error);
        setStatus(`Authentication failed: ${error.message}`);
        hasProcessed.current = false;
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h2>{status}</h2>
      {status.includes('failed') && (
        <button onClick={() => window.location.href = '/login'}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default AuthCallback;