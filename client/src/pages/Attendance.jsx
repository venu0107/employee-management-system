import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, Calendar, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export default function Attendance({ user }) {
  const [clockStatus, setClockStatus] = useState({ clockedIn: false, record: null });
  const [personalLogs, setPersonalLogs] = useState([]);
  const [hrLogs, setHrLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsedText, setElapsedText] = useState('00:00:00');
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'report'

  const isHR = ['Admin', 'HR'].includes(user?.role);

  useEffect(() => {
    loadAttendance();
  }, [user]);

  // Live timer for clock-in elapsed hours
  useEffect(() => {
    let timer;
    if (clockStatus.clockedIn && clockStatus.record?.checkIn) {
      const start = new Date(clockStatus.record.checkIn);
      const updateTimer = () => {
        const diffMs = new Date() - start;
        const secs = Math.floor((diffMs / 1000) % 60);
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        
        const pad = (num) => String(num).padStart(2, '0');
        setElapsedText(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setElapsedText('00:00:00');
    }
    return () => clearInterval(timer);
  }, [clockStatus]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      
      // Personal details
      const clock = await api.getAttendanceStatus();
      setClockStatus(clock);

      const pLogs = await api.getAttendanceLogs();
      setPersonalLogs(pLogs);

      if (isHR) {
        const hLogs = await api.getAttendanceReports();
        setHrLogs(hLogs);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const res = await api.clockIn();
      setClockStatus({ clockedIn: true, record: res.record });
      loadAttendance();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.clockOut();
      setClockStatus({ clockedIn: false, record: res.record });
      loadAttendance();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      {/* Header controls for HR tabs */}
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
            My Punch-Card
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'report' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'report' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All Logs (Admin/HR)
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading Logs...</div>
      ) : activeTab === 'personal' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }} className="attendance-layout">
          {/* Left panel clocking widget */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <Clock size={20} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Daily Timecard</h4>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px', color: clockStatus.clockedIn ? 'var(--success)' : 'var(--text-primary)' }}>
                {elapsedText}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {clockStatus.clockedIn ? `Clocked in at ${formatTime(clockStatus.record.checkIn)}` : 'You are currently off duty'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button 
                onClick={handleClockIn} 
                disabled={clockStatus.clockedIn} 
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Punch Clock In
              </button>
              <button 
                onClick={handleClockOut} 
                disabled={!clockStatus.clockedIn || !!clockStatus.record?.checkOut} 
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                Punch Clock Out
              </button>
            </div>
          </div>

          {/* Right panel history list */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Clocking Logs</h4>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Punch In</th>
                    <th style={{ padding: '12px 8px' }}>Punch Out</th>
                    <th style={{ padding: '12px 8px' }}>Duration</th>
                    <th style={{ padding: '12px 8px' }}>Overtime</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No clocking logs yet.</td>
                    </tr>
                  ) : (
                    personalLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{log.date}</td>
                        <td style={{ padding: '12px 8px' }}>{formatTime(log.checkIn)}</td>
                        <td style={{ padding: '12px 8px' }}>{formatTime(log.checkOut)}</td>
                        <td style={{ padding: '12px 8px' }}>{log.workingHours} hrs</td>
                        <td style={{ padding: '12px 8px', color: log.overtime > 0 ? 'var(--success)' : 'inherit' }}>
                          {log.overtime > 0 ? `+${log.overtime} hrs` : '--'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className="badge badge-present">{log.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* HR aggregated reports tab */
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Organization Attendance Logs</h4>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>Employee</th>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Check In</th>
                  <th style={{ padding: '12px 8px' }}>Check Out</th>
                  <th style={{ padding: '12px 8px' }}>Working Hours</th>
                  <th style={{ padding: '12px 8px' }}>Overtime</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hrLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No clocking logs in system.</td>
                  </tr>
                ) : (
                  hrLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 600 }}>{log.name}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.employeeId}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{log.date}</td>
                      <td style={{ padding: '12px 8px' }}>{formatTime(log.checkIn)}</td>
                      <td style={{ padding: '12px 8px' }}>{formatTime(log.checkOut)}</td>
                      <td style={{ padding: '12px 8px' }}>{log.workingHours} hrs</td>
                      <td style={{ padding: '12px 8px', color: log.overtime > 0 ? 'var(--success)' : 'inherit' }}>
                        {log.overtime > 0 ? `+${log.overtime} hrs` : '--'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="badge badge-present">{log.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .attendance-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
