import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class User extends Model {
  isAdmin() { return this.role === 'admin'; }
  isRecruiter() { return this.role === 'recruiter' || this.role === 'admin'; }
  isCandidate() { return this.role === 'candidate' || this.role === 'admin'; }

  toPublicJSON() {
    const { passwordHash, ...safe } = this.toJSON();
    return safe;
  }
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.ENUM('candidate', 'recruiter', 'admin'), defaultValue: 'candidate' },
  firstName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  lastName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  location: { type: DataTypes.STRING, allowNull: true },
  photoUrl: { type: DataTypes.STRING, allowNull: true },
  locale: { type: DataTypes.STRING, defaultValue: 'en' },
  theme: { type: DataTypes.STRING, defaultValue: 'light' },
  isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { sequelize, modelName: 'User', tableName: 'users', timestamps: true });

export default User;