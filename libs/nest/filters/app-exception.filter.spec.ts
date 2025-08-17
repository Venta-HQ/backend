import { describe, expect, it, vi } from 'vitest';
import { ArgumentsHost, HttpException } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AppExceptionFilter } from './app-exception.filter';

function createHttpHostMock(path = '/test', requestId?: string): ArgumentsHost {
	const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
	const req = { url: path, headers: requestId ? { 'x-request-id': requestId } : {} } as any;
	return {
		getType: () => 'http',
		switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
	} as any;
}

describe('AppExceptionFilter', () => {
	const configService = { get: vi.fn().mockReturnValue('test-domain') } as any;
	const filter = new AppExceptionFilter(configService);

	it('handles AppError for HTTP', () => {
		const host = createHttpHostMock('/path', 'rid-1');
		const error = AppError.validation(ErrorCodes.ERR_INVALID_INPUT, { field: 'request' } as any);
		filter.catch(error, host);
		const res = (host.switchToHttp() as any).getResponse();
		expect(res.status).toHaveBeenCalled();
		expect(res.json).toHaveBeenCalled();
	});

	it('maps HttpException to AppError', () => {
		const host = createHttpHostMock('/path');
		const httpError = new HttpException('bad', 400);
		filter.catch(httpError, host);
		const res = (host.switchToHttp() as any).getResponse();
		expect(res.status).toHaveBeenCalled();
	});
});
