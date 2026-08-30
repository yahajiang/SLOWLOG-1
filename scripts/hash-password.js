// Script to generate password hash
// Run this once to set up the default password: node scripts/hash-password.js

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log(`\nUpdate data/users.json with this hash`);
