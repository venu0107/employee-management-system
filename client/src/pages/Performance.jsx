import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Star, ShieldAlert, Sparkles, Plus, CheckSquare, Target, MessageSquare } from 'lucide-react';
import Modal from '../components/Modal';

export default function Performance({ user }) {
  const [reviews, setReviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab selector for HR/Admin
  const [activeTab, setActiveTab] = useState('goals'); // 'goals' or 'reviews'

  // Modal & Form states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    rating: '5',
    feedback: '',
    goalsSet: ''
  });

  const [goalForm, setGoalForm] = useState({
    goalText: '',
    targetDate: ''
  });

  const isHR = ['Admin', 'HR'].includes(user?.role);

  useEffect(() => {
    loadPerformanceData();
  }, [user]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Personal Goals
      const userGoals = await api.getGoals();
      setGoals(userGoals);

      // Reviews
      const userReviews = await api.getPerformanceReviews();
      setReviews(userReviews);

      // Roster if HR
      if (isHR) {
        const emps = await api.getEmployees({ status: 'Active' });
        setEmployees(emps);
        if (emps.length > 0) {
          setReviewForm(prev => ({ ...prev, employeeId: emps[0].employeeId }));
        }
      }
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.submitPerformanceReview(reviewForm);
      setIsReviewOpen(false);
      setReviewForm({ employeeId: employees[0]?.employeeId || '', rating: '5', feedback: '', goalsSet: '' });
      loadPerformanceData();
      alert('Review published successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createGoal(goalForm);
      setIsGoalOpen(false);
      setGoalForm({ goalText: '', targetDate: '' });
      loadPerformanceData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleGoal = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      await api.updateGoalStatus(id, nextStatus);
      loadPerformanceData();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          fill={i <= rating ? 'var(--warning)' : 'transparent'} 
          stroke={i <= rating ? 'var(--warning)' : 'var(--text-muted)'} 
          style={{ marginRight: '2px' }}
        />
      );
    }
    return <div style={{ display: 'flex' }}>{stars}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      
      {/* Tab controls */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
        <button 
          onClick={() => setActiveTab('goals')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'goals' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'goals' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          My Target Goals
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'reviews' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'reviews' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isHR ? 'Roster Reviews (Admin/HR)' : 'My Performance Reviews'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading logs...</div>
      ) : activeTab === 'goals' ? (
        /* TARGET GOALS CHECKLIST */
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Targets & Goal Checklist</h4>
            <button onClick={() => setIsGoalOpen(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <Plus size={16} />
              Set Goal
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {goals.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No active targets defined. Define a goal using the button above.
              </div>
            ) : (
              goals.map(item => (
                <div 
                  key={item.id} 
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={item.status === 'Completed'} 
                      onChange={() => handleToggleGoal(item.id, item.status)}
                      style={{ marginTop: '4px', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <div>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textDecoration: item.status === 'Completed' ? 'line-through' : 'none',
                        color: item.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)'
                      }}>
                        {item.goalText}
                      </p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Date: {item.targetDate}</span>
                    </div>
                  </div>
                  <span className={`badge ${item.status === 'Completed' ? 'badge-present' : 'badge-pending'}`} style={{ fontSize: '0.68rem' }}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* PERFORMANCE REVIEWS DECK */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isHR && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsReviewOpen(true)} className="btn btn-primary">
                <Sparkles size={16} />
                Conduct Performance Review
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No performance review statements found.
              </div>
            ) : (
              reviews.map(item => (
                <div key={item.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      {isHR && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.employeeId})</span>
                        </div>
                      )}
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reviewed by {item.reviewerName} on {item.reviewDate}
                      </p>
                    </div>
                    <div>
                      {renderStars(item.rating)}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <MessageSquare size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '3px' }} />
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reviewer Feedback:</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4 }}>
                          {item.feedback}
                        </p>
                      </div>
                    </div>

                    {item.goalsSet && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <Target size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '3px' }} />
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Target Goals:</strong>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4 }}>
                            {item.goalsSet}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Conduct Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Submit Roster Performance Review">
        <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Employee</label>
            <select 
              value={reviewForm.employeeId} 
              onChange={(e) => setReviewForm(prev => ({ ...prev, employeeId: e.target.value }))}
              className="input-field"
            >
              {employees.map(e => (
                <option key={e.id} value={e.employeeId}>{e.name} ({e.employeeId})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Performance Rating (1-5 Stars)</label>
            <select 
              value={reviewForm.rating} 
              onChange={(e) => setReviewForm(prev => ({ ...prev, rating: e.target.value }))}
              className="input-field"
            >
              <option value="5">★★★★★ - Outstanding (5)</option>
              <option value="4">★★★★☆ - Exceeds Expectations (4)</option>
              <option value="3">★★★☆☆ - Meets Expectations (3)</option>
              <option value="2">★★☆☆☆ - Needs Improvement (2)</option>
              <option value="1">★☆☆☆☆ - Unsatisfactory (1)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Review Feedback & Comments</label>
            <textarea 
              value={reviewForm.feedback} 
              onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Conduct evaluation reviews here..."
              className="input-field" 
              rows="4" 
              required 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Define New Development Goals (Optional)</label>
            <input 
              type="text"
              value={reviewForm.goalsSet} 
              onChange={(e) => setReviewForm(prev => ({ ...prev, goalsSet: e.target.value }))}
              placeholder="e.g. Complete cloud architectural training module"
              className="input-field" 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsReviewOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Review</button>
          </div>
        </form>
      </Modal>

      {/* Set Goal Modal */}
      <Modal isOpen={isGoalOpen} onClose={() => setIsGoalOpen(false)} title="Define Personal Work Target">
        <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Goal Description</label>
            <input 
              type="text" 
              value={goalForm.goalText}
              onChange={(e) => setGoalForm(prev => ({ ...prev, goalText: e.target.value }))}
              placeholder="e.g. Speed up database query indexations"
              className="input-field" 
              required 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Date</label>
            <input 
              type="date" 
              value={goalForm.targetDate}
              onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
              className="input-field" 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsGoalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Add Target</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
