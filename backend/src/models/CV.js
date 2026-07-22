import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const CV_STATUSES = ['draft', 'published'];

class CV extends Model {
  isPublished() { return this.status === 'published'; }
}

CV.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  positionId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM(...CV_STATUSES), defaultValue: 'draft' },
  likesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  selectedProjects: { type: DataTypes.JSONB, defaultValue: [] },
  snapshot: { type: DataTypes.JSONB, allowNull: true },
}, {
  sequelize,
  modelName: 'CV',
  tableName: 'cvs',
  timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'positionId'] }]
});

export default CV;