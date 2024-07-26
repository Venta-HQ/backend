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
      name: 'PRISMA',
      client: {
        class: PrismaClient,
        initializer: (client) => {
          console.log('Initializing Prisma Connection');
          return client;
        },
        options: {
          log: ['info', 'warn', 'query', 'error'],
        },
      },
      global: true,
    }),
    ConfigModule.forRoot(),
    RouterModule.register(routes),
  ],
})
export class AppModule {}
