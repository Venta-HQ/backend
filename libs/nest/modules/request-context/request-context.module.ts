import { Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

/**
 * Module that provides the RequestContextService
 * This service is request-scoped and provides a key-value store
 * for request-specific context data like request IDs.
 */
@Module({
	providers: [RequestContextService],
	exports: [RequestContextService],
})
export class RequestContextModule {} 