import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AuthContext, AuthProtocol, AuthUser } from '../types';

@Injectable()
export class GrpcAuthInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const metadata = context.getArgByIndex(1); // gRPC metadata is the second argument

		// Try to get existing auth context
		const authContextStr = metadata.get('authContext')?.[0];
		const userStr = metadata.get('user')?.[0];

		if (authContextStr && userStr) {
			try {
				const user: AuthUser = JSON.parse(userStr);
				const authContext: AuthContext = JSON.parse(authContextStr);

				// Propagate auth data to outgoing metadata
				metadata.set('user', JSON.stringify(user));
				metadata.set('authContext', JSON.stringify(authContext));
			} catch (error) {
				// If parsing fails, create new auth context
				this.createNewAuthContext(metadata);
			}
		} else {
			// If no auth context exists, create new one
			this.createNewAuthContext(metadata);
		}

		return next.handle();
	}

	private createNewAuthContext(metadata: any): void {
		const authContext: AuthContext = {
			correlationId: metadata.get('x-correlation-id')?.[0]?.toString() || randomUUID(),
			timestamp: Date.now(),
			metadata: {
				protocol: AuthProtocol.GRPC,
			},
		};

		metadata.set('authContext', JSON.stringify(authContext));
	}
}
