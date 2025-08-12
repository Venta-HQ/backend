import { Request } from 'express';
import { Socket } from 'socket.io';
import { Metadata } from '@grpc/grpc-js';

/**
 * Represents a user in the authentication system
 */
export interface AuthUser {
	id: string;
	clerkId: string;
	metadata?: Record<string, unknown>;
}

/**
 * Protocol-agnostic authentication context
 */
export interface AuthContext {
	user: AuthUser;
	correlationId: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
}

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
 * Express request with auth context
 */
export interface AuthenticatedRequest extends Request {
	user?: AuthUser;
	authContext?: AuthContext;
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
