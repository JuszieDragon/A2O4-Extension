import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: [
      'webRequest',
      'storage',
      '*://192.168.1.1/*',
      '*://127.0.0.1/*'
    ],
    browser_specific_settings: {
      gecko: {
        id: 'your-extension-name@example.com', // Must be in an email-like format
      },
    }
  }
});
