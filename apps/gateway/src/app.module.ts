import { ErrorHandlingModule } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import { ClerkModule, ConfigModule, HttpLoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { modules, routes } from './router';

@Module({
	imports: [
		ConfigModule,
		HttpLoggerModule.register('Gateway'),
		RedisModule,
		ClerkModule.register(),
		PrismaModule.register(),
		ErrorHandlingModule,
		...modules,
		RouterModule.register(routes),
	],
	providers: [AuthGuard],
})
export class AppModule {}
