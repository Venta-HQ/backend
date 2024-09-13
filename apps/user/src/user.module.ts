import { LoggerModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';
import { ClerkController } from './clerk/clerk.controller';
import { ClerkService } from './clerk/clerk.service';

@Module({
	controllers: [ClerkController],
	imports: [
		ConfigModule.forRoot(),
		LoggerModule.register('User Microservice'),
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
	providers: [ClerkService],
})
export class UserModule {}
