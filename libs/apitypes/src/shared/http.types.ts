import { Request } from 'express';
import { AuthUser } from './auth.types';

/**
 * Base HTTP request with optional metadata
 * Used for any HTTP endpoint that might have various attached metadata
 */
export interface HttpRequest extends Request {
	user?: AuthUser;
	requestId?: string;
	// Room for future metadata expansion
	metadata?: Record<string, unknown>;
}

/**
 * HTTP request with guaranteed authentication
 * Used for endpoints protected by authentication guards
 */
export interface AuthenticatedRequest extends HttpRequest {
	user: AuthUser;
}
