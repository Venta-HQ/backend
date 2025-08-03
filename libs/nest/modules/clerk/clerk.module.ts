import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { ClerkService } from './clerk.service';

@Module({})
export class ClerkModule {
	static register(): DynamicModule {
		return {
			exports: [ClerkService],
			global: true,
			imports: [ConfigModule],
			module: ClerkModule,
			providers: [
				{
					inject: [ConfigService],
					provide: ClerkService,
					useFactory: (configService: ConfigService) => {
						if (!configService.get('CLERK_SECRET_KEY')) {
							throw AppError.internal('CLERK_SECRET_KEY required');
						}

						return new ClerkService(configService.get('CLERK_SECRET_KEY') ?? '');
					},
				},
			],
		};
	}
}
