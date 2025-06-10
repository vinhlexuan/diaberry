import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data?.session) {
          setStatus('Authentication successful! Redirecting...');
          // Redirect to dashboard or home page
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          setStatus('No session found. Try logging in again.');
        }
      } catch (error) {
        console.error('Error processing authentication:', error.message);
        setStatus(`Authentication failed: ${error.message}`);
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
      flexDirection: 'column'
    }}>
      <h2>{status}</h2>
    </div>
  );
}

export default AuthCallback;