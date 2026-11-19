import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import lotRoutes from './routes/lots.routes.js';
import gateRoutes from './routes/gate.routes.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'apmc-yard-api',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/gate-entries', gateRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) console.warn('MONGODB_URI missing. Set it in server/.env');
else mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected'))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
app.listen(port, () => console.log(`APMC API listening on ${port}`));