import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

/**
 * Global module that provides the RequestContextService
 * This service uses AsyncLocalStorage to maintain request context
 * without requiring request-scoped dependency injection.
 * Being global means it's available everywhere without explicit imports.
 */
@Global()
@Module({
	exports: [RequestContextService],
	providers: [RequestContextService],
})
export class RequestContextModule {}
