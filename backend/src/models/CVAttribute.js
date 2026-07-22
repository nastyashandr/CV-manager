import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class CVAttribute extends Model { }

CVAttribute.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cvId: { type: DataTypes.UUID, allowNull: false },
  attributeId: { type: DataTypes.UUID, allowNull: false },
  value: { type: DataTypes.JSONB, allowNull: true },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { sequelize, modelName: 'CVAttribute', tableName: 'cv_attributes', timestamps: true });

export default CVAttribute;
