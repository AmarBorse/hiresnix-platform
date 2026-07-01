const findSupabaseAuthUserByEmail = async (email) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (typeof fetch !== 'function') {
    throw new Error('Supabase Auth admin update requires Node.js fetch support');
  }

  const baseUrl = supabaseUrl.replace(/\/$/, '');
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  const targetEmail = String(email).trim().toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const listRes = await fetch(`${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, { headers });
    if (!listRes.ok) {
      const errorText = await listRes.text();
      throw new Error(errorText || 'Unable to read Supabase Auth users');
    }

    const payload = await listRes.json();
    const users = Array.isArray(payload?.users) ? payload.users : [];
    const user = users.find(u => String(u.email || '').toLowerCase() === targetEmail);
    if (user) return { baseUrl, headers, id: user.id };
    if (users.length < perPage) break;
    page += 1;
  }

  return { baseUrl, headers, id: null };
};

const updateSupabaseAuthPassword = async (email, newPassword) => {
  const authUser = await findSupabaseAuthUserByEmail(email);
  if (!authUser) return { skipped: true, reason: 'Supabase Auth service role is not configured' };
  if (!authUser.id) return { skipped: true, reason: 'User was not found in Supabase Auth' };

  const updateRes = await fetch(`${authUser.baseUrl}/auth/v1/admin/users/${authUser.id}`, {
    method: 'PUT',
    headers: authUser.headers,
    body: JSON.stringify({ password: newPassword }),
  });

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(errorText || 'Unable to update Supabase Auth password');
  }

  return { skipped: false };
};

const updateUserPassword = async (user, newPassword) => {
  const password = String(newPassword || '');
  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.statusCode = 400;
    throw err;
  }

  const supabaseResult = await updateSupabaseAuthPassword(user.email, password);
  if (supabaseResult.skipped) {
    console.warn(`Supabase Auth password update skipped for ${user.email}: ${supabaseResult.reason}`);
  }

  user.password = password;
  await user.save();
};

module.exports = {
  updateUserPassword,
};
