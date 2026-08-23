require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const followRoutes = require('./routes/follow.routes');
const app = express();

app.use(cors({
origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
res.json({ status: 'ok', message: 'Social API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes);
app.use('/api/users', followRoutes);

app.use((err, req, res, next) => {
console.error(err);
res.status(500).json({ message: 'Unexpected server error.' });
});

module.exports = app;