import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Megaphone,
  Clock,
  Award,
  CalendarCheck
} from 'lucide-react';
import Chart from '../components/Chart';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    monthlyPayroll: 0
  });
  const [deptChartData, setDeptChartData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [personalBalance, setPersonalBalance] = useState({});
  const [clockStatus, setClockStatus] = useState({ clockedIn: false, record: null });
  const [elapsedText, setElapsedText] = useState('00:00:00');
  const [loading, setLoading] = useState(true);

  const isHR = ['Admin', 'HR'].includes(user?.role);

  // Load dashboard data
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        // Load Announcements (all roles)
        const announce = await api.getAnnouncements();
        setAnnouncements(announce.slice(0, 4));

        if (isHR) {
          // HR/Admin statistics
          const employees = await api.getEmployees();
          const departments = await api.getDepartments();
          const attendance = await api.getAttendanceReports();
          const leaves = await api.getLeaveRequests();
          const payroll = await api.getAllPayroll();

          const todayStr = new Date().toISOString().split('T')[0];

          // Compute KPI numbers
          const present = attendance.filter(a => a.date === todayStr).length;
          
          const leavesToday = leaves.filter(l => {
            if (l.status !== 'Approved') return false;
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            const today = new Date(todayStr);
            return today >= start && today <= end;
          }).length;

          // Estimate monthly payroll (sum of active salaries / 12 for one month, or sum of processed payslips for current month)
          const currentMonth = todayStr.substring(0, 7); // 'YYYY-MM'
          const monthSlips = payroll.filter(p => p.month === currentMonth);
          const totalPayroll = monthSlips.length > 0 
            ? monthSlips.reduce((sum, s) => sum + s.netSalary, 0)
            : employees.reduce((sum, e) => sum + (e.salary / 12), 0);

          setStats({
            totalEmployees: employees.length,
            presentToday: present,
            onLeave: leavesToday,
            monthlyPayroll: Math.round(totalPayroll)
          });

          // Prepare department chart data
          const chartData = departments.map(d => ({
            name: d.name,
            value: d.employeeCount || 0
          }));
          setDeptChartData(chartData);

        } else {
          // Employee dashboard data
          const balance = await api.getLeaveBalance();
          setPersonalBalance(balance);

          // Get clock status
          const clock = await api.getAttendanceStatus();
          setClockStatus(clock);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user, isHR]);

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

  const handleClockIn = async () => {
    try {
      const res = await api.clockIn();
      setClockStatus({ clockedIn: true, record: res.record });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.clockOut();
      setClockStatus({ clockedIn: false, record: res.record });
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading Dashboard Overview...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Top Banner Card */}
      <div 
        className="glass-panel" 
        style={{
          padding: '24px 30px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(236, 72, 153, 0.05) 100%), var(--card-bg)',
          borderLeft: '4px solid var(--primary)'
        }}
      >
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
          Welcome back, {user?.name}!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Here is your company overview and action items for today.
        </p>
      </div>

      {/* Admin/HR Specific Dashboard */}
      {isHR && (
        <>
          {/* Key Metric stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Employees</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{stats.totalEmployees}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--success-glow)', color: 'var(--success)' }}>
                <CalendarCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Present Today</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{stats.presentToday}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--warning-glow)', color: 'var(--warning)' }}>
                <Calendar size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>On Leave Today</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{stats.onLeave}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--info-glow)', color: 'var(--info)' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Est. Monthly Payroll</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>${stats.monthlyPayroll.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Double Column Graph / Announcements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }} className="responsive-double-col">
            {/* Chart Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Department Distribution</h4>
              <Chart type="bar" data={deptChartData} />
            </div>

            {/* Announcements Panel */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <Megaphone size={20} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Company Announcements</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
                {announcements.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No announcements published.</p>
                ) : (
                  announcements.map(item => (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{item.content}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>By {item.author}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Employee Specific Dashboard */}
      {!isHR && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="responsive-double-col">
          {/* Left Column Clocker & Leave Balances */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Punch Clocker */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Daily Punch Clock</h4>
              </div>

              <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px', color: clockStatus.clockedIn ? 'var(--success)' : 'var(--text-primary)' }}>
                  {elapsedText}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {clockStatus.clockedIn ? (
                    <>
                      <div className="pulse-dot" />
                      <span>Clocked in at {new Date(clockStatus.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  ) : (
                    <span>Status: Off Duty</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
                <button
                  onClick={handleClockIn}
                  disabled={clockStatus.clockedIn}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Clock In
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={!clockStatus.clockedIn || !!clockStatus.record?.checkOut}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                >
                  Clock Out
                </button>
              </div>
            </div>

            {/* Leave Balances */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Leave Balances</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.keys(personalBalance).map(type => {
                  const allowed = personalBalance[type].allowed;
                  const used = personalBalance[type].used;
                  const left = allowed - used;
                  const pct = Math.min(100, Math.round((used / allowed) * 100));

                  return (
                    <div key={type} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                        <span>{type.split(' ')[0]}</span>
                        <span style={{ color: 'var(--primary)' }}>{left} / {allowed} left</span>
                      </div>
                      {/* Progress meter bar */}
                      <div style={{ height: '5px', backgroundColor: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column Announcements */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <Megaphone size={18} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Announcements</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              {announcements.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No announcements published.</p>
              ) : (
                announcements.map(item => (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{item.content}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>By {item.author}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .responsive-double-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
