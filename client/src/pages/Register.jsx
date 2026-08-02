import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function Register({ onRegisterSuccess, navigateToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'Employee',
    name: '',
    phone: '',
    department: 'IT',
    designation: '',
    salary: ''
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch departments for dropdown selection
  useEffect(() => {
    async function loadDepts() {
      try {
        const list = await api.getDepartments();
        setDepartments(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, department: list[0].name }));
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    }
    loadDepts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name || !formData.role) {
      setError('Please fill in all required fields (Name, Email, Password, Role)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.register(formData);
      onRegisterSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 45%), var(--bg-primary)',
      padding: '40px 20px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '30px 25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div>
          <button 
            onClick={navigateToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              padding: 0,
              marginBottom: '16px'
            }}
          >
            <ArrowLeft size={16} />
            Back to login
          </button>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            Register New Profile
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
            Fill out the details below to join the company roster
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Double column name / email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Password *</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                style={{ height: '42px' }}
              >
                <option value="Employee">Employee</option>
                <option value="HR">HR Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>

          {/* Profile fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input-field"
                style={{ height: '42px' }}
              >
                {departments.length === 0 ? (
                  <>
                    <option value="IT">IT</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="General">General</option>
                  </>
                ) : (
                  departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Designation</label>
              <input
                type="text"
                name="designation"
                placeholder="Software Engineer"
                value={formData.designation}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Annual Salary ($)</label>
              <input
                type="number"
                name="salary"
                placeholder="75000"
                value={formData.salary}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
            {loading ? 'Creating Account...' : 'Register Profile'}
            {!loading && <UserPlus size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
