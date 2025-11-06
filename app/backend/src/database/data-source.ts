import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { dbConfig } from '@config/db';

const isTsRuntime = __filename.endsWith('.ts');
const databaseDir = __dirname;
const srcOrDistRoot = path.resolve(databaseDir, '..');
const entityExtension = isTsRuntime ? 'ts' : 'js';

const entitiesGlob = path.join(srcOrDistRoot, '**', `*.entity.${entityExtension}`);
const migrationsGlob = path.join(databaseDir, `migrations/*.${entityExtension}`);
const subscribersGlob = path.join(databaseDir, `subscribers/*.${entityExtension}`);

const schema = process.env.DB_SCHEMA ?? 'public';
const searchPath = process.env.DB_SEARCH_PATH ?? schema;

type Options = PostgresConnectionOptions & { searchPath?: string };

const defaultOptions: Options = {
  type: 'postgres',
  url: dbConfig.databaseUrl,
  logging: false,
  synchronize: true,
  entities: [entitiesGlob],
  migrations: [migrationsGlob],
  subscribers: [subscribersGlob],
  applicationName: 'verifytrade-backend',
  schema,
  ...(searchPath ? { searchPath } : {})
};

export function makeDataSource(overrides: Partial<Options> = {}): DataSource {
  const merged: Options = {
    ...defaultOptions,
    ...overrides,
    entities: (overrides.entities as Options['entities']) ?? defaultOptions.entities,
    migrations: (overrides.migrations as Options['migrations']) ?? defaultOptions.migrations,
    subscribers: (overrides.subscribers as Options['subscribers']) ?? defaultOptions.subscribers
  };

  return new DataSource(merged);
}

export const AppDataSource = makeDataSource();

export default AppDataSource;


