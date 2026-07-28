const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Student: Check In
exports.checkIn = async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 8);

    const existing = await sequelize.query(
      `SELECT * FROM ip_attendance WHERE student_id = :studentId AND date = :today LIMIT 1`,
      { replacements: { studentId, today }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const enrollment = await sequelize.query(
      `SELECT e.id, d.name as domain_name, e."startDate"
       FROM ip_enrollments e
       LEFT JOIN ip_domains d ON d.id = e."domainId"
       WHERE e."userId" = :studentId AND e.status = 'Active' LIMIT 1`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    if (!enrollment.length) {
      return res.status(404).json({ message: 'No active internship enrollment found' });
    }

    await sequelize.query(
      `INSERT INTO ip_attendance (enrollment_id, student_id, date, status, marked_by, check_in_time)
       VALUES (:enrollmentId, :studentId, :today, 'present', 'student', :now)`,
      { replacements: { enrollmentId: enrollment[0].id, studentId, today, now }, type: QueryTypes.INSERT }
    );

    res.json({ message: 'Checked in successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Check Out
exports.checkOut = async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0].substring(0, 8);

    const existing = await sequelize.query(
      `SELECT * FROM ip_attendance WHERE student_id = :studentId AND date = :today LIMIT 1`,
      { replacements: { studentId, today }, type: QueryTypes.SELECT }
    );

    if (!existing.length) {
      return res.status(400).json({ message: 'Not checked in today' });
    }

    if (existing[0].check_out_time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    if (existing[0].status === 'leave') {
      return res.status(400).json({ message: 'On leave today' });
    }

    await sequelize.query(
      `UPDATE ip_attendance SET check_out_time = :now WHERE id = :id`,
      { replacements: { now, id: existing[0].id }, type: QueryTypes.UPDATE }
    );

    res.json({ message: 'Checked out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Get my attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const data = await sequelize.query(
      `SELECT * FROM ip_attendance WHERE student_id = :studentId ORDER BY date DESC`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    const total = data.length;
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    const leave = data.filter(d => d.status === 'leave' && d.leave_approved).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    let streak = 0;
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const record of sorted) {
      if (record.status === 'present') streak++;
      else break;
    }

    res.json({
      records: data,
      stats: { total, present, absent, leave, percentage, streak }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Today's status
exports.getTodayStatus = async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const todayRecord = await sequelize.query(
      `SELECT * FROM ip_attendance WHERE student_id = :studentId AND date = :today LIMIT 1`,
      { replacements: { studentId, today }, type: QueryTypes.SELECT }
    );

    const enrollment = await sequelize.query(
      `SELECT e.id, e.status, e."startDate", d.name as domain_name
       FROM ip_enrollments e
       LEFT JOIN ip_domains d ON d.id = e."domainId"
       WHERE e."userId" = :studentId AND e.status = 'Active' LIMIT 1`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    res.json({
      today: todayRecord[0] || null,
      hasActiveInternship: enrollment.length > 0,
      enrollment: enrollment[0] ? {
        id: enrollment[0].id,
        status: enrollment[0].status,
        domain: enrollment[0].domain_name,
        start_date: enrollment[0].startDate,
      } : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Apply leave
exports.applyLeave = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { date, leave_reason } = req.body;

    if (!date || !leave_reason) {
      return res.status(400).json({ message: 'Date and reason required' });
    }

    const existing = await sequelize.query(
      `SELECT * FROM ip_attendance WHERE student_id = :studentId AND date = :date LIMIT 1`,
      { replacements: { studentId, date }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    const enrollment = await sequelize.query(
      `SELECT id FROM ip_enrollments WHERE "userId" = :studentId AND status = 'Active' LIMIT 1`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    if (!enrollment.length) {
      return res.status(404).json({ message: 'No active internship found' });
    }

    await sequelize.query(
      `INSERT INTO ip_attendance (enrollment_id, student_id, date, status, marked_by, leave_reason, leave_approved)
       VALUES (:enrollmentId, :studentId, :date, 'leave', 'student', :leave_reason, false)`,
      { replacements: { enrollmentId: enrollment[0].id, studentId, date, leave_reason }, type: QueryTypes.INSERT }
    );

    res.json({ message: 'Leave applied successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Get all attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, student_id } = req.query;

    let whereClause = '1=1';
    const replacements = {};

    if (date) {
      whereClause += ' AND a.date = :date';
      replacements.date = date;
    }
    if (student_id) {
      whereClause += ' AND a.student_id = :student_id';
      replacements.student_id = student_id;
    }

    const data = await sequelize.query(
      `SELECT 
        a.*,
        u.name as student_name,
        u.email as student_email,
        d.name as domain_name,
        e."startDate" as start_date
       FROM ip_attendance a
       LEFT JOIN users u ON u.id = a.student_id
       LEFT JOIN ip_enrollments e ON e.id = a.enrollment_id
       LEFT JOIN ip_domains d ON d.id = e."domainId"
       WHERE ${whereClause}
       ORDER BY a.date DESC`,
      { replacements, type: QueryTypes.SELECT }
    );

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Approve leave
exports.approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    await sequelize.query(
      `UPDATE ip_attendance SET leave_approved = true, leave_approved_by = :adminId WHERE id = :id`,
      { replacements: { adminId, id }, type: QueryTypes.UPDATE }
    );

    res.json({ message: 'Leave approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Reject leave
exports.rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(
      `UPDATE ip_attendance SET status = 'absent', leave_approved = false, leave_reason = null WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    res.json({ message: 'Leave rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Mark absent (bulk - end of day)
exports.markAbsent = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const enrollments = await sequelize.query(
      `SELECT id, "userId" as student_id FROM ip_enrollments WHERE status = 'Active'`,
      { type: QueryTypes.SELECT }
    );

    if (!enrollments.length) {
      return res.json({ message: 'No active enrollments', marked: 0 });
    }

    const todayAttendance = await sequelize.query(
      `SELECT student_id FROM ip_attendance WHERE date = :today`,
      { replacements: { today }, type: QueryTypes.SELECT }
    );

    const markedIds = todayAttendance.map(a => String(a.student_id));
    const notMarked = enrollments.filter(e => !markedIds.includes(String(e.student_id)));

    if (!notMarked.length) {
      return res.json({ message: 'All students already marked', marked: 0 });
    }

    for (const e of notMarked) {
      await sequelize.query(
        `INSERT INTO ip_attendance (enrollment_id, student_id, date, status, marked_by)
         VALUES (:enrollmentId, :studentId, :today, 'absent', 'admin')
         ON CONFLICT (enrollment_id, date) DO NOTHING`,
        { replacements: { enrollmentId: e.id, studentId: e.student_id, today }, type: QueryTypes.INSERT }
      );
    }

    res.json({ message: `${notMarked.length} students marked absent`, marked: notMarked.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Get single student full attendance history
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const data = await sequelize.query(
      `SELECT 
        a.*,
        u.name as student_name,
        u.email as student_email,
        d.name as domain_name,
        e."startDate" as start_date,
        e.id as enrollment_id
       FROM ip_attendance a
       LEFT JOIN users u ON u.id = a.student_id
       LEFT JOIN ip_enrollments e ON e.id = a.enrollment_id
       LEFT JOIN ip_domains d ON d.id = e."domainId"
       WHERE a.student_id = :studentId
       ORDER BY a.date DESC`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    const total = data.length;
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    const leave = data.filter(d => d.status === 'leave').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Get enrollment info
    const enrollment = await sequelize.query(
      `SELECT id, "can_self_add" FROM ip_enrollments WHERE "userId" = :studentId AND status = 'Active' LIMIT 1`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    res.json({
      data,
      stats: { total, present, absent, leave, percentage },
      can_self_add: enrollment[0]?.can_self_add || false,
      enrollment_id: enrollment[0]?.id || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Add attendance for any date (past or future)
exports.adminAddAttendance = async (req, res) => {
  try {
    const { student_id, date, status, check_in_time, check_out_time, remarks, leave_reason } = req.body;

    if (!student_id || !date || !status) {
      return res.status(400).json({ message: 'student_id, date and status are required' });
    }

    // Check if already exists
    const existing = await sequelize.query(
      `SELECT id FROM ip_attendance WHERE student_id = :student_id AND date = :date LIMIT 1`,
      { replacements: { student_id, date }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Attendance already exists for this date. Delete it first.' });
    }

    // Get enrollment
    const enrollment = await sequelize.query(
      `SELECT id FROM ip_enrollments WHERE "userId" = :student_id AND status = 'Active' LIMIT 1`,
      { replacements: { student_id }, type: QueryTypes.SELECT }
    );

    if (!enrollment.length) {
      return res.status(404).json({ message: 'No active internship enrollment found for this student' });
    }

    await sequelize.query(
      `INSERT INTO ip_attendance 
        (enrollment_id, student_id, date, status, marked_by, check_in_time, check_out_time, remarks, leave_reason, leave_approved)
       VALUES 
        (:enrollmentId, :student_id, :date, :status, 'admin', :check_in_time, :check_out_time, :remarks, :leave_reason, :leave_approved)`,
      {
        replacements: {
          enrollmentId: enrollment[0].id,
          student_id,
          date,
          status,
          check_in_time: check_in_time || null,
          check_out_time: check_out_time || null,
          remarks: remarks || null,
          leave_reason: leave_reason || null,
          leave_approved: status === 'leave' ? true : false,
        },
        type: QueryTypes.INSERT
      }
    );

    res.json({ message: 'Attendance added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(
      `DELETE FROM ip_attendance WHERE id = :id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    res.json({ message: 'Attendance deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Toggle can_self_add for a student enrollment
exports.toggleSelfAdd = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { can_self_add } = req.body;

    await sequelize.query(
      `UPDATE ip_enrollments SET "can_self_add" = :can_self_add WHERE id = :enrollmentId`,
      { replacements: { can_self_add, enrollmentId }, type: QueryTypes.UPDATE }
    );

    res.json({ message: `Self-add ${can_self_add ? 'enabled' : 'disabled'} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Add past attendance (only if can_self_add = true)
exports.studentSelfAdd = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { date, status, check_in_time, check_out_time, leave_reason } = req.body;

    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status required' });
    }

    // Check future date not allowed
    const today = new Date().toISOString().split('T')[0];
    if (date >= today) {
      return res.status(400).json({ message: 'Can only add past attendance' });
    }

    // Get enrollment and check can_self_add
    const enrollment = await sequelize.query(
      `SELECT id, "can_self_add" FROM ip_enrollments WHERE "userId" = :studentId AND status = 'Active' LIMIT 1`,
      { replacements: { studentId }, type: QueryTypes.SELECT }
    );

    if (!enrollment.length) {
      return res.status(404).json({ message: 'No active internship found' });
    }

    if (!enrollment[0].can_self_add) {
      return res.status(403).json({ message: 'Self-add not enabled. Contact admin.' });
    }

    // Check already exists
    const existing = await sequelize.query(
      `SELECT id FROM ip_attendance WHERE student_id = :studentId AND date = :date LIMIT 1`,
      { replacements: { studentId, date }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Attendance already exists for this date' });
    }

    await sequelize.query(
      `INSERT INTO ip_attendance 
        (enrollment_id, student_id, date, status, marked_by, check_in_time, check_out_time, leave_reason, leave_approved)
       VALUES 
        (:enrollmentId, :studentId, :date, :status, 'student', :check_in_time, :check_out_time, :leave_reason, :leave_approved)`,
      {
        replacements: {
          enrollmentId: enrollment[0].id,
          studentId,
          date,
          status,
          check_in_time: status === 'present' ? (check_in_time || '10:00:00') : null,
          check_out_time: status === 'present' ? (check_out_time || '17:00:00') : null,
          leave_reason: status === 'leave' ? (leave_reason || null) : null,
          leave_approved: status === 'leave' ? false : false,
        },
        type: QueryTypes.INSERT
      }
    );

    res.json({ message: 'Past attendance added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};