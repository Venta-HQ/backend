import { ErrorHandlingModule } from '@app/nest/errors';
import { ClerkModule, ConfigModule, LoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { modules, routes } from './router';

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
})
export class AppModule {}
