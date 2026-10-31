require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const routes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/error');

// JWT_SECRET berilmasa, vaqtinchalik tasodifiy kalit yaratiladi
// (server qayta ishga tushganda baribir hamma ma'lumot tozalanadi).
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
}

const app = express();

// Render proxy orqasida ishlaydi (https va host to'g'ri aniqlansin)
app.set('trust proxy', 1);

const origins = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : '*';
app.use(cors({ origin: origins }));
app.use(express.json());

// Render health check va UptimeRobot uchun
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'YouTube Clone API',
    docs: '/api-docs',
    health: '/health',
  });
});

// Swagger UI
const swaggerDoc = YAML.parse(
  fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Endpointlar ham /api/v1/... da, ham to'g'ridan-to'g'ri /... da ishlaydi
app.use('/api/v1', routes);
app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ishga tushdi: port ${PORT}`);
});
