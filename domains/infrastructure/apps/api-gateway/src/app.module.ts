import { AuthGuard } from '@app/nest/guards';
import { APP_NAMES, BootstrapModule, ClerkModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [
				ClerkModule.register(),
				RedisModule,
				ThrottlerModule.forRoot([
					{
						limit: 100,
						ttl: 60000,
					},
				]),
				CoreModule,
			],
			appName: APP_NAMES.GATEWAY,
			domain: 'infrastructure', // DDD domain for infrastructure services
			protocol: 'http',
		}),
	],
	providers: [
		AuthGuard,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
