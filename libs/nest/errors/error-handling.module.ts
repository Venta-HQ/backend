import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter } from './app-exception.filter';

@Module({
	imports: [ConfigModule],
	exports: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: AppExceptionFilter,
		},
	],
})
export class ErrorHandlingModule {}
