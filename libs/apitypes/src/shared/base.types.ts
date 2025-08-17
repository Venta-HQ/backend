// Base API types and interfaces

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
