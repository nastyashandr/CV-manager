import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Position extends Model {
  isVisibleTo(user) {
    if (!user) return this.isPublic;
    if (user.isRecruiter()) return true;
    return true;
  }
}

Position.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  shortDescription: { type: DataTypes.TEXT, allowNull: true },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: true },
  projectTags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  maxProjects: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  createdById: { type: DataTypes.UUID, allowNull: true },
}, { sequelize, modelName: 'Position', tableName: 'positions', timestamps: true });

export default Position;