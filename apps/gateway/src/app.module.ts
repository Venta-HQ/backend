import { AuthGuard } from '@app/nest/guards';
import { ClerkModule, EventsModule, HealthModule, LoggerModule, PrismaModule, RedisModule, ConfigModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
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
		ClerkModule.register(),
		PrismaModule.register(),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 100,
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
