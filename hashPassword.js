// hashPassword.js
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('securepassword', 10));