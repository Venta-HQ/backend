import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
						const secretKey = configService.get('CLERK_SECRET_KEY');

						return new ClerkService(secretKey);
					},
				},
			],
		};
	}
}
