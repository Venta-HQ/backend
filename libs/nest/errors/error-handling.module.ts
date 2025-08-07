import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppExceptionFilter } from './app-exception.filter';
import { DomainErrorInterceptor } from './domain-error.interceptor';

@Module({
	exports: [DomainErrorInterceptor],
	providers: [
		{
			provide: APP_FILTER,
			useClass: AppExceptionFilter,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: DomainErrorInterceptor,
		},
	],
})
export class ErrorHandlingModule {}
