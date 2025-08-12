import { Socket } from 'socket.io';
import { Metadata } from '@grpc/grpc-js';
import type { AuthContext, AuthUser } from '@venta/apitypes';

// Re-export HTTP request types from apitypes for convenience
export type { HttpRequest, AuthenticatedRequest, AuthUser, AuthContext } from '@venta/apitypes';

/**
 * Protocol-specific authentication metadata
 */
export interface AuthMetadata {
	protocol: AuthProtocol;
	token?: string;
	headers?: Record<string, string>;
	metadata?: Record<string, unknown>;
}

/**
 * Supported authentication protocols
 */
export enum AuthProtocol {
	HTTP = 'http',
	WEBSOCKET = 'websocket',
	GRPC = 'grpc',
}

/**
 * Socket.IO socket with auth context
 */
export interface AuthenticatedSocket extends Socket {
	user?: AuthUser;
	authContext?: AuthContext;
}

/**
 * gRPC call object with auth context
 */
export interface AuthenticatedGrpcContext {
	user: AuthUser;
	metadata: Metadata;
	// Other properties from ServerUnaryCall can be added as needed
}
