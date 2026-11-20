import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import operationsRoutes from './routes/operations.routes.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim());
app.use(cors({ origin: origins, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'apmc-yard-api',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString()
}));
app.use('/api/auth', authRoutes);
app.use('/api/yard', operationsRoutes);
app.use((req, res) => res.status(404).json({ message: 'API route not found' }));
app.use((err, _req, res, _next) => {
  const status = Number(err.status) || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error' });
});

const port = Number(process.env.PORT || 5000);
if (!process.env.MONGODB_URI) console.warn('MONGODB_URI missing. Set it in server/.env');
else mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('MongoDB connected'))
  .catch(error => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
app.listen(port, () => console.log(`APMC API listening on ${port}`));
