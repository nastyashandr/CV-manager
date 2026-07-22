import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.id);

      if (!user || user.isBlocked) {
        return res.status(401).json({ message: 'Invalid session' });
      }

      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  static optional() {
    return async (req, res, next) => {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) return next();

      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findByPk(payload.id);
      } catch { }

      next();
    };
  }

  static allow(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (req.user.role === 'admin' || roles.includes(req.user.role)) {
        return next();
      }

      res.status(403).json({ message: 'Insufficient permissions' });
    };
  }
}

export default AuthMiddleware;