import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

export function withGrpcDeadline<T>(
	obs: Observable<T>,
	config: ConfigService,
	key: string = 'UPLOAD_GRPC_TIMEOUT_MS',
	fallbackMs: number = 10000,
): Observable<T> {
	const ms = Number(config.get<string>(key) || `${fallbackMs}`);
	return obs.pipe(timeout({ each: Number.isFinite(ms) && ms > 0 ? ms : fallbackMs }));
}
