import { AuthGuard } from '@app/nest/guards';
import { ClerkModule, HttpLoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { modules, routes } from './router';

@Module({
	imports: [
		ConfigModule.forRoot(),
		HttpLoggerModule.register('Gateway'),
		RedisModule,
		ClerkModule.register(),
		PrismaModule.register(),
		...modules,
		RouterModule.register(routes),
	],
	providers: [AuthGuard],
})
export class AppModule {}
