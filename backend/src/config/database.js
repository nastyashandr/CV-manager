import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  static instance = null;

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Sequelize(
        process.env.DB_NAME || 'CVs',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: false,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
        }
      );
    }
    return Database.instance;
  }
}

const sequelize = Database.getInstance();

export default sequelize;