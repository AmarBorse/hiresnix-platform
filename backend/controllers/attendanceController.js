const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Student: Check In
exports.checkIn = async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const { data: existing } = await supabase
      .from('ip_attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const { data: enrollment } = await supabase
      .from('ip_enrollments')
      .select('id, domain')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return res.status(404).json({ message: 'No active internship enrollment found' });
    }

    const { data, error } = await supabase
      .from('ip_attendance')
      .insert({
        enrollment_id: enrollment.id,
        student_id: studentId,
        date: today,
        status: 'present',
        marked_by: 'student',
        check_in_time: now
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Checked in successfully', data });
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
    const now = new Date().toTimeString().split(' ')[0];

    const { data: existing } = await supabase
      .from('ip_attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    if (!existing) {
      return res.status(400).json({ message: 'Not checked in today' });
    }

    if (existing.check_out_time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    if (existing.status === 'leave') {
      return res.status(400).json({ message: 'On leave today' });
    }

    const { data, error } = await supabase
      .from('ip_attendance')
      .update({ check_out_time: now })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Checked out successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Get my attendance
exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const { data, error } = await supabase
      .from('ip_attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw error;

    const total = data.length;
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    const leave = data.filter(d => d.status === 'leave' && d.leave_approved).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Calculate current streak
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

    const { data: todayRecord } = await supabase
      .from('ip_attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', today)
      .single();

    const { data: enrollment } = await supabase
      .from('ip_enrollments')
      .select('id, status, domain, start_date, end_date')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    res.json({
      today: todayRecord || null,
      hasActiveInternship: !!enrollment,
      enrollment: enrollment || null
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

    const { data: existing } = await supabase
      .from('ip_attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    const { data: enrollment } = await supabase
      .from('ip_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      return res.status(404).json({ message: 'No active internship found' });
    }

    const { data, error } = await supabase
      .from('ip_attendance')
      .insert({
        enrollment_id: enrollment.id,
        student_id: studentId,
        date,
        status: 'leave',
        marked_by: 'student',
        leave_reason,
        leave_approved: false
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Leave applied successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Get all attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, student_id } = req.query;

    let query = supabase
      .from('ip_attendance')
      .select(`
        *,
        students (
          id,
          name,
          email,
          college,
          branch,
          year
        ),
        ip_enrollments (
          id,
          domain,
          start_date,
          end_date
        )
      `)
      .order('date', { ascending: false });

    if (date) query = query.eq('date', date);
    if (student_id) query = query.eq('student_id', student_id);

    const { data, error } = await query;
    if (error) throw error;

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

    const { data, error } = await supabase
      .from('ip_attendance')
      .update({ leave_approved: true, leave_approved_by: adminId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Leave approved', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Reject leave
exports.rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ip_attendance')
      .update({ status: 'absent', leave_approved: false, leave_reason: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Leave rejected', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Mark absent (end of day bulk)
exports.markAbsent = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: enrollments } = await supabase
      .from('ip_enrollments')
      .select('id, student_id')
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      return res.json({ message: 'No active enrollments', marked: 0 });
    }

    const { data: todayAttendance } = await supabase
      .from('ip_attendance')
      .select('student_id')
      .eq('date', today);

    const markedStudentIds = (todayAttendance || []).map(a => a.student_id);
    const notMarked = enrollments.filter(e => !markedStudentIds.includes(e.student_id));

    if (notMarked.length === 0) {
      return res.json({ message: 'All students already marked', marked: 0 });
    }

    const absentRecords = notMarked.map(e => ({
      enrollment_id: e.id,
      student_id: e.student_id,
      date: today,
      status: 'absent',
      marked_by: 'admin'
    }));

    const { error } = await supabase
      .from('ip_attendance')
      .insert(absentRecords);

    if (error) throw error;

    res.json({ message: `${notMarked.length} students marked absent`, marked: notMarked.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
