import { ErrorHandlingModule } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import {
	ClerkModule,
	ConfigModule,
	EventsModule,
	HealthModule,
	LoggerModule,
	PrismaModule,
	PrometheusModule,
	RedisModule,
} from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { modules, routes } from './router';

@Module({
	imports: [
		ConfigModule,
		ErrorHandlingModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'gateway-service',
		}),
		LoggerModule.register({ appName: 'gateway', protocol: 'http' }),
		RedisModule,
		PrometheusModule.register({ appName: 'gateway' }),
		ClerkModule.register(),
		PrismaModule.register(),
		ThrottlerModule.forRoot([
			{
				limit: 100,
				ttl: 60000,
			},
		]),
		...modules,
		RouterModule.register(routes),
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
