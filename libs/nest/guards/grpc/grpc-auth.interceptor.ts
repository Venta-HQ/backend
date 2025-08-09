import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

@Injectable()
export class GrpcAuthInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const metadata = context.getArgByIndex(1); // gRPC metadata is the second argument

		// Simply propagate existing auth data if it exists
		const authContextStr = metadata.get('authContext')?.[0];
		const userStr = metadata.get('user')?.[0];

		if (authContextStr && userStr) {
			// Ensure the metadata is set for outgoing calls
			metadata.set('authContext', authContextStr);
			metadata.set('user', userStr);
		}

		return next.handle();
	}
}
