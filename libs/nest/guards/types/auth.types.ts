import { Request } from 'express';
import { Socket } from 'socket.io';

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
 * gRPC metadata with auth context
 */
export interface AuthenticatedMetadata {
	user?: AuthUser;
	authContext?: AuthContext;
}
