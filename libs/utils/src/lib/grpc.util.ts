import { Metadata } from '@grpc/grpc-js';
import { AuthUser, GrpcRequestMetadata } from '@venta/apitypes';

/**
 * Extracts authentication data from gRPC metadata
 * @param metadata - gRPC metadata from the interceptor
 * @returns Authentication data or null if not found
 */
export function extractAuthFromMetadata(metadata?: Metadata): AuthUser | null {
	if (!metadata) return null;

	const userId = metadata.get('x-user-id')?.[0] as string;
	const clerkId = metadata.get('x-clerk-id')?.[0] as string;

	if (!userId) return null;

	return { id: userId, clerkId };
}

/**
 * Extracts request ID from gRPC metadata
 * @param metadata - gRPC metadata from the interceptor
 * @returns Request ID or null if not found
 */
export function extractRequestIdFromMetadata(metadata?: Metadata): string | null {
	if (!metadata) return null;
	const requestId = metadata.get('x-request-id')?.[0] as string;
	return requestId || null;
}

/**
 * Extracts both user ID and request ID from gRPC metadata
 * @param metadata - gRPC metadata from the interceptor
 * @returns User ID and request ID or null if not found
 */
export function extractGrpcRequestMetadata(metadata?: Metadata): GrpcRequestMetadata | null {
	const auth = extractAuthFromMetadata(metadata);
	const requestId = extractRequestIdFromMetadata(metadata);

	return {
		...(auth?.id ? { user: { id: auth.id, clerkId: auth?.clerkId } } : {}),
		requestId,
	};
}
