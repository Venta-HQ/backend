import { AuthGuard } from '@app/nest/guards';
import { ClerkModule, EventsModule, HealthModule, LoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { modules, routes } from './router';

@Module({
	imports: [
		ConfigModule.forRoot(),
		ErrorHandlingModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'gateway-service',
		}),
		LoggerModule.register({ appName: 'gateway', protocol: 'http' }),
		RedisModule,
		ClerkModule.register(),
		PrismaModule.register(),
		...modules,
		RouterModule.register(routes),
	],
	providers: [AuthGuard],
})
export class AppModule {}
