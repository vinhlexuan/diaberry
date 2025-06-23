import { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children, title = "Personal Diary Calendar" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen}
        onClose={handleSidebarClose}
        onToggle={handleSidebarToggle}
      />

      {/* Main Content Area */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}>
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />
        
        {/* Page Content */}
        <Box component="main" sx={{ 
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;