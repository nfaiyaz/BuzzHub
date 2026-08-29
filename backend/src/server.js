require('dotenv').config();
const app = require('./app');
const prisma = require('./prisma');
const requestRoutes = require('./routes/request.routes');
const PORT = Number(process.env.PORT || 5000);

app.use('/api/requests', requestRoutes);

async function start() {
try {
await prisma.$connect();

app.get('/', (req, res) => {
  res.json({
    message: 'BuzzHub API is running',
  });
});

app.listen(PORT, () => {
console.log(`API running at http://localhost:${PORT}`);
});
} catch (error) {
console.error('Could not start server:', error);
process.exit(1);
}
}
start();