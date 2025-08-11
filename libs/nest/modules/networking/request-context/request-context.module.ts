import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

/**
 * Global module that provides the RequestContextService
 * This service is request-scoped and provides a key-value store
 * for request-specific context data like request IDs.
 * Being global means it's available everywhere without explicit imports.
 */
@Global()
@Module({
	exports: [RequestContextService],
	providers: [RequestContextService],
})
export class RequestContextModule {}
