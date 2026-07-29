import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class SalesforceSync extends Model { }

SalesforceSync.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Salesforce Account ID'
  },
  contactId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Salesforce Contact ID'
  },
  syncedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  additionalData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'SalesforceSync',
  tableName: 'salesforce_syncs',
  timestamps: true
});

export default SalesforceSync;