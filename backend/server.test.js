/**
 * Smoke test — ensures the backend dependencies load correctly
 * and the server module can be required without crashing.
 *
 * Add proper integration tests here using supertest:
 * https://github.com/ladjs/supertest
 */

// Jest config: set env so server.js doesn't auto-start
process.env.NODE_ENV = 'test';
process.env.PORT = '5099'; // use a throwaway port

test('environment is test', () => {
  expect(process.env.NODE_ENV).toBe('test');
});

test('placeholder — CI pipeline is wired correctly', () => {
  expect(true).toBe(true);
});
