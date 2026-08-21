const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { signToken } = require('../utils/jwt');
const router = express.Router();
router.post('/register', async (req, res) => {
try {
const { name, username, email, password } = req.body;
if (!name || !username || !email || !password) {
return res.status(400).json({ message: 'All fields are required.' });
}
if (password.length < 6) {
return res.status(400).json({ message: 'Password must be at least 6 characters.' });
}
const normalizedUsername = username.trim().toLowerCase();
const normalizedEmail = email.trim().toLowerCase();
const existing = await prisma.user.findFirst({
where: {
OR: [
{ username: normalizedUsername },
{ email: normalizedEmail }
]
}
});
if (existing) {
return res.status(409).json({ message: 'Username or email already exists.' });
}
const hashedPassword = await bcrypt.hash(password, 10);
const user = await prisma.user.create({
data: {
name: name.trim(),
username: normalizedUsername,
email: normalizedEmail,
password: hashedPassword
},
select: {
id: true,
name: true,
username: true,
email: true,
bio: true,
avatarUrl: true
}
});
const token = signToken(user.id);
return res.status(201).json({ user, token });
} catch (error) {
console.error(error);
return res.status(500).json({ message: 'Registration failed.' });
}
});
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const user = await prisma.user.findUnique({
where: { email: String(email || '').trim().toLowerCase() }
});
if (!user) {
return res.status(401).json({ message: 'Invalid email or password.' });
}
const valid = await bcrypt.compare(password || '', user.password);
if (!valid) {
return res.status(401).json({ message: 'Invalid email or password.' });
}
const safeUser = {
id: user.id,
name: user.name,
username: user.username,
email: user.email,
bio: user.bio,
avatarUrl: user.avatarUrl
};
const token = signToken(user.id);
return res.json({ user: safeUser, token });
} catch (error) {
console.error(error);
return res.status(500).json({ message: 'Login failed.' });
}
});
module.exports = router;