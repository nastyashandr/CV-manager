import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Like extends Model { }

Like.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cvId: { type: DataTypes.UUID, allowNull: false },
  recruiterId: { type: DataTypes.UUID, allowNull: false },
}, {
  sequelize,
  modelName: 'Like',
  tableName: 'likes',
  timestamps: true,
  indexes: [{ unique: true, fields: ['cvId', 'recruiterId'] }]
});

export default Like;