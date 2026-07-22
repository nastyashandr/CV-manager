import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Tag extends Model {}

Tag.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { sequelize, modelName: 'Tag', tableName: 'tags', timestamps: false });

export default Tag;
