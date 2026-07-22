import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class ProfileAttributeValue extends Model {
  isEmpty() {
    return this.value === null || this.value === undefined || this.value === '';
  }
}

ProfileAttributeValue.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  attributeId: { type: DataTypes.UUID, allowNull: false },
  value: { type: DataTypes.JSONB, allowNull: true },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { sequelize, modelName: 'ProfileAttributeValue', tableName: 'profile_attribute_values', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'attributeId'] }] });

export default ProfileAttributeValue;
