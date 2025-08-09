import { z } from 'zod';

/**
 * Base API request interface
 */
export interface ApiRequest<T = unknown> {
	body?: T;
	query?: Record<string, unknown>;
	params?: Record<string, string>;
	headers?: Record<string, string>;
	user?: {
		id: string;
		roles: string[];
		metadata?: Record<string, unknown>;
	};
}

/**
 * Base API response interface
 */
export interface ApiResponse<T = unknown> {
	data?: T;
	error?: ApiError;
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
		[key: string]: unknown;
	};
}

/**
 * API error interface
 */
export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

/**
 * Base pagination parameters
 */
export interface PaginationParams {
	page?: number;
	limit?: number;
	sort?: string;
	order?: 'asc' | 'desc';
}

/**
 * Base validation schemas
 */
export const PaginationSchema = z.object({
	page: z.number().min(1).optional(),
	limit: z.number().min(1).max(100).optional(),
	sort: z.string().optional(),
	order: z.enum(['asc', 'desc']).optional(),
});

export const ApiErrorSchema = z.object({
	code: z.string(),
	message: z.string(),
	details: z.record(z.unknown()).optional(),
});

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.object({
		data: dataSchema.optional(),
		error: ApiErrorSchema.optional(),
		meta: z
			.object({
				page: z.number().optional(),
				limit: z.number().optional(),
				total: z.number().optional(),
			})
			.catchall(z.unknown())
			.optional(),
	});
