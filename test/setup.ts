import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
import { vi } from 'vitest';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });

// Global test timeout
beforeEach(() => {
	vi.setConfig({ testTimeout: 10000 });
});

// Clean up after each test
afterEach(() => {
	vi.clearAllMocks();
}); 