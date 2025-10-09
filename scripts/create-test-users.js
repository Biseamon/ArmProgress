const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  console.log('Creating test users...\n');

  const freeUser = {
    email: 'free.user@armwrestling.pro',
    password: 'freeuser123',
    fullName: 'Free User'
  };

  const premiumUser = {
    email: 'premium.user@armwrestling.pro',
    password: 'premiumuser123',
    fullName: 'Premium User'
  };

  console.log('1. Creating Free User...');
  const { data: freeData, error: freeError } = await supabase.auth.signUp({
    email: freeUser.email,
    password: freeUser.password,
  });

  if (freeError) {
    console.error('Error creating free user:', freeError.message);
  } else if (freeData.user) {
    console.log('✓ Free user created:', freeUser.email);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: freeData.user.id,
        email: freeUser.email,
        full_name: freeUser.fullName,
        is_premium: false,
        is_test_user: false,
      });

    if (profileError) {
      console.error('Error creating free user profile:', profileError.message);
    } else {
      console.log('✓ Free user profile created\n');
    }
  }

  console.log('2. Creating Premium User...');
  const { data: premiumData, error: premiumError } = await supabase.auth.signUp({
    email: premiumUser.email,
    password: premiumUser.password,
  });

  if (premiumError) {
    console.error('Error creating premium user:', premiumError.message);
  } else if (premiumData.user) {
    console.log('✓ Premium user created:', premiumUser.email);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: premiumData.user.id,
        email: premiumUser.email,
        full_name: premiumUser.fullName,
        is_premium: true,
        is_test_user: true,
      });

    if (profileError) {
      console.error('Error creating premium user profile:', profileError.message);
    } else {
      console.log('✓ Premium user profile created (with test user flag)\n');
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST USERS CREATED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('FREE USER (No Premium Access):');
  console.log(`  Email:    ${freeUser.email}`);
  console.log(`  Password: ${freeUser.password}`);
  console.log('  Limits:   5 workouts, 3 goals, shows ads\n');

  console.log('PREMIUM USER (Full Access):');
  console.log(`  Email:    ${premiumUser.email}`);
  console.log(`  Password: ${premiumUser.password}`);
  console.log('  Access:   Unlimited workouts & goals, no ads\n');

  console.log('═══════════════════════════════════════════════════════');
}

createTestUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
