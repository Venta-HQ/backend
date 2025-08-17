import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ArgumentMetadata } from '@nestjs/common';
import { AppError } from '@venta/nest/errors';
import { SchemaValidatorPipe } from './schema-validator.pipe';

describe('SchemaValidatorPipe', () => {
	const meta: ArgumentMetadata = { type: 'body' } as any;

	it('passes valid data through', () => {
		const pipe = new SchemaValidatorPipe(z.object({ id: z.string() }));
		const value = pipe.transform({ id: 'x' }, meta);
		expect(value).toEqual({ id: 'x' });
	});

	it('throws AppError on zod validation failure', () => {
		const pipe = new SchemaValidatorPipe(z.object({ id: z.string().min(2) }));
		try {
			pipe.transform({ id: 'x' }, meta);
			expect.unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
		}
	});
});
