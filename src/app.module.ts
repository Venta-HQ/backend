import { Module } from '@nestjs/common';
import { routes, modules } from './router';
import { RouterModule } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';
import { LoggerModule } from '@/modules/logger.module';

@Module({
  imports: [
    ...modules,
    LoggerModule,
    PrismaModule.register({
      logging: true,
      name: 'PRISMA',
      client: {
        class: PrismaClient,
        options: {
          log: [
            {
              emit: 'event',
              level: 'query',
            },
            {
              emit: 'stdout',
              level: 'error',
            },
            {
              emit: 'stdout',
              level: 'info',
            },
            {
              emit: 'stdout',
              level: 'warn',
            },
          ],
        },
      },
      global: true,
    }),
    ConfigModule.forRoot(),
    RouterModule.register(routes),
  ],
})
export class AppModule {}
