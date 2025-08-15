import { Metadata, status } from '@grpc/grpc-js';
import { AppError } from './app-error';
import { ErrorCodes, ErrorType } from './error-definitions';

export const APP_ERROR_BIN_KEY = 'app-error-bin';

export function encodeAppErrorToGrpc(error: AppError): {
	code: status;
	message: string;
	metadata: Metadata;
} {
	const envelope = {
		message: error.message,
		errorCode: error.errorCode,
		errorType: error.errorType,
		data: error.data || {},
		timestamp: new Date().toISOString(),
	};

	const metadata = new Metadata();
	metadata.set(APP_ERROR_BIN_KEY, Buffer.from(JSON.stringify(envelope)));

	let code: status;
	switch (error.errorType) {
		case ErrorType.NOT_FOUND:
			code = status.NOT_FOUND;
			break;
		case ErrorType.VALIDATION:
			code = status.INVALID_ARGUMENT;
			break;
		case ErrorType.UNAUTHORIZED:
			code = status.UNAUTHENTICATED;
			break;
		case ErrorType.FORBIDDEN:
			code = status.PERMISSION_DENIED;
			break;
		case ErrorType.EXTERNAL_SERVICE:
			code = status.UNAVAILABLE;
			break;
		case ErrorType.INTERNAL:
		default:
			code = status.INTERNAL;
	}

	return {
		code,
		message: error.message,
		metadata,
	};
}

export function decodeGrpcError(errorLike: any): AppError | null {
	if (!errorLike || typeof errorLike !== 'object') return null;

	// Prefer trailers metadata
	let parsed: any = {};
	const meta = errorLike.metadata;
	if (meta && typeof meta.get === 'function') {
		const values = meta.get(APP_ERROR_BIN_KEY);
		if (Array.isArray(values) && values.length > 0) {
			const first = values[0] as any;
			try {
				const json = Buffer.isBuffer(first) ? first.toString('utf8') : String(first);
				parsed = JSON.parse(json);
			} catch {}
		}
	}

	// Fallback to details string/object if present
	if ((!parsed || Object.keys(parsed).length === 0) && errorLike.details) {
		const details = errorLike.details;
		if (typeof details === 'string') {
			try {
				parsed = JSON.parse(details);
			} catch {}
		} else if (typeof details === 'object') {
			parsed = details;
		}
	}

	if (parsed && parsed.errorCode && parsed.errorType) {
		const appError = AppError.internal(parsed.errorCode, parsed.data || {});
		Object.defineProperties(appError, {
			errorType: { value: parsed.errorType, writable: false },
			message: { value: parsed.message || errorLike.message, writable: false },
			timestamp: { value: parsed.timestamp || new Date().toISOString(), writable: false },
		});
		return appError;
	}

	return null;
}

export function mapGrpcCodeToAppErrorFallback(code?: number, message?: string): AppError {
	switch (code) {
		case 3:
			return AppError.validation(ErrorCodes.ERR_INVALID_INPUT, { field: 'request' });
		case 5:
			return AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, { resourceType: 'resource', resourceId: 'request' });
		case 7:
			return AppError.forbidden(ErrorCodes.ERR_INSUFFICIENT_PERMISSIONS, { resource: 'request' });
		case 8:
			return AppError.rateLimit(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, { retryAfterSeconds: 60 });
		case 14:
			return AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, { service: 'external' });
		case 16:
			return AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
		default:
			return AppError.internal(ErrorCodes.ERR_INTERNAL, { originalRpcCode: code, originalMessage: message });
	}
}
