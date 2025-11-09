import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'logs/',
        'uploads/',
        '**/*.config.js',
        'src/error.js',
        'src/main.js',
        'src/socket.js'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
