import 'reflect-metadata';
import { resolve } from 'path';
import { config } from 'dotenv';
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
