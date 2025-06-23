import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Person,
  ExitToApp,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Header({ onSidebarToggle }) {
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('user');
      localStorage.removeItem('supabase_session');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={1}
      sx={{ 
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Page Title - will be updated per page */}
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            flex: 1,
          }}
        >
          Personal Diary Calendar
        </Typography>

        {/* User Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* User Info */}
          {userInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={userInfo.avatar_url}
                sx={{ 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 },
                  cursor: 'pointer' 
                }}
                onClick={handleMenuOpen}
              >
                {!userInfo.avatar_url && <Person />}
              </Avatar>
              {!isMobile && (
                <Chip
                  label={userInfo.first_name || userInfo.email}
                  variant="outlined"
                  size="small"
                  onClick={handleMenuOpen}
                  sx={{ cursor: 'pointer' }}
                />
              )}
            </Box>
          )}

          {/* Sign Out Button - Desktop */}
          {!isMobile && (
            <Button
              startIcon={<ExitToApp />}
              onClick={handleSignOut}
              variant="outlined"
              color="error"
              size="small"
            >
              Sign Out
            </Button>
          )}
        </Box>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {userInfo && (
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">
                  {userInfo.first_name} {userInfo.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {userInfo.email}
                </Typography>
              </Box>
            </MenuItem>
          )}
          <MenuItem onClick={handleSignOut}>
            <ExitToApp sx={{ mr: 1 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;