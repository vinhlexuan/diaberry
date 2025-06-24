import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp,
  Person,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getCookie } from '../utils/CookieUtils';

function Header({ onSidebarToggle }) {
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const storedUser = getCookie('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
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
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Menu button */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onSidebarToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Desktop title */}
          {!isMobile && (
            <Typography 
              variant="h6" 
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              Personal Diary Calendar
            </Typography>
          )}
        </Box>

        {/* Right side - User info and sign out */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

        {/* User Menu - Mobile */}
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
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {userInfo?.email}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <ExitToApp fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Sign Out
            </ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;