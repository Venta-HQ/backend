import { describe, expect, it, vi } from 'vitest';
import { Logger } from './logger.service';

describe('Logger', () => {
	it('logs structured messages in production mode', () => {
		process.env.NODE_ENV = 'production';
		const logger = new Logger();
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		logger.log('hello', { a: 1 }, 'Ctx');
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});
});
