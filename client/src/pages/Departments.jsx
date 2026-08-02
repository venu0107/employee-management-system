import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit3, Trash, User, Landmark, Coins } from 'lucide-react';
import Modal from '../components/Modal';

export default function Departments({ user }) {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', manager: '', budget: '' });

  const isHR = ['Admin', 'HR'].includes(user?.role);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getDepartments();
      setDepartments(list);

      const emps = await api.getEmployees();
      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData({ name: '', manager: '', budget: '' });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment(formData);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      manager: dept.manager,
      budget: dept.budget
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateDepartment(editingDept.id, formData);
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? Employees inside this department will be reassigned to General.')) {
      try {
        await api.deleteDepartment(id);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      {/* Page header and Add Button */}
      {isHR && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} />
            Create Department
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading catalog...</div>
      ) : (
        <div className="grid-cards">
          {departments.map(dept => {
            // Find employees in this department
            const deptEmps = employees.filter(e => e.department === dept.name);
            // Sum salaries to show budget consumption
            const spentSalary = deptEmps.reduce((sum, e) => sum + e.salary, 0);
            const utilizationPct = dept.budget > 0 ? Math.min(100, Math.round((spentSalary / dept.budget) * 100)) : 0;

            return (
              <div key={dept.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dept.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manager: {dept.manager}</span>
                  </div>

                  {isHR && dept.name !== 'General' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => openEditModal(dept)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(dept.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* KPI metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} style={{ color: 'var(--primary)' }} />
                    <div>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>Employees</p>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dept.employeeCount || 0}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={16} style={{ color: 'var(--success)' }} />
                    <div>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1 }}>Budget</p>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>${dept.budget.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Budget Utilization bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Salary Consumption</span>
                    <span style={{ color: utilizationPct > 90 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      ${spentSalary.toLocaleString()} ({utilizationPct}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${utilizationPct}%`, 
                        height: '100%', 
                        backgroundColor: utilizationPct > 90 ? 'var(--danger)' : 'var(--success)', 
                        transition: 'width 0.4s ease' 
                      }} 
                    />
                  </div>
                </div>

                {/* Team Avatars list */}
                <div style={{ marginTop: '4px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Department Members</p>
                  {deptEmps.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No members currently assigned</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {deptEmps.map(emp => (
                        <div 
                          key={emp.id} 
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontWeight: 500
                          }}
                          title={emp.designation}
                        >
                          {emp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Department">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Department Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required placeholder="e.g. Engineering" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manager Name</label>
            <input type="text" name="manager" value={formData.manager} onChange={handleInputChange} className="input-field" placeholder="e.g. Dwight Schrute" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operating Budget ($/year)</label>
            <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} className="input-field" placeholder="e.g. 150000" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Department: ${editingDept?.name}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Department Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manager Name</label>
            <input type="text" name="manager" value={formData.manager} onChange={handleInputChange} className="input-field" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operating Budget ($/year)</label>
            <input type="number" name="budget" value={formData.budget} onChange={handleInputChange} className="input-field" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
