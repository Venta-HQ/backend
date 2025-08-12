import { randomUUID } from 'crypto';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { HttpRequest } from '@venta/apitypes';
import { RequestContextService } from '../../modules/networking/request-context';
import { BaseRequestIdInterceptor, RequestIdExtractor } from './base-request-id.interceptor';

/**
 * HTTP-specific request ID extractor
 */
class HttpRequestIdExtractor implements RequestIdExtractor {
	extractId(context: ExecutionContext): string | undefined {
		const request: HttpRequest = context.switchToHttp().getRequest();

		// Helper to normalize header values (can be string or string[])
		const getHeaderValue = (value: string | string[] | undefined): string | undefined => {
			if (Array.isArray(value)) return value[0];
			return value;
		};

		// Try to get request ID from headers (X-Request-ID, X-Correlation-ID, etc.)
		const requestId = getHeaderValue(request.headers['x-request-id'] || request.headers['request-id']);

		const correlationId = getHeaderValue(request.headers['x-correlation-id'] || request.headers['correlation-id']);

		// Use request ID if available, otherwise use correlation ID, otherwise generate new
		const finalRequestId = requestId || correlationId || randomUUID();

		// Set both fields on the request for other parts of the app to use
		request.requestId = finalRequestId;
		if (correlationId) {
			request.correlationId = correlationId;
		}

		return finalRequestId;
	}

	getProtocolName(): string {
		return 'HTTP request';
	}
}

/**
 * Interceptor for HTTP request handlers that automatically extracts or generates request IDs
 * from HTTP headers and sets them in the request context for logging and tracing using AsyncLocalStorage.
 *
 * Supports the following headers (in order of preference):
 * - X-Request-ID
 * - X-Correlation-ID
 * - Request-ID
 * - Correlation-ID
 *
 * If no request ID is provided, a new UUID will be generated for the request.
 */
@Injectable()
export class HttpRequestIdInterceptor extends BaseRequestIdInterceptor {
	constructor(requestContextService: RequestContextService) {
		super(requestContextService, new HttpRequestIdExtractor());
	}
}
