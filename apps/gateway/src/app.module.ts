import { ConfigModule } from '@app/config';
import { ErrorHandlingModule } from '@app/errors';
import { HealthModule } from '@app/health';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { modules, routes } from './router';
import { ServiceDiscoveryService } from './services/service-discovery.service';

@Module({
	imports: [
		ConfigModule,
		LoggerModule.register({ appName: 'gateway', protocol: 'http' }),
		ErrorHandlingModule,
		HealthModule.forRoot({ serviceName: 'gateway-service' }),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 100,
			},
		]),
		...modules,
		RouterModule.register(routes),
	],
	controllers: [],
	providers: [
		ServiceDiscoveryService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
