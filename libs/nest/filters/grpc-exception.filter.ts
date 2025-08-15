import { Observable, throwError } from 'rxjs';
import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { AppError, encodeAppErrorToGrpc } from '@venta/nest/errors';

/**
 * Maps domain errors to gRPC status codes
 */
@Catch(AppError)
export class GrpcExceptionFilter implements RpcExceptionFilter<AppError> {
	catch(error: AppError): Observable<any> {
		const { code, message, metadata } = encodeAppErrorToGrpc(error);
		return throwError(() => {
			const serviceError: any = new Error(message);
			serviceError.code = code;
			serviceError.details = message;
			serviceError.metadata = metadata;
			return serviceError;
		});
	}
}
