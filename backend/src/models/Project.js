import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Project extends Model {
  matchesTags(tagNames = []) {
    if (!tagNames.length) return true;
    const mine = (this.tags || []).map((t) => t.toLowerCase());
    return tagNames.some((t) => mine.includes(t.toLowerCase()));
  }
}

Project.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  periodStart: { type: DataTypes.DATEONLY, allowNull: true },
  periodEnd: { type: DataTypes.DATEONLY, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { 
  sequelize, 
  modelName: 'Project', 
  tableName: 'projects', 
  timestamps: true 
});

export default Project;