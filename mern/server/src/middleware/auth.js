import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Authentication is not configured' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'apmc-yard', audience: 'apmc-yard-web' });
    const user = await User.findById(payload.sub).select('name email role active');
    if (!user || !user.active) return res.status(401).json({ message: 'User account is inactive or no longer exists' });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Invalid or expired token' });
    next(error);
  }
}
export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'You do not have permission for this action' });
  next();
};