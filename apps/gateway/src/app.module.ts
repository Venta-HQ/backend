import { ClerkModule } from '@app/auth';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
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
