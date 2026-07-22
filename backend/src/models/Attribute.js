import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const ATTRIBUTE_TYPES = ['string', 'text', 'image', 'number', 'date', 'period', 'boolean', 'select'];

class Attribute extends Model {
  isSelectable() { return this.type === 'select'; }
}

Attribute.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  category: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM(...ATTRIBUTE_TYPES), allowNull: false },
  options: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
  isBuiltin: { type: DataTypes.BOOLEAN, defaultValue: false },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdBy: { type: DataTypes.UUID, allowNull: true },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { sequelize, modelName: 'Attribute', tableName: 'attributes', timestamps: true });

export default Attribute;