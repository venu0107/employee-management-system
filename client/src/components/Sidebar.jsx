import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FolderTree, 
  Clock, 
  CalendarDays, 
  CreditCard, 
  TrendingUp, 
  LogOut,
  Building2
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, user, onLogout, isMobileOpen, setIsMobileOpen }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'HR', 'Employee'] },
    { id: 'employees', name: 'Employees', icon: Users, roles: ['Admin', 'HR', 'Employee'] },
    { id: 'departments', name: 'Departments', icon: FolderTree, roles: ['Admin', 'HR', 'Employee'] },
    { id: 'attendance', name: 'Attendance', icon: Clock, roles: ['Admin', 'HR', 'Employee'] },
    { id: 'leave', name: 'Leave Tracker', icon: CalendarDays, roles: ['Admin', 'HR', 'Employee'] },
    { id: 'payroll', name: 'Payroll', icon: CreditCard, roles: ['Admin', 'HR', 'Employee'] },
    { id: 'performance', name: 'Performance', icon: TrendingUp, roles: ['Admin', 'HR', 'Employee'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const handleNav = (id) => {
    setCurrentPage(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(calc(-1 * var(--sidebar-width)))'
        }}
        className="sidebar-responsive"
      >
        {/* Brand/Logo */}
        <div style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Building2 size={28} style={{ color: 'var(--primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.1 }}>Enterprise</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMS Portal v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={20} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              color: '#fff',
              fontSize: '0.9rem'
            }}>
              {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.name || 'Loading...'}
              </p>
              <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Adjust styles for responsiveness */}
      <style>{`
        @media (min-width: 1024px) {
          .sidebar-responsive {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}
