import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const ALLOWED_ROLES = ['candidate', 'recruiter', 'admin'];

function sanitizeRole(role) {
  return ALLOWED_ROLES.includes(role) ? role : 'candidate';
}

class AuthController {
  static signToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  static async assertEmailAvailable(email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw ApiError.badRequest('Email already registered');
  }

  register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }
    await AuthController.assertEmailAvailable(email);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
      role: sanitizeRole(role),
    });

    const token = AuthController.signToken(user);
    res.status(201).json({ token, user: user.toPublicJSON() });
  });

  static async verifyCredentials(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordHash) throw ApiError.unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid credentials');
    if (user.isBlocked) throw ApiError.forbidden('Account is blocked');

    return user;
  }

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw ApiError.badRequest('Email and password are required');

    const user = await AuthController.verifyCredentials(email, password);
    const token = AuthController.signToken(user);
    res.json({ token, user: user.toPublicJSON() });
  });

  me = asyncHandler(async (req, res) => {
    res.json({ user: req.user.toPublicJSON() });
  });

  oauthCallback = (req, res) => {
    const token = AuthController.signToken(req.user);
    res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${token}`);
  };
}

export default new AuthController();
