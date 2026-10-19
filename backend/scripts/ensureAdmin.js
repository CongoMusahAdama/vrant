/**
 * Create or reset the admin user from ADMIN_EMAIL / ADMIN_PASSWORD in .env
 * Run: node scripts/ensureAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (user) {
    user.password = password;
    user.role = 'admin';
    user.isActive = true;
    if (!user.name) user.name = 'VRANT Admin';
    await user.save();
    console.log(`Updated admin: ${email}`);
  } else {
    await User.create({
      name: 'VRANT Admin',
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isActive: true,
    });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
