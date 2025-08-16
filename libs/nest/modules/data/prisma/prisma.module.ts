import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger, LoggerModule } from '../../core/logger';
import { RequestContextModule } from '../../networking/request-context';
import { PrismaService } from './prisma.service';

@Module({})
export class PrismaModule {
	static register(): DynamicModule {
		return {
			exports: [PrismaService],
			global: true,
			imports: [ConfigModule, LoggerModule.register(), RequestContextModule],
			module: PrismaModule,
			providers: [
				{
					inject: [ConfigService, Logger],
					provide: PrismaService,
					useFactory: (configService: ConfigService, logger: Logger) => {
						if (!configService.get('DATABASE_URL')) {
							throw new Error('DATABASE_URL required');
						}
						return new PrismaService(configService.get('DATABASE_URL'), configService.get('PULSE_API_KEY'), logger);
					},
				},
			],
		};
	}
}
