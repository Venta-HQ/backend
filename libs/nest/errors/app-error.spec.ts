import { describe, expect, it } from 'vitest';
import { HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AppError } from './app-error';
import { ErrorCodes } from './error-definitions';

describe('AppError', () => {
	it('creates validation AppError and converts to HttpException', () => {
		const err = AppError.validation(ErrorCodes.ERR_INVALID_INPUT, { field: 'name' } as any);
		expect(err.errorType).toBeDefined();
		const http = err.toHttpException();
		expect(http).toBeInstanceOf(HttpException);
	});

	it('converts to WsException', () => {
		const err = AppError.rateLimit(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, { retryAfterSeconds: 60 } as any);
		const ws = err.toWsException();
		expect(ws).toBeInstanceOf(WsException);
	});
});
