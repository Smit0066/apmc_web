import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many login attempts. Try again in 15 minutes.' } });

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim(), active: true }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'apmc-yard', audience: 'apmc-yard-web' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, active: req.user.active } });
});

export default router;
