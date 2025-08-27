import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AppError } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';

@Injectable()
export class WsErrorInterceptor implements NestInterceptor {
	private readonly logger = new Logger().setContext(WsErrorInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		// Only apply to WebSocket contexts
		if (context.getType() !== 'ws') return next.handle();

		return next.handle().pipe(
			catchError((error) => {
				const client = context.switchToWs().getClient();

				let errorPayload: any;
				if (error instanceof WsException) {
					errorPayload = error.getError();
				} else if (error instanceof AppError) {
					errorPayload = (error as any).toWsException().getError();
				} else {
					errorPayload = {
						error: 'Internal error',
						message: (error as any)?.message ?? 'An unexpected error occurred',
					};
				}

				// Emit error event to client (use custom channel to avoid special 'error' semantics)
				try {
					client.emit('ws_error', errorPayload);
				} catch {}

				// Keep connection alive; client decides what to do
				return of(null);
			}),
		);
	}
}
