import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainError } from './domain-errors';

/**
 * App-level interceptor that automatically appends domain context to DomainError instances
 * This eliminates the need for domain-specific error classes
 * Uses explicit DDD domain rather than technical app name
 */
@Injectable()
export class DomainErrorInterceptor implements NestInterceptor {
	constructor(private readonly configService: ConfigService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			catchError((error) => {
				if (error instanceof DomainError && !error.domain) {
					// Auto-append domain based on explicit DDD domain
					const domain = this.configService.get<string>('DOMAIN');
					if (domain) {
						error.domain = domain;
					}
				}
				return throwError(() => error);
			}),
		);
	}
}
