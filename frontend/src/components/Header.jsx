import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, User, BookOpen } from 'lucide-react';
import '../styles/Header.css';

function Header() {
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
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

  const currentPath = window.location.pathname;

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <BookOpen className="brand-icon" />
          <h1>Diaberry</h1>
        </div>

        <nav className="header-nav">
          <a 
            href="/dashboard" 
            className={`nav-link ${currentPath === '/dashboard' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            Dashboard
          </a>
          <a 
            href="/diary" 
            className={`nav-link ${currentPath === '/diary' ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            Manage Diary
          </a>
        </nav>

        <div className="header-user">
          {userInfo && (
            <div className="user-info">
              {userInfo.avatar_url ? (
                <img 
                  src={userInfo.avatar_url} 
                  alt="Profile" 
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  <User size={16} />
                </div>
              )}
              <span className="user-name">
                {userInfo.first_name || userInfo.email}
              </span>
            </div>
          )}
          <button onClick={handleSignOut} className="sign-out-btn">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;