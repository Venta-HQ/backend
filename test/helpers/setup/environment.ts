/**
 * Test environment setup utilities
 */

/**
 * Test environment setup utilities
 */
export const testEnv = {
  /**
   * Sets up common environment variables for testing
   */
  setup: () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.NATS_URL = 'nats://localhost:4222';
    process.env.CLERK_SECRET_KEY = 'test_clerk_secret';
    process.env.ALGOLIA_APP_ID = 'test_algolia_app_id';
    process.env.ALGOLIA_API_KEY = 'test_algolia_api_key';
  },

  /**
   * Cleans up environment variables after tests
   */
  cleanup: () => {
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.NATS_URL;
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.ALGOLIA_APP_ID;
    delete process.env.ALGOLIA_API_KEY;
  },
}; 