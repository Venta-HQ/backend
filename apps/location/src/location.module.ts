import { LoggerModule } from '@app/nest/modules/logger';
import { RedisModule } from '@app/nest/modules/redis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';
import { LocationController } from './location.controller';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule.forRoot(),
		RedisModule,
		LoggerModule.register('Location Microservice'),
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
			requestType: 'GRPC',
		}),
	],
	providers: [],
})
export class LocationModule {}
