import { AuthGuard } from '@app/nest/guards';
import { BootstrapModule, ClerkModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { modules, routes } from './router';

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
				...modules,
				RouterModule.register(routes),
			],
			appName: 'gateway',
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
