import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  check_in_time: string | null;
  check_out_time: string | null;
  leave_reason: string | null;
  leave_approved: boolean;
  marked_by: string;
}

interface Stats {
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
  streak: number;
}

interface TodayStatus {
  today: AttendanceRecord | null;
  hasActiveInternship: boolean;
  enrollment: { id: string; domain: string; start_date: string; end_date: string; can_self_add?: boolean } | null;
}

const getToken = () => localStorage.getItem('hx_student_token');
const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const formatTime = (time: string | null) => {
  if (!time) return '--';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function StudentAttendance() {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Leave modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Self-add past attendance modal
  const [showSelfAddModal, setShowSelfAddModal] = useState(false);
  const [selfAddForm, setSelfAddForm] = useState({
    date: '', status: 'present',
    check_in_time: '10:00', check_out_time: '17:00', leave_reason: ''
  });
  const [selfAddLoading, setSelfAddLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [todayRes, myRes] = await Promise.all([
        axios.get(`${API}/attendance/today`, authHeaders()),
        axios.get(`${API}/attendance/my`, authHeaders()),
      ]);
      setTodayStatus(todayRes.data);
      setRecords(myRes.data.records);
      setStats(myRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/attendance/checkin`, {}, authHeaders());
      showToast('Checked in successfully! 🎉', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Check-in failed', 'error');
    } finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/attendance/checkout`, {}, authHeaders());
      showToast('Checked out successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Check-out failed', 'error');
    } finally { setActionLoading(false); }
  };

  const handleLeaveApply = async () => {
    if (!leaveDate || !leaveReason.trim()) { showToast('Please fill all fields', 'error'); return; }
    setLeaveLoading(true);
    try {
      await axios.post(`${API}/attendance/leave`, { date: leaveDate, leave_reason: leaveReason }, authHeaders());
      showToast('Leave applied successfully!', 'success');
      setShowLeaveModal(false);
      setLeaveDate(''); setLeaveReason('');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Leave apply failed', 'error');
    } finally { setLeaveLoading(false); }
  };

  const handleSelfAdd = async () => {
    if (!selfAddForm.date) { showToast('Please select a date', 'error'); return; }
    setSelfAddLoading(true);
    try {
      await axios.post(`${API}/attendance/self-add`, {
        date: selfAddForm.date,
        status: selfAddForm.status,
        check_in_time: selfAddForm.status === 'present' ? selfAddForm.check_in_time + ':00' : null,
        check_out_time: selfAddForm.status === 'present' ? selfAddForm.check_out_time + ':00' : null,
        leave_reason: selfAddForm.status === 'leave' ? selfAddForm.leave_reason : null,
      }, authHeaders());
      showToast('Past attendance added!', 'success');
      setShowSelfAddModal(false);
      setSelfAddForm({ date: '', status: 'present', check_in_time: '10:00', check_out_time: '17:00', leave_reason: '' });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add', 'error');
    } finally { setSelfAddLoading(false); }
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const getStatusForDate = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find(r => r.date === dateStr)?.status || null;
  };

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth);
  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8' }}>Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (!todayStatus?.hasActiveInternship) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ background: '#1e293b', borderRadius: 16, padding: '48px 32px', maxWidth: 480, margin: '0 auto', border: '1px solid #334155' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>No Active Internship</h2>
          <p style={{ color: '#94a3b8' }}>You don't have an active internship enrollment.</p>
        </div>
      </div>
    );
  }

  const today_record = todayStatus?.today;
  const checkedIn = !!today_record?.check_in_time;
  const checkedOut = !!today_record?.check_out_time;
  const onLeave = today_record?.status === 'leave';
  const canSelfAdd = todayStatus?.enrollment?.can_self_add;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontWeight: 500, fontSize: 14
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Attendance</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            {todayStatus.enrollment?.domain} Internship • {formatDate(todayStatus.enrollment?.start_date || '')}
          </p>
        </div>
        {/* Self-add button — only if admin approved */}
        {canSelfAdd && (
          <button
            onClick={() => setShowSelfAddModal(true)}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            ➕ Add Past Attendance
          </button>
        )}
      </div>

      {/* Check In/Out Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155', borderRadius: 16, padding: '28px',
        marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {onLeave ? '🌴 On Leave Today' : checkedOut ? '✅ Work Complete!' : checkedIn ? '⏰ Currently Working' : "👋 Mark Today's Attendance"}
          </h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: 12 }}>Check-in</span>
              <p style={{ color: checkedIn ? '#4ade80' : '#475569', fontSize: 16, fontWeight: 600 }}>
                {formatTime(today_record?.check_in_time || null)}
              </p>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: 12 }}>Check-out</span>
              <p style={{ color: checkedOut ? '#f472b6' : '#475569', fontSize: 16, fontWeight: 600 }}>
                {formatTime(today_record?.check_out_time || null)}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!onLeave && !checkedIn && (
            <button onClick={handleCheckIn} disabled={actionLoading} style={btnStyle('#6366f1', actionLoading)}>
              {actionLoading ? 'Marking...' : '✅ Check In'}
            </button>
          )}
          {checkedIn && !checkedOut && !onLeave && (
            <button onClick={handleCheckOut} disabled={actionLoading} style={btnStyle('#f43f5e', actionLoading)}>
              {actionLoading ? 'Marking...' : '🚪 Check Out'}
            </button>
          )}
          {!onLeave && !checkedIn && (
            <button onClick={() => setShowLeaveModal(true)} style={{
              background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b',
              borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>🌴 Apply Leave</button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Present',    value: stats.present,              color: '#4ade80', bg: '#052e16' },
            { label: 'Absent',     value: stats.absent,               color: '#f87171', bg: '#2d0000' },
            { label: 'Leave',      value: stats.leave,                color: '#fbbf24', bg: '#2d1b00' },
            { label: 'Percentage', value: `${stats.percentage}%`,     color: '#818cf8', bg: '#1e1b4b' },
            { label: '🔥 Streak',  value: `${stats.streak} days`,     color: '#fb923c', bg: '#2d1200' },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}33`, borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ color: s.color, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{s.value}</p>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Calendar */}
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={navBtnStyle}>‹</button>
            <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 16 }}>
              {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={navBtnStyle}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getStatusForDate(year, month, day);
              const todayHL = isToday(day);
              let bg = 'transparent', color = '#94a3b8', border = 'none';
              if (status === 'present') { bg = '#14532d'; color = '#4ade80'; }
              else if (status === 'absent') { bg = '#450a0a'; color = '#f87171'; }
              else if (status === 'leave') { bg = '#451a03'; color = '#fbbf24'; }
              if (todayHL) border = '2px solid #6366f1';
              return (
                <div key={day} style={{ textAlign: 'center', padding: '6px 2px', borderRadius: 6, background: bg, color, fontSize: 13, fontWeight: todayHL ? 700 : 400, border }}>
                  {day}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[{ color: '#4ade80', label: 'Present' }, { color: '#f87171', label: 'Absent' }, { color: '#fbbf24', label: 'Leave' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent History */}
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Recent History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
            {records.length === 0 ? (
              <p style={{ color: '#475569', textAlign: 'center', padding: '32px 0' }}>No records yet</p>
            ) : records.slice(0, 20).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', borderRadius: 10, padding: '12px 14px', border: '1px solid #1e293b' }}>
                <div>
                  <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{formatDate(r.date)}</p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                    {r.check_in_time ? `In: ${formatTime(r.check_in_time)}` : ''}
                    {r.check_out_time ? ` • Out: ${formatTime(r.check_out_time)}` : ''}
                    {r.status === 'leave' && r.leave_reason ? ` • ${r.leave_reason}` : ''}
                    {r.marked_by === 'student' && r.date < new Date().toISOString().split('T')[0] ? ' • (self-added)' : ''}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: r.status === 'present' ? '#14532d' : r.status === 'absent' ? '#450a0a' : '#451a03',
                  color: r.status === 'present' ? '#4ade80' : r.status === 'absent' ? '#f87171' : '#fbbf24',
                }}>
                  {r.status === 'leave' ? (r.leave_approved ? '✓ Leave' : '⏳ Leave') : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>🌴 Apply for Leave</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Leave Date</label>
              <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Reason</label>
              <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)}
                placeholder="Enter reason..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLeaveModal(false)} style={cancelBtnStyle}>Cancel</button>
              <button onClick={handleLeaveApply} disabled={leaveLoading} style={btnStyle('#f59e0b', leaveLoading)}>
                {leaveLoading ? 'Applying...' : 'Apply Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Add Past Attendance Modal */}
      {showSelfAddModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>➕ Add Past Attendance</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Only past dates allowed</p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Date (past only)</label>
              <input type="date" value={selfAddForm.date}
                max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                onChange={e => setSelfAddForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Status</label>
              <select value={selfAddForm.status}
                onChange={e => setSelfAddForm(f => ({ ...f, status: e.target.value }))}
                style={inputStyle}>
                <option value="present">Present</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            {selfAddForm.status === 'present' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Check In</label>
                  <input type="time" value={selfAddForm.check_in_time}
                    onChange={e => setSelfAddForm(f => ({ ...f, check_in_time: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Check Out</label>
                  <input type="time" value={selfAddForm.check_out_time}
                    onChange={e => setSelfAddForm(f => ({ ...f, check_out_time: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>
            )}

            {selfAddForm.status === 'leave' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Leave Reason</label>
                <input type="text" value={selfAddForm.leave_reason}
                  onChange={e => setSelfAddForm(f => ({ ...f, leave_reason: e.target.value }))}
                  placeholder="Enter reason..." style={inputStyle} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setShowSelfAddModal(false)} style={cancelBtnStyle}>Cancel</button>
              <button onClick={handleSelfAdd} disabled={selfAddLoading} style={btnStyle('#7c3aed', selfAddLoading)}>
                {selfAddLoading ? 'Adding...' : 'Add Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: '#0f172a', color: '#94a3b8', border: '1px solid #334155',
  borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0f172a', color: '#f1f5f9',
  border: '1px solid #334155', borderRadius: 8, padding: '10px 12px',
  fontSize: 14, outline: 'none', boxSizing: 'border-box'
};

const labelStyle: React.CSSProperties = {
  color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998
};

const modalBox: React.CSSProperties = {
  background: '#1e293b', borderRadius: 16, padding: 32,
  width: '100%', maxWidth: 440, border: '1px solid #334155',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, background: 'transparent', color: '#94a3b8',
  border: '1px solid #334155', borderRadius: 8, padding: '10px',
  cursor: 'pointer', fontWeight: 500, fontSize: 14
};

const btnStyle = (bg: string, disabled: boolean): React.CSSProperties => ({
  flex: 1, background: bg, color: bg === '#f59e0b' ? '#000' : '#fff',
  border: 'none', borderRadius: 10, padding: '12px 24px',
  fontSize: 14, fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1
});