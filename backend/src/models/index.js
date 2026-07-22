import sequelize from '../config/database.js';
import User from './User.js';
import Attribute from './Attribute.js';
import Position from './Position.js';
import PositionAttribute from './PositionAttribute.js';
import AccessRule from './AccessRule.js';
import ProfileAttributeValue from './ProfileAttributeValue.js';
import Project from './Project.js';
import Tag from './Tag.js';
import CV from './CV.js';
import Like from './Like.js';
import DiscussionPost from './DiscussionPost.js';
import CVAttribute from './CVAttribute.js';

class AssociationBuilder {
  static build() {
    User.hasMany(Project, { foreignKey: 'userId', as: 'projects', onDelete: 'CASCADE' });
    Project.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

    User.hasMany(ProfileAttributeValue, { foreignKey: 'userId', as: 'attributeValues', onDelete: 'CASCADE' });
    ProfileAttributeValue.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
    Attribute.hasMany(ProfileAttributeValue, { foreignKey: 'attributeId', as: 'profileValues' });
    ProfileAttributeValue.belongsTo(Attribute, { foreignKey: 'attributeId', as: 'attribute' });

    Position.belongsToMany(Attribute, {
      through: PositionAttribute,
      foreignKey: 'positionId',
      otherKey: 'attributeId',
      as: 'attributes'
    });
    Attribute.belongsToMany(Position, {
      through: PositionAttribute,
      foreignKey: 'attributeId',
      otherKey: 'positionId',
      as: 'positions'
    });
    Position.hasMany(PositionAttribute, { foreignKey: 'positionId', as: 'positionAttributes', onDelete: 'CASCADE' });
    PositionAttribute.belongsTo(Attribute, { foreignKey: 'attributeId', as: 'attribute' });

    Position.hasMany(AccessRule, { foreignKey: 'positionId', as: 'accessRules', onDelete: 'CASCADE' });
    AccessRule.belongsTo(Attribute, { foreignKey: 'attributeId', as: 'attribute' });

    Position.hasMany(CV, { foreignKey: 'positionId', as: 'cvs', onDelete: 'CASCADE' });
    CV.belongsTo(Position, { foreignKey: 'positionId', as: 'position' });
    User.hasMany(CV, { foreignKey: 'userId', as: 'cvs', onDelete: 'CASCADE' });
    CV.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });

    CV.hasMany(CVAttribute, { foreignKey: 'cvId', as: 'cvAttributes', onDelete: 'CASCADE' });
    CVAttribute.belongsTo(CV, { foreignKey: 'cvId', as: 'cv' });
    CVAttribute.belongsTo(Attribute, { foreignKey: 'attributeId', as: 'attribute' });

    CV.hasMany(Like, { foreignKey: 'cvId', as: 'likes', onDelete: 'CASCADE' });
    Like.belongsTo(CV, { foreignKey: 'cvId', as: 'cv' });
    Like.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' });

    Position.hasMany(DiscussionPost, { foreignKey: 'positionId', as: 'posts', onDelete: 'CASCADE' });
    DiscussionPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
  }
}

AssociationBuilder.build();

export {
  sequelize,
  User,
  Attribute,
  Position,
  PositionAttribute,
  AccessRule,
  ProfileAttributeValue,
  Project,
  Tag,
  CV,
  Like,
  DiscussionPost,
  CVAttribute,
};