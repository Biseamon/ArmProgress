/**
 * Generate Apple JWT Token for Sign in with Apple
 *
 * This script generates a JWT token that is required for configuring Apple Sign In in Supabase.
 * You need to provide your Team ID, Services ID, Key ID, and the .p8 key file path.
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Configuration - REPLACE THESE VALUES
const TEAM_ID = '7D4A462AXM';        // e.g., 'DEF456GHI7'
const SERVICES_ID = 'com.armprogress.app.oauth';  // Your Services ID
const KEY_ID = '9J6AG33VXZ';          // e.g., 'ABC123XYZ4'
const KEY_FILE_PATH = './AuthKey_9J6AG33VXZ.p8';  // Path to your .p8 file

try {
  // Read the private key from .p8 file
  const privateKey = fs.readFileSync(path.resolve(__dirname, KEY_FILE_PATH), 'utf8');

  // JWT payload
  const payload = {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
    aud: 'https://appleid.apple.com',
    sub: SERVICES_ID,
  };

  // Generate JWT
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID,
    },
  });

  console.log('\n✅ JWT Token Generated Successfully!\n');
  console.log('Copy this token to your Supabase Dashboard:');
  console.log('(Authentication → Providers → Apple → Secret Key)\n');
  console.log('═'.repeat(80));
  console.log(token);
  console.log('═'.repeat(80));
  console.log('\nToken expires in 6 months.');
  console.log('Expiration date:', new Date(payload.exp * 1000).toISOString());
  console.log('\n');

} catch (error) {
  console.error('\n❌ Error generating JWT token:');
  console.error(error.message);
  console.error('\nMake sure:');
  console.error('1. The .p8 file path is correct');
  console.error('2. jsonwebtoken package is installed (npm install jsonwebtoken)');
  console.error('3. All configuration values are set correctly\n');
}
