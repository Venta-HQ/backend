/**
 * Test data generators
 */

/**
 * Test data generators
 */
export const generators = {
  /**
   * Generates a random UUID
   */
  uuid: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),

  /**
   * Generates a random email
   */
  email: () => `test-${Math.random().toString(36).substr(2, 9)}@example.com`,

  /**
   * Generates a random string
   */
  string: (length = 10) => Math.random().toString(36).substr(2, length),

  /**
   * Generates a random number
   */
  number: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,

  /**
   * Generates a random date
   */
  date: (start = new Date(2020, 0, 1), end = new Date()) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
}; 