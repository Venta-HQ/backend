import { LoggerModule } from '@app/nest/modules/logger';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';
import { ClerkController } from './clerk/clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk/clerk-webhooks.service';

@Module({
	controllers: [ClerkController],
	providers: [ClerkWebhooksService],
	imports: [
		ConfigModule.forRoot(),
		LoggerModule.register('Auth Microservice'),
		PrismaModule.register({
			requestType: 'GRPC',
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
	],
})
export class AppModule {}
