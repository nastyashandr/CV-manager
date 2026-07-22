import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class PositionAttribute extends Model {}

PositionAttribute.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  positionId: { type: DataTypes.UUID, allowNull: false },
  attributeId: { type: DataTypes.UUID, allowNull: false },
  required: { type: DataTypes.BOOLEAN, defaultValue: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isCandidateAdded: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, modelName: 'PositionAttribute', tableName: 'position_attributes', timestamps: false });

export default PositionAttribute;