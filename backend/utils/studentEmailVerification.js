const crypto = require('crypto');
const nodemailer = require('nodemailer');

const DEFAULT_FRONTEND_URL = 'https://www.hiresnix.co.in';
const STUDENT_UNVERIFIED_MESSAGE = 'Please verify your email before accessing your account.';
const STUDENT_VERIFY_SENT_MESSAGE = 'Verification email sent. Please check your inbox.';

const getFrontendUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, '');

const createVerificationToken = () => crypto.randomBytes(32).toString('hex');

const buildStudentVerificationUrl = (token) => {
  const url = new URL('/auth', getFrontendUrl());
  url.searchParams.set('studentEmailVerificationToken', token);
  return url.toString();
};

function createMailTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
}

const sendStudentVerificationEmail = async (user) => {
  const transporter = createMailTransporter();
  if (!transporter) {
    throw new Error('Student verification email is not configured. Set EMAIL_USER and EMAIL_PASS, or SMTP_HOST credentials.');
  }

  const verificationUrl = buildStudentVerificationUrl(user.emailVerificationToken);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Hiresnix" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Verify your Hiresnix student account',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Verify your student account</h2>
        <p>Hello ${user.name || 'there'},</p>
        <p>Please verify your email before accessing your Hiresnix student account.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700">
            Verify email
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you did not create a Hiresnix student account, you can ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  STUDENT_UNVERIFIED_MESSAGE,
  STUDENT_VERIFY_SENT_MESSAGE,
  createVerificationToken,
  sendStudentVerificationEmail,
};
