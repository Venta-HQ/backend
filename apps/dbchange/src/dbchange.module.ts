import { AlgoliaModule, LoggerModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '@sabinthedev/nestjs-prisma';
import { VendorService } from './models/vendor.service';

@Module({
	controllers: [],
	imports: [
		ConfigModule.forRoot(),
		LoggerModule.register('DB Change Microservice'),
		AlgoliaModule.register(),
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
	providers: [VendorService],
})
export class DbchangeModule {}
