import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Module({})
export class PrismaModule {
	static register(): DynamicModule {
		return {
			exports: [PrismaService],
			global: true,
			imports: [ConfigModule],
			module: PrismaModule,
			providers: [
				{
					inject: [ConfigService],
					provide: PrismaService,
					useFactory: (configService: ConfigService) => {
						if (!configService.get('DATABASE_URL')) {
							throw new Error('DATABASE_URL required');
						}
						return new PrismaService(
							configService.get('DATABASE_URL'),
							configService.get('PULSE_API_KEY'),
							new (require('../../core/logger').Logger)(),
						);
					},
				},
			],
		};
	}
}
