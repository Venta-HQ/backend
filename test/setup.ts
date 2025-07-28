import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Set up any global test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up any global test environment
});

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NATS_URL = 'nats://localhost:4222';
process.env.CLERK_SECRET_KEY = 'test_clerk_secret';
process.env.CLERK_PUBLISHABLE_KEY = 'test_clerk_publishable';
process.env.ALGOLIA_APPLICATION_ID = 'test_algolia_app_id';
process.env.ALGOLIA_API_KEY = 'test_algolia_api_key';
process.env.CLOUDINARY_CLOUD_NAME = 'test_cloudinary';
process.env.CLOUDINARY_API_KEY = 'test_cloudinary_key';
process.env.CLOUDINARY_API_SECRET = 'test_cloudinary_secret'; 