import { GrpcError } from '@app/nest/errors';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch(GrpcError)
export class GrpcErrorFilter implements ExceptionFilter {
	catch(exception: GrpcError, host: ArgumentsHost) {
		const ctx = host.switchToRpc();
		const response = ctx.getContext(); // gRPC context does not have a response object like HTTP
		const code = exception.code || 'UNKNOWN_ERROR';
		const message = exception.message || 'An unknown error occurred';
		const errorCode = exception.errorCode || '';

		// You might want to create a response object, depending on your gRPC setup.
		// For instance, if you are using gRPC with Protocol Buffers, you would typically return an error object.
		response.error({ code, errorCode, message });
	}
}
