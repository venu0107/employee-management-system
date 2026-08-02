import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, Plus, Check, X, Ban, FileText } from 'lucide-react';
import Modal from '../components/Modal';

export default function Leave({ user }) {
  const [balances, setBalances] = useState({});
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'requests'

  // Modal & form states
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const isHR = ['Admin', 'HR'].includes(user?.role);

  useEffect(() => {
    loadLeaveData();
  }, [user]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      // Personal leave balances
      const bal = await api.getLeaveBalance();
      setBalances(bal);

      // Personal leave history
      const hist = await api.getLeaveHistory();
      setHistory(hist);

      // HR queue
      if (isHR) {
        const reqs = await api.getLeaveRequests();
        setRequests(reqs);
      }
    } catch (err) {
      console.error('Failed to load leave records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.applyLeave(formData);
      setIsApplyOpen(false);
      setFormData({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
      loadLeaveData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.reviewLeave(id, status);
      loadLeaveData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await api.cancelLeave(id);
        loadLeaveData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getStatusClass = (status) => {
    if (status === 'Approved') return 'badge-approved';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      {/* Tab controls */}
      {isHR && (
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
          <button 
            onClick={() => setActiveTab('personal')}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'personal' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'personal' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Leave Balances & History
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Approvals Queue
            {requests.filter(r => r.status === 'Pending').length > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                {requests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading leaves data...</div>
      ) : activeTab === 'personal' ? (
        <>
          {/* Top segment: Balances list & Apply Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>My Allowances</h4>
            <button onClick={() => setIsApplyOpen(true)} className="btn btn-primary">
              <Plus size={18} />
              Request Leave
            </button>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.keys(balances).map(type => {
              const b = balances[type];
              const left = b.allowed - b.used;
              return (
                <div key={type} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{type}</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '2px 0' }}>{left}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Allowed: {b.allowed}</span>
                    <span>Used: {b.used}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Personal History Table */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>My Leave Requests</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Type</th>
                    <th style={{ padding: '12px 8px' }}>Dates</th>
                    <th style={{ padding: '12px 8px' }}>Duration</th>
                    <th style={{ padding: '12px 8px' }}>Reason</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No leave requests submitted.</td>
                    </tr>
                  ) : (
                    history.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.leaveType}</td>
                        <td style={{ padding: '12px 8px' }}>{item.startDate} to {item.endDate}</td>
                        <td style={{ padding: '12px 8px' }}>{item.days} days</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>
                          {item.reason}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className={`badge ${getStatusClass(item.status)}`}>{item.status}</span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          {item.status === 'Pending' && (
                            <button 
                              onClick={() => handleCancel(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                transition: 'var(--transition-smooth)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Ban size={13} />
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* HR APPROVALS QUEUE */
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Leaves Approval Queue</h4>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>Employee</th>
                  <th style={{ padding: '12px 8px' }}>Leave Category</th>
                  <th style={{ padding: '12px 8px' }}>Requested Dates</th>
                  <th style={{ padding: '12px 8px' }}>Duration</th>
                  <th style={{ padding: '12px 8px' }}>Reason</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No requests in the ledger.</td>
                  </tr>
                ) : (
                  requests.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.employeeId}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 500 }}>{item.leaveType}</td>
                      <td style={{ padding: '12px 8px' }}>{item.startDate} to {item.endDate}</td>
                      <td style={{ padding: '12px 8px' }}>{item.days} days</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>
                        {item.reason}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${getStatusClass(item.status)}`}>{item.status}</span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {item.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleReview(item.id, 'Approved')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 500,
                                fontSize: '0.8rem',
                                transition: 'var(--transition-smooth)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(item.id, 'Rejected')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 500,
                                fontSize: '0.8rem',
                                transition: 'var(--transition-smooth)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Request Leave Absence">
        <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leave Type</label>
            <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} className="input-field">
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Paid Leave">Paid Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="input-field" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="input-field" required />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reason for Absence</label>
            <textarea name="reason" value={formData.reason} onChange={handleInputChange} className="input-field" rows="3" placeholder="Describe explanation..." required />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsApplyOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
