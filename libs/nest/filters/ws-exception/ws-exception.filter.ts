import { WsError } from 'libs/nest/errors/error-types/ws-error';
import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch(WsError)
export class WsErrorFilter extends BaseWsExceptionFilter {
	catch(exception: WsError, host: ArgumentsHost) {
		const client = host.switchToWs().getClient(); // WebSocket client

		const error = exception.getError() as { code?: string; data: any; message: string };

		// Custom error response logic
		client.emit('error', {
			code: error.code ?? 'UNKNOWN_ERROR',
			data: error.data,
			message: error.message || 'An unknown error occurred',
		});
	}
}
