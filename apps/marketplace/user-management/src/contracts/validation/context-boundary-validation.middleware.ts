import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

/**
 * Context Boundary Validation Middleware
 *
 * Validates data crossing domain boundaries using Zod schemas
 * to ensure data integrity and prevent context violations
 */
@Injectable()
export class ContextBoundaryValidationMiddleware implements NestMiddleware {
	private readonly logger = new Logger(ContextBoundaryValidationMiddleware.name);

	// ============================================================================
	// Validation Schemas
	// ============================================================================

	/**
	 * Schema for validating location data crossing boundaries
	 */
	private readonly locationSchema = z.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
	});

	/**
	 * Schema for validating user data crossing boundaries
	 */
	private readonly userDataSchema = z.object({
		email: z.string().email(),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
		metadata: z.record(z.any()).optional(),
	});

	/**
	 * Schema for validating subscription data crossing boundaries
	 */
	private readonly subscriptionDataSchema = z.object({
		productId: z.string().min(1),
		status: z.string().min(1),
		metadata: z.record(z.any()).optional(),
	});

	/**
	 * Schema for validating file data crossing boundaries
	 */
	private readonly fileDataSchema = z.object({
		filename: z.string().min(1),
		mimeType: z.string().min(1),
		size: z.number().positive().optional(),
		context: z.enum(['vendor_profile', 'user_profile', 'product_image', 'document']),
	});

	/**
	 * Schema for validating bounds data crossing boundaries
	 */
	private readonly boundsSchema = z.object({
		northEast: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		southWest: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
	});

	// ============================================================================
	// Middleware Implementation
	// ============================================================================

	use(req: Request, res: Response, next: NextFunction) {
		try {
			// Extract domain context from request
			const domain = this.extractDomainFromRequest(req);
			const operation = this.extractOperationFromRequest(req);

			// Validate based on domain and operation
			this.validateContextBoundary(domain, operation, req.body, req.query);

			// Add validation metadata to request
			req['contextValidation'] = {
				domain,
				operation,
				validatedAt: new Date().toISOString(),
			};

			next();
		} catch (error) {
			this.logger.error('Context boundary validation failed', error.stack, {
				url: req.url,
				method: req.method,
				error,
			});

			// Return validation error response
			if (error instanceof AppError) {
				res.status(400).json({
					error: {
						type: error.type,
						code: error.code,
						message: error.message,
						details: error.details,
					},
				});
			} else {
				res.status(400).json({
					error: {
						type: ErrorType.VALIDATION,
						code: ErrorCodes.CONTEXT_BOUNDARY_VIOLATION,
						message: 'Context boundary validation failed',
						details: { error: error.message },
					},
				});
			}
		}
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate context boundary based on domain and operation
	 */
	private validateContextBoundary(domain: string, operation: string, body: any, query: any) {
		this.logger.debug('Validating context boundary', {
			domain,
			operation,
			hasBody: !!body,
			hasQuery: !!query,
		});

		switch (domain) {
			case 'location':
				this.validateLocationContext(operation, body, query);
				break;

			case 'user':
				this.validateUserContext(operation, body, query);
				break;

			case 'subscription':
				this.validateSubscriptionContext(operation, body, query);
				break;

			case 'file':
				this.validateFileContext(operation, body, query);
				break;

			default:
				this.logger.warn('Unknown domain for context validation', { domain, operation });
		}
	}

	/**
	 * Validate location context boundary
	 */
	private validateLocationContext(operation: string, body: any, query: any) {
		switch (operation) {
			case 'updateLocation':
				if (body && body.location) {
					this.locationSchema.parse(body.location);
				}
				break;

			case 'getVendorsInArea':
				if (query && query.bounds) {
					this.boundsSchema.parse(JSON.parse(query.bounds));
				}
				break;

			case 'getNearbyVendors':
				if (query && query.center) {
					this.locationSchema.parse(JSON.parse(query.center));
				}
				if (query && query.radius) {
					const radius = parseInt(query.radius);
					if (isNaN(radius) || radius <= 0 || radius > 50000) {
						throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_RADIUS, 'Invalid radius value', {
							radius: query.radius,
						});
					}
				}
				break;

			default:
				this.logger.debug('No specific validation for location operation', { operation });
		}
	}

	/**
	 * Validate user context boundary
	 */
	private validateUserContext(operation: string, body: any, query: any) {
		switch (operation) {
			case 'createUser':
				if (body) {
					this.userDataSchema.parse(body);
				}
				break;

			case 'updateUser':
				if (body) {
					// For updates, all fields are optional
					const updateSchema = this.userDataSchema.partial();
					updateSchema.parse(body);
				}
				break;

			case 'getUser':
				if (query && query.userId) {
					if (typeof query.userId !== 'string' || query.userId.length === 0) {
						throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_USER_ID, 'Invalid user ID', {
							userId: query.userId,
						});
					}
				}
				break;

			default:
				this.logger.debug('No specific validation for user operation', { operation });
		}
	}

	/**
	 * Validate subscription context boundary
	 */
	private validateSubscriptionContext(operation: string, body: any, query: any) {
		switch (operation) {
			case 'createSubscription':
				if (body) {
					this.subscriptionDataSchema.parse(body);
				}
				break;

			case 'updateSubscription':
				if (body) {
					// For updates, all fields are optional
					const updateSchema = this.subscriptionDataSchema.partial();
					updateSchema.parse(body);
				}
				break;

			case 'getSubscription':
				if (query && query.subscriptionId) {
					if (typeof query.subscriptionId !== 'string' || query.subscriptionId.length === 0) {
						throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_SUBSCRIPTION_ID, 'Invalid subscription ID', {
							subscriptionId: query.subscriptionId,
						});
					}
				}
				break;

			default:
				this.logger.debug('No specific validation for subscription operation', { operation });
		}
	}

	/**
	 * Validate file context boundary
	 */
	private validateFileContext(operation: string, body: any, query: any) {
		switch (operation) {
			case 'uploadFile':
				if (body) {
					this.fileDataSchema.parse(body);
				}
				break;

			case 'getFile':
				if (query && query.fileId) {
					if (typeof query.fileId !== 'string' || query.fileId.length === 0) {
						throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FILE_ID, 'Invalid file ID', {
							fileId: query.fileId,
						});
					}
				}
				break;

			case 'deleteFile':
				if (query && query.fileId) {
					if (typeof query.fileId !== 'string' || query.fileId.length === 0) {
						throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FILE_ID, 'Invalid file ID', {
							fileId: query.fileId,
						});
					}
				}
				break;

			default:
				this.logger.debug('No specific validation for file operation', { operation });
		}
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Extract domain from request
	 */
	private extractDomainFromRequest(req: Request): string {
		// Extract from URL path
		const path = req.path;

		if (path.includes('/location')) {
			return 'location';
		}

		if (path.includes('/user')) {
			return 'user';
		}

		if (path.includes('/subscription')) {
			return 'subscription';
		}

		if (path.includes('/file')) {
			return 'file';
		}

		// Extract from headers
		const domainHeader = req.headers['x-domain'] as string;
		if (domainHeader) {
			return domainHeader;
		}

		// Default to unknown
		return 'unknown';
	}

	/**
	 * Extract operation from request
	 */
	private extractOperationFromRequest(req: Request): string {
		const method = req.method;
		const path = req.path;

		// Map HTTP method + path to operation
		if (method === 'POST' && path.includes('/location')) {
			return 'updateLocation';
		}

		if (method === 'GET' && path.includes('/location/vendors')) {
			return 'getVendorsInArea';
		}

		if (method === 'GET' && path.includes('/location/nearby')) {
			return 'getNearbyVendors';
		}

		if (method === 'POST' && path.includes('/user')) {
			return 'createUser';
		}

		if (method === 'PUT' && path.includes('/user')) {
			return 'updateUser';
		}

		if (method === 'GET' && path.includes('/user')) {
			return 'getUser';
		}

		if (method === 'POST' && path.includes('/subscription')) {
			return 'createSubscription';
		}

		if (method === 'PUT' && path.includes('/subscription')) {
			return 'updateSubscription';
		}

		if (method === 'GET' && path.includes('/subscription')) {
			return 'getSubscription';
		}

		if (method === 'POST' && path.includes('/file')) {
			return 'uploadFile';
		}

		if (method === 'GET' && path.includes('/file')) {
			return 'getFile';
		}

		if (method === 'DELETE' && path.includes('/file')) {
			return 'deleteFile';
		}

		// Extract from headers
		const operationHeader = req.headers['x-operation'] as string;
		if (operationHeader) {
			return operationHeader;
		}

		// Default to unknown
		return 'unknown';
	}
}
