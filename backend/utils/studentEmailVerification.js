const crypto = require('crypto');

const DEFAULT_FRONTEND_URL = 'https://hiresnix.co.in';
const STUDENT_VERIFY_MESSAGE = 'Verification email sent. Please check your inbox before logging in.';

const getFrontendUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, '');

const createVerificationToken = () => crypto.randomBytes(32).toString('hex');

const buildStudentEmailRedirectTo = (token) => {
  const url = new URL('/auth', getFrontendUrl());
  url.searchParams.set('studentEmailVerificationToken', token);
  return url.toString();
};

const getSupabaseConfig = () => ({
  url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
});

const sendStudentVerificationEmail = async (user) => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    throw new Error('Student email verification is not configured');
  }

  const emailRedirectTo = buildStudentEmailRedirectTo(user.emailVerificationToken);
  const inviteUrl = `${url}/auth/v1/invite?redirect_to=${encodeURIComponent(emailRedirectTo)}`;

  // Supabase email confirmation is a global Auth setting, so we do not enable it.
  // Instead, only student registrations trigger this Supabase Auth email.
  const response = await fetch(inviteUrl, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      data: {
        app_user_id: String(user.id),
        app_role: 'student',
      },
    }),
  });

  if (!response.ok) {
    let message = 'Unable to send verification email';
    try {
      const body = await response.json();
      message = body.msg || body.message || body.error_description || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }
};

module.exports = {
  STUDENT_VERIFY_MESSAGE,
  createVerificationToken,
  sendStudentVerificationEmail,
};
