import { Observable, throwError } from 'rxjs';
import { AppError, ErrorType } from '@app/nest/errors';
import { status } from '@grpc/grpc-js';
import { Catch, RpcExceptionFilter } from '@nestjs/common';

/**
 * Maps domain errors to gRPC status codes
 */
@Catch(AppError)
export class GrpcExceptionFilter implements RpcExceptionFilter<AppError> {
	catch(error: AppError): Observable<any> {
		const metadata = {
			details: error.context || {},
			timestamp: new Date().toISOString(),
		};

		// Map domain error types to gRPC status codes
		let code: status;
		switch (error.type) {
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

		return throwError(() => ({
			code,
			message: error.message,
			details: metadata,
		}));
	}
}
