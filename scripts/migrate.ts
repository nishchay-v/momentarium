import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const schemaSQL = readFileSync(
      join(process.cwd(), 'database', 'schema.sql'),
      'utf-8'
    );

    await client.query(schemaSQL);
    console.log('✅ Schema migration completed successfully');

    // Optionally run seed
    if (process.env.RUN_SEED === 'true') {
      const seedSQL = readFileSync(
        join(process.cwd(), 'database', 'seed.sql'),
        'utf-8'
      );
      await client.query(seedSQL);
      console.log('✅ Seed data inserted successfully');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();


