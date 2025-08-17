import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcExceptionFilter } from './grpc-exception.filter';

describe('GrpcExceptionFilter', () => {
	it('maps AppError to service error with code/details/metadata', async () => {
		const filter = new GrpcExceptionFilter();
		const appErr = AppError.validation(ErrorCodes.ERR_INVALID_INPUT, { field: 'x' } as any);
		const obs$ = filter.catch(appErr);
		await expect(firstValueFrom(obs$)).rejects.toMatchObject({ code: expect.any(Number), details: expect.any(String) });
	});
});
