import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '@venta/nest/errors';
import { ensureRequiredString, validateSchema } from './schema-validation.util';

describe('schema-validation.util', () => {
	it('validateSchema parses valid data', () => {
		const schema = z.object({ id: z.string() });
		expect(validateSchema(schema, { id: 'abc' })).toEqual({ id: 'abc' });
	});

	it('validateSchema throws AppError on ZodError', () => {
		const schema = z.object({ id: z.string().min(2) });
		try {
			validateSchema(schema, { id: 'a' } as any);
			expect.unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
			const err = e as AppError<any>;
			expect(err.errorCode).toBeDefined();
		}
	});

	it('ensureRequiredString returns trimmed', () => {
		expect(ensureRequiredString('  hello  ', 'name')).toBe('hello');
	});

	it('ensureRequiredString throws on empty', () => {
		try {
			ensureRequiredString('   ', 'name');
			expect.unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
		}
	});
});
