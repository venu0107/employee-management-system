import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, UserPlus, Edit2, Trash2, Calendar, Phone, Mail, Award, Landmark } from 'lucide-react';
import Modal from '../components/Modal';

export default function Employees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: '', designation: '', salary: '', role: 'Employee', joiningDate: ''
  });

  const isHR = ['Admin', 'HR'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, [search, selectedDept]);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getEmployees({ search, department: selectedDept });
      setEmployees(list);

      const depts = await api.getDepartments();
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: departments[0]?.name || 'General',
      designation: '',
      salary: '',
      role: 'Employee',
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createEmployee(formData);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    // Find the linked user's role if needed, or assume default
    setFormData({
      name: emp.name,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      salary: emp.salary,
      status: emp.status,
      role: 'Employee' // Role is checked in backend update
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateEmployee(editingEmp.id, formData);
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This will purge all associated user credentials and logs.')) {
      try {
        await api.deleteEmployee(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      {/* Search and Action Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by ID, name, email or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="input-field"
            style={{ width: '160px' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {isHR && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <UserPlus size={18} />
            Onboard Employee
          </button>
        )}
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Querying directory...</div>
      ) : employees.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No employees found matching the filters.
        </div>
      ) : (
        <div className="grid-cards">
          {employees.map(emp => (
            <div key={emp.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.employeeId}</span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{emp.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>{emp.designation}</p>
                </div>
                
                {/* Actions */}
                {isHR && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => openEditModal(emp)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Card Meta Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{emp.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{emp.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{emp.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>Joined {emp.joiningDate}</span>
                </div>
                {isHR && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Award size={14} style={{ color: 'var(--warning)' }} />
                    <span>${emp.salary.toLocaleString()} / year</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                <span className={`badge ${emp.status === 'Active' ? 'badge-present' : 'badge-absent'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  {emp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Employee Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Onboard New Employee">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="input-field">
                <option value="Employee">Employee</option>
                <option value="HR">HR Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange} className="input-field">
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Designation</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="input-field" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Salary ($/yr)</label>
              <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className="input-field" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Joining Date</label>
              <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className="input-field" required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Profile</button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Profile: ${editingEmp?.name}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" />
          </div>
          {isHR && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Department</label>
                  <select name="department" value={formData.department} onChange={handleInputChange} className="input-field">
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="input-field" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Salary ($/yr)</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} className="input-field" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="input-field">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
