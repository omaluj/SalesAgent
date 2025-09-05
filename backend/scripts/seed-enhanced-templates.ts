#!/usr/bin/env tsx

import { seedEnhancedTemplates } from '../src/database/seed-enhanced-templates.js';
import logger from '../src/utils/logger.js';

async function main() {
  try {
    logger.info('Starting enhanced template seeding...');
    await seedEnhancedTemplates();
    logger.info('Enhanced template seeding completed successfully!');
  } catch (error) {
    logger.error('Enhanced template seeding failed', { error });
    process.exit(1);
  }
}

main();
