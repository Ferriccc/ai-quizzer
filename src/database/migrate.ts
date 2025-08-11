import fs from 'fs';
import path from 'path';
import { query, connectDatabase, closeDatabase } from '@/config/database';
import { logger } from '@/utils/logger';

async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');
    
    // Connect to database
    await connectDatabase();
    
    // Read schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    logger.info('Executing database schema...');
    await query(schemaSQL);
    
    logger.info('Database schema created successfully');
    
    // Read seed file
    const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      logger.info('Executing database seed data...');
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      await query(seedSQL);
      logger.info('Database seed data inserted successfully');
    }
    
    logger.info('Database migrations completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
