import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Logger } from '../../modules/core/logger/logger.service';
import { RequestContextService } from '../../modules/networking/request-context';
import { BaseRequestIdInterceptor, RequestIdExtractor } from './base-request-id.interceptor';

/**
 * gRPC-specific request ID extractor
 */
class GrpcRequestIdExtractor implements RequestIdExtractor {
	extractId(context: ExecutionContext): string | undefined {
		const grpcContext = context.switchToRpc();
		const metadata = grpcContext.getContext();

		return metadata?.get('x-request-id')?.[0];
	}

	getProtocolName(): string {
		return 'gRPC request';
	}
}

/**
 * Interceptor for gRPC request handlers that automatically extracts request IDs
 * from gRPC metadata and sets them in the request context for logging and tracing.
 */
@Injectable()
export class GrpcRequestIdInterceptor extends BaseRequestIdInterceptor {
	constructor(requestContextService: RequestContextService, @Inject(Logger) logger: Logger) {
		super(requestContextService, new GrpcRequestIdExtractor(), logger);
	}
}
