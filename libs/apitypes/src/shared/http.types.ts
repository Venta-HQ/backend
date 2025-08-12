import { Request } from 'express';

/**
 * Core user information attached to requests
 */
export interface AuthUser {
	id: string;
	clerkId: string;
	metadata?: Record<string, unknown>;
}

/**
 * Authentication context with additional metadata
 */
export interface AuthContext {
	user: AuthUser;
	correlationId: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
}

/**
 * Base HTTP request with optional metadata
 * Used for any HTTP endpoint that might have various attached metadata
 */
export interface HttpRequest extends Request {
	user?: AuthUser;
	authContext?: AuthContext;
	requestId?: string;
	correlationId?: string;
	// Room for future metadata expansion
	metadata?: Record<string, unknown>;
}

/**
 * HTTP request with guaranteed authentication
 * Used for endpoints protected by authentication guards
 */
export interface AuthenticatedRequest extends HttpRequest {
	user: AuthUser;
	authContext: AuthContext;
}
