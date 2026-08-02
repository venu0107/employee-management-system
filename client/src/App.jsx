import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';

export default function App() {
  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'register'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [appInitializing, setAppInitializing] = useState(true);

  // 1. Initial Authentication Check and Theme Selection
  useEffect(() => {
    // Load theme setting
    const savedTheme = localStorage.getItem('ems_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    async function checkSession() {
      const token = localStorage.getItem('ems_token');
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
        } catch (err) {
          console.warn('Session expired or token corrupt. Cleared session.', err);
          api.logout();
        }
      }
      setAppInitializing(false);
    }
    checkSession();
  }, []);

  // 2. Fetch Notifications and announcements periodically if logged in
  useEffect(() => {
    if (!user) return;

    async function fetchAlerts() {
      try {
        const list = await api.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }

    fetchAlerts();
    // Poll notifications every 30 seconds for background activities
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('ems_theme', nextTheme);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setNotifications([]);
    setAuthPage('login');
  };

  if (appInitializing) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#080c14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>Enterprise EMS</h2>
          <span style={{ fontSize: '0.85rem' }}>Initializing session portal...</span>
        </div>
      </div>
    );
  }

  // Gateway Layout (Unauthenticated)
  if (!user) {
    return authPage === 'login' ? (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        navigateToRegister={() => setAuthPage('register')} 
      />
    ) : (
      <Register 
        onRegisterSuccess={handleRegisterSuccess} 
        navigateToLogin={() => setAuthPage('login')} 
      />
    );
  }

  // Active Workspace Layout (Authenticated)
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'employees':
        return <Employees user={user} />;
      case 'departments':
        return <Departments user={user} />;
      case 'attendance':
        return <Attendance user={user} />;
      case 'leave':
        return <Leave user={user} />;
      case 'payroll':
        return <Payroll user={user} />;
      case 'performance':
        return <Performance user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      
      {/* Sidebar Panel */}
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Workspace Panel */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: 'var(--sidebar-width)'
        }}
        className="main-layout-responsive"
      >
        {/* Header Bar */}
        <Header 
          pageTitle={currentPage}
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          notifications={notifications}
          setNotifications={setNotifications}
        />

        {/* Inner Content scroll Viewport */}
        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto'
        }}>
          {renderPage()}
        </main>
      </div>

      {/* Dynamic layouts for responsive mobile widths */}
      <style>{`
        @media (max-width: 1023px) {
          .main-layout-responsive {
            margin-left: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
