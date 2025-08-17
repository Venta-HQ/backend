import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
	coordinatesSchema,
	dateRangeSchema,
	isPlainObject,
	isValidEmail,
	isValidPhone,
	isValidUUID,
	paginationSchema,
	safeParse,
} from './validation.util';

describe('validation.util', () => {
	it('validates UUID v4', () => {
		// v4 UUID must have version 4 and valid variant bits
		expect(isValidUUID('3b12f1df-5232-4e3c-8c52-9f1b5f3c1a9f')).toBe(true);
		expect(isValidUUID('3b12f1df-5232-4e3c-1c52-9f1b5f3c1a9f')).toBe(false); // wrong variant
		expect(isValidUUID('not-a-uuid')).toBe(false);
	});

	it('validates email format', () => {
		expect(isValidEmail('user@example.com')).toBe(true);
		expect(isValidEmail('user@')).toBe(false);
		expect(isValidEmail('userexample.com')).toBe(false);
	});

	it('validates phone format', () => {
		expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
		expect(isValidPhone('5551234567')).toBe(true);
		expect(isValidPhone('123')).toBe(false);
	});

	it('parses pagination schema with defaults', () => {
		const parsed = paginationSchema.parse({});
		expect(parsed.page).toBe(1);
		expect(parsed.limit).toBe(20);
	});

	it('validates date range schema', () => {
		const valid = dateRangeSchema.safeParse({ startDate: '2024-01-01T00:00:00Z', endDate: '2024-01-02T00:00:00Z' });
		expect(valid.success).toBe(true);

		const invalid = dateRangeSchema.safeParse({ startDate: '2024-01-03T00:00:00Z', endDate: '2024-01-02T00:00:00Z' });
		expect(invalid.success).toBe(false);
	});

	it('validates coordinates schema', () => {
		const valid = coordinatesSchema.safeParse({ lat: 40.7128, lng: -74.006 });
		expect(valid.success).toBe(true);

		const invalid = coordinatesSchema.safeParse({ lat: 100, lng: 200 });
		expect(invalid.success).toBe(false);
	});

	it('isPlainObject works', () => {
		expect(isPlainObject({})).toBe(true);
		expect(isPlainObject({ a: 1 })).toBe(true);
		expect(isPlainObject([])).toBe(false);
		expect(isPlainObject(null)).toBe(false);
		expect(isPlainObject(new Date())).toBe(false);
	});

	it('safeParse returns data or null', () => {
		const schema = z.object({ id: z.string(), age: z.number().min(0) });
		expect(safeParse(schema, { id: '1', age: 20 })).toEqual({ id: '1', age: 20 });
		expect(safeParse(schema, { id: '1', age: -1 })).toBeNull();
	});
});
