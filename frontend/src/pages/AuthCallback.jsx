import { useEffect, useState } from 'react';
import { Container, Paper, Typography, CircularProgress, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...');
  const { user, loading } = useAuth();

  useEffect(() => {
    setStatus('Authenticating and setting up your account...');
    
    // Update status as authentication progresses
    const timer1 = setTimeout(() => {
      setStatus('Creating your session...');
    }, 1000);

    const timer2 = setTimeout(() => {
      setStatus('Finalizing setup...');
    }, 2000);

    // If user is authenticated, redirect after a short delay
    if (user && !loading) {
      const redirectTimer = setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
      return () => clearTimeout(redirectTimer);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [user, loading]);

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <Paper sx={{ p: 4, textAlign: 'center', width: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <CircularProgress size={48} />
        </Box>
        
        <Typography variant="h6" gutterBottom>
          {user ? 'Success!' : 'Almost there...'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {user ? 'Redirecting to dashboard...' : status}
        </Typography>
      </Paper>
    </Container>
  );
}

export default AuthCallback;