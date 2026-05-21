import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'taskflow',
  password: process.env.POSTGRES_PASSWORD || 'taskflow_pass',
  database: process.env.POSTGRES_DB || 'taskflow_db',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false,
});
