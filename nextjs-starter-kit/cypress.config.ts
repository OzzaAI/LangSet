import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      // Test environment variables
      TEST_USER_EMAIL: 'test@langset.dev',
      TEST_USER_PASSWORD: 'TestPassword123!',
      API_BASE_URL: 'http://localhost:3000/api'
    },
    experimentalStudio: true
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})