import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class DiscussionPost extends Model {}

DiscussionPost.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  positionId: { type: DataTypes.UUID, allowNull: false },
  authorId: { type: DataTypes.UUID, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'DiscussionPost', tableName: 'discussion_posts', timestamps: true });

export default DiscussionPost;
