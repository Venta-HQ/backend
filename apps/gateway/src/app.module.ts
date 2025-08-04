import { ErrorHandlingModule } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import {
	BootstrapModule,
	ClerkModule,
} from '@app/nest/modules';
import { ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { modules, routes } from './router';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'gateway',
			protocol: 'http',
			additionalModules: [
				ClerkModule.register(),
				ThrottlerModule.forRoot([
					{
						limit: 100,
						ttl: 60000,
					},
				]),
				...modules,
				RouterModule.register(routes),
			],
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
