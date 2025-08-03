import { ClerkModule } from '@app/auth';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { EventSourcingController } from './events/event-sourcing.controller';
import { HealthController } from './health/health.controller';
import { modules, routes } from './router';
import { ServiceDiscoveryService } from './services/service-discovery.service';

@Module({
	imports: [
		ConfigModule,
		LoggerModule.register({ appName: 'Gateway', protocol: 'http' }),
		PrismaModule.register(),
		RedisModule,
		ClerkModule.register(),
		...modules,
		RouterModule.register(routes),
		ErrorHandlingModule,
	],
	controllers: [HealthController, EventSourcingController],
	providers: [ServiceDiscoveryService],
})
export class AppModule {}
