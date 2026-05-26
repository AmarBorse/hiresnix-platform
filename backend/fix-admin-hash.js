const bcrypt = require('bcryptjs');

// Generate fresh hash for admin123
bcrypt.hash('admin123', 10).then(hash => {
  console.log('\n✅ Fresh hash generated:');
  console.log(hash);
  console.log('\nRun this SQL in Supabase:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@hirenix.com';`);
  
  // Verify it works
  bcrypt.compare('admin123', hash).then(match => {
    console.log('\n✅ Verification:', match ? 'PASS - hash is correct' : 'FAIL');
  });
});
