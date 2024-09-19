import { ClerkModule, LoggerModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { modules, routes } from './router';

@Module({
	imports: [
		ConfigModule.forRoot(),
		ClerkModule.register(),
		LoggerModule.register('Gateway'),
		...modules,
		RouterModule.register(routes),
	],
})
export class AppModule {}
