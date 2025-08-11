import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from '@venta/nest/guards';
import { AuthService } from '@venta/nest/guards/core';
import { APP_NAMES, BootstrapModule, ClerkModule, RedisModule } from '@venta/nest/modules';
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
		AuthService,
		AuthGuard,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
