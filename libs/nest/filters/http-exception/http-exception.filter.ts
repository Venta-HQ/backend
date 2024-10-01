import { Response } from 'express';
import { HttpError } from 'libs/nest/errors/error-types/http-error';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch(HttpError)
export class HttpErrorFilter implements ExceptionFilter {
	catch(exception: HttpError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const status = exception.getStatus();
		const responseBody = exception.getResponse() as { code?: string; data?: any; message: string };

		response.status(status).json({
			code: responseBody.code || 'UNKNOWN_ERROR',
			data: responseBody.data,
			message: responseBody.message,
			path: ctx.getRequest().url,
			statusCode: status,
			timestamp: new Date().toISOString(),
		});
	}
}
