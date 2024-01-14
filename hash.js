const bcrypt = require('bcrypt');

// Password to be hashed
const passwordToHash = 'password_to_hash';

// Hashing the password with bcrypt
bcrypt.hash(passwordToHash, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
    } else {
        console.log('Hashed password:', hash);
    }
});
