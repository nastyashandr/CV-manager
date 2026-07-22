import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'checked', 'contains'];

class AccessRule extends Model {
  evaluate(actualValue) {
    const v = this.value;
    switch (this.operator) {
      case '=': return String(actualValue) === String(v);
      case '!=': return String(actualValue) !== String(v);
      case '>': return Number(actualValue) > Number(v);
      case '>=': return Number(actualValue) >= Number(v);
      case '<': return Number(actualValue) < Number(v);
      case '<=': return Number(actualValue) <= Number(v);
      case 'checked': return actualValue === true;
      case 'contains': return String(actualValue).toLowerCase().includes(String(v).toLowerCase());
      default: return false;
    }
  }
}

AccessRule.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  positionId: { type: DataTypes.UUID, allowNull: false },
  attributeId: { type: DataTypes.UUID, allowNull: false },
  operator: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.JSONB, allowNull: true },
}, { 
  sequelize, 
  modelName: 'AccessRule', 
  tableName: 'access_rules', 
  timestamps: false 
});

export default AccessRule;