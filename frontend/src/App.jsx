import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<AuthCallback />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
