import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Coins, Printer, Sparkles, AlertCircle, FileText } from 'lucide-react';
import Modal from '../components/Modal';

export default function Payroll({ user }) {
  const [personalSlips, setPersonalSlips] = useState([]);
  const [allSlips, setAllSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'admin'

  // Run payroll configuration
  const [processMonth, setProcessMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  const [bonusOverrides, setBonusOverrides] = useState({});
  const [deductionOverrides, setDeductionOverrides] = useState({});
  
  // Payslip display modal
  const [selectedSlip, setSelectedSlip] = useState(null);

  const isHR = ['Admin', 'HR'].includes(user?.role);

  useEffect(() => {
    loadPayrollData();
  }, [user]);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      const personal = await api.getPayrollHistory();
      setPersonalSlips(personal);

      if (isHR) {
        const all = await api.getAllPayroll();
        setAllSlips(all);

        const emps = await api.getEmployees({ status: 'Active' });
        setEmployees(emps);
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to lock and process payroll for ${processMonth}?`)) return;
    
    try {
      await api.runPayroll(processMonth, { bonusOverrides, deductionOverrides });
      alert('Payroll run completed successfully!');
      loadPayrollData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOverrideChange = (empId, field, val) => {
    const numVal = val === '' ? '' : Number(val);
    if (field === 'bonus') {
      setBonusOverrides(prev => ({ ...prev, [empId]: numVal }));
    } else {
      setDeductionOverrides(prev => ({ ...prev, [empId]: numVal }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      
      {/* Print styles override */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 30px;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

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
            My Salary Slips
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'admin' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Payroll Console (Admin/HR)
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading Payroll Ledgers...</div>
      ) : activeTab === 'personal' ? (
        /* PERSONAL VIEW */
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>My Payroll Records</h4>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>Month</th>
                  <th style={{ padding: '12px 8px' }}>Release Date</th>
                  <th style={{ padding: '12px 8px' }}>Gross Salary</th>
                  <th style={{ padding: '12px 8px' }}>Total Deductions</th>
                  <th style={{ padding: '12px 8px' }}>Net Salary</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {personalSlips.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No salary slips generated yet.</td>
                  </tr>
                ) : (
                  personalSlips.map(slip => {
                    const gross = slip.basic + slip.allowance + slip.bonus;
                    const deductions = slip.deductions + slip.tax;
                    return (
                      <tr key={slip.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{slip.month}</td>
                        <td style={{ padding: '12px 8px' }}>{slip.processedDate}</td>
                        <td style={{ padding: '12px 8px' }}>${gross.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px' }}>${deductions.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--success)' }}>${slip.netSalary.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedSlip(slip)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            <FileText size={14} />
                            View Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* HR CONSOLE TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Run payroll configuration form */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <Coins size={20} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Generate Monthly Pay Period</h4>
            </div>

            <form onSubmit={handleRunPayroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Processing Month</label>
                  <input 
                    type="month" 
                    value={processMonth} 
                    onChange={(e) => setProcessMonth(e.target.value)} 
                    className="input-field" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                  <Sparkles size={16} />
                  Process & Send Slips
                </button>
              </div>

              {/* Adjust Custom overrides checklist */}
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
                  Active Roster Allowances & Deductions Adjustments (Optional)
                </p>
                <div style={{ overflowX: 'auto', maxHeight: '200px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-tertiary)', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 8px' }}>Employee Name</th>
                        <th style={{ padding: '10px 8px' }}>Basic Salary</th>
                        <th style={{ padding: '10px 8px' }}>Custom Bonus ($)</th>
                        <th style={{ padding: '10px 8px' }}>Custom Deduct ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <td style={{ padding: '8px' }}>
                            <div>{emp.name}</div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{emp.employeeId}</span>
                          </td>
                          <td style={{ padding: '8px' }}>${(emp.salary / 12).toFixed(2)}/mo</td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="number" 
                              placeholder="Default: 5%" 
                              value={bonusOverrides[emp.employeeId] ?? ''} 
                              onChange={(e) => handleOverrideChange(emp.employeeId, 'bonus', e.target.value)}
                              className="input-field" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', width: '110px' }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="number" 
                              placeholder="Default: 2%" 
                              value={deductionOverrides[emp.employeeId] ?? ''} 
                              onChange={(e) => handleOverrideChange(emp.employeeId, 'deduct', e.target.value)}
                              className="input-field" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', width: '110px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </form>
          </div>

          {/* Ledger records list */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Company Payroll Ledger</h4>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Employee</th>
                    <th style={{ padding: '12px 8px' }}>Month</th>
                    <th style={{ padding: '12px 8px' }}>Base</th>
                    <th style={{ padding: '12px 8px' }}>Bonus</th>
                    <th style={{ padding: '12px 8px' }}>Tax</th>
                    <th style={{ padding: '12px 8px' }}>Net</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {allSlips.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '20px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>No payroll processing ledger records found.</td>
                    </tr>
                  ) : (
                    allSlips.map(slip => (
                      <tr key={slip.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600 }}>{slip.name}</div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{slip.employeeId}</span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{slip.month}</td>
                        <td style={{ padding: '12px 8px' }}>${slip.basic.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--success)' }}>+${slip.bonus.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--danger)' }}>-${slip.tax.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>${slip.netSalary.toLocaleString()}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedSlip(slip)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            <FileText size={14} />
                            Open Slip
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Invoice slip View Modal */}
      <Modal isOpen={!!selectedSlip} onClose={() => setSelectedSlip(null)} title="Salary Statement">
        {selectedSlip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Printable Payslip Structure */}
            <div id="print-area" style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Corporation</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>100 Corporate Parkway, Suite 500</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>New York, NY 10001</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)' }}>PAYSLIP</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Month: {selectedSlip.month}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {selectedSlip.processedDate}</p>
                </div>
              </div>

              {/* Employee Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', marginBottom: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div>
                  <p><strong style={{ color: 'var(--text-secondary)' }}>Employee ID:</strong> {selectedSlip.employeeId}</p>
                  <p><strong style={{ color: 'var(--text-secondary)' }}>Name:</strong> {selectedSlip.name}</p>
                </div>
                <div>
                  <p><strong style={{ color: 'var(--text-secondary)' }}>Statement ID:</strong> {selectedSlip.id}</p>
                  <p><strong style={{ color: 'var(--text-secondary)' }}>Status:</strong> Paid</p>
                </div>
              </div>

              {/* Grid breakdown structure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.8rem' }}>
                {/* Earnings */}
                <div>
                  <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontWeight: 600, marginBottom: '8px', color: 'var(--success)' }}>Earnings</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Basic Salary</span>
                      <span>${selectedSlip.basic.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Allowance (15%)</span>
                      <span>${selectedSlip.allowance.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bonus Adjustment</span>
                      <span>${selectedSlip.bonus.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', fontWeight: 600 }}>
                      <span>Gross Earnings</span>
                      <span>${(selectedSlip.basic + selectedSlip.allowance + selectedSlip.bonus).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontWeight: 600, marginBottom: '8px', color: 'var(--danger)' }}>Deductions</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tax Withholding (10%)</span>
                      <span>${selectedSlip.tax.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Standard Deductions</span>
                      <span>${selectedSlip.deductions.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', fontWeight: 600 }}>
                      <span>Total Deductions</span>
                      <span>${(selectedSlip.tax + selectedSlip.deductions).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border-color)', marginTop: '20px', paddingTop: '12px', fontWeight: 700 }}>
                <span style={{ fontSize: '1rem' }}>NET PAYABLE SALARY</span>
                <span style={{ fontSize: '1.25rem', color: 'var(--success)' }}>${selectedSlip.netSalary.toLocaleString()}</span>
              </div>
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }} className="no-print">
              <button onClick={() => setSelectedSlip(null)} className="btn btn-secondary">Close</button>
              <button onClick={handlePrint} className="btn btn-primary">
                <Printer size={16} />
                Print Payslip
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
