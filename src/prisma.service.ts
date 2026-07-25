import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger;

  constructor() {
    // Validate DATABASE_URL exists and is a string
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    if (typeof process.env.DATABASE_URL !== 'string') {
      throw new Error('DATABASE_URL environment variable must be a string');
    }

    let pool: Pool;
    let adapter: PrismaPg;

    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      adapter = new PrismaPg(pool);
    } catch (error) {
      throw new Error(`Failed to initialize Prisma connection pool: ${error instanceof Error ? error.message : String(error)}`);
    }

    super({ adapter });
    this.logger = new Logger(PrismaService.name);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      throw error;
    }
  }
}
