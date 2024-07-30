import { LoggerModule } from '@/lib/modules/logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';
import { modules, routes } from './router';

@Module({
	imports: [
		...modules,
		LoggerModule,
		PrismaModule.register({
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
			logging: true,
			name: 'PRISMA',
		}),
		ConfigModule.forRoot(),
		RouterModule.register(routes),
	],
})
export class AppModule {}
