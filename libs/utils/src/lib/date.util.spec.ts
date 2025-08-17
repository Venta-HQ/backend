import { describe, expect, it } from 'vitest';
import {
	addDays,
	endOfDay,
	formatDuration,
	getRelativeTimeString,
	isBetweenDates,
	startOfDay,
	subtractDays,
	toISOWithTimezone,
} from './date.util';

describe('date.util', () => {
	it('toISOWithTimezone returns ISO string', () => {
		const s = toISOWithTimezone(new Date('2024-01-01T00:00:00Z'));
		expect(s).toBe('2024-01-01T00:00:00.000Z');
	});

	it('startOfDay and endOfDay', () => {
		const d = new Date('2024-03-21T15:30:45.123Z');
		const start = startOfDay(d);
		const end = endOfDay(d);
		expect(start.getHours()).toBe(0);
		expect(start.getMinutes()).toBe(0);
		expect(start.getSeconds()).toBe(0);
		expect(start.getMilliseconds()).toBe(0);
		expect(end.getHours()).toBe(23);
		expect(end.getMinutes()).toBe(59);
		expect(end.getSeconds()).toBe(59);
	});

	it('addDays and subtractDays', () => {
		const d = new Date('2024-03-21T00:00:00.000Z');
		expect(addDays(d, 1).toISOString()).toBe('2024-03-22T00:00:00.000Z');
		expect(subtractDays(d, 1).toISOString()).toBe('2024-03-20T00:00:00.000Z');
	});

	it('isBetweenDates', () => {
		const start = new Date('2024-03-01T00:00:00.000Z');
		const end = new Date('2024-03-31T23:59:59.999Z');
		expect(isBetweenDates(new Date('2024-03-15T12:00:00.000Z'), start, end)).toBe(true);
		expect(isBetweenDates(new Date('2024-04-01T00:00:00.000Z'), start, end)).toBe(false);
	});

	it('formatDuration', () => {
		expect(formatDuration(45_000)).toBe('45s');
		expect(formatDuration(90 * 1000)).toBe('1m 30s');
		expect(formatDuration(2 * 3600 * 1000)).toBe('2h 0m');
	});

	it('getRelativeTimeString', () => {
		const ref = new Date('2024-01-01T00:00:00.000Z');
		expect(getRelativeTimeString(new Date('2024-01-01T00:00:30.000Z'), ref)).toBe('just now');
		expect(getRelativeTimeString(new Date('2024-01-01T00:05:00.000Z'), ref)).toBe('5m from now');
	});
});
