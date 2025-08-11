import { randomUUID } from 'crypto';
import { ExecutionContext, Injectable, Scope } from '@nestjs/common';
import { RequestContextService } from '../../modules/networking/request-context';
import { BaseRequestIdInterceptor, RequestIdExtractor } from './base-request-id.interceptor';

/**
 * HTTP-specific request ID extractor
 */
class HttpRequestIdExtractor implements RequestIdExtractor {
	extractId(context: ExecutionContext): string | undefined {
		const request = context.switchToHttp().getRequest();

		// Try to get request ID from headers (X-Request-ID, X-Correlation-ID, etc.)
		const requestId =
			request.headers['x-request-id'] ||
			request.headers['x-correlation-id'] ||
			request.headers['request-id'] ||
			request.headers['correlation-id'];

		// If no request ID provided, generate a new one for this request
		if (!requestId) {
			const newRequestId = randomUUID();
			// Set it on the request for other parts of the app to use
			request.requestId = newRequestId;
			return newRequestId;
		}

		// Set the provided request ID on the request object
		request.requestId = requestId;
		return requestId;
	}

	getProtocolName(): string {
		return 'HTTP request';
	}
}

/**
 * Interceptor for HTTP request handlers that automatically extracts or generates request IDs
 * from HTTP headers and sets them in the request context for logging and tracing.
 *
 * Supports the following headers (in order of preference):
 * - X-Request-ID
 * - X-Correlation-ID
 * - Request-ID
 * - Correlation-ID
 *
 * If no request ID is provided, a new UUID will be generated for the request.
 */
@Injectable({ scope: Scope.REQUEST })
export class HttpRequestIdInterceptor extends BaseRequestIdInterceptor {
	constructor(requestContextService: RequestContextService) {
		super(requestContextService, new HttpRequestIdExtractor());
	}
}
