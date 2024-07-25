import { Module } from '@nestjs/common';
import { routes, modules } from './router';
import { RouterModule } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './lib/modules/prisma/prisma.module';

@Module({
  imports: [
    ...modules,
    PrismaModule.register({
      client: PrismaClient,
      name: 'PRISMA',
    }),
    ConfigModule.forRoot(),
    RouterModule.register(routes),
  ],
})
export class AppModule {}
