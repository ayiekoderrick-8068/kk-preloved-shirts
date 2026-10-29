import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  projects: [
    // Demo mode: no database configured (the default build).
    { name: 'demo', testIgnore: /gated\.spec/, use: { baseURL: 'http://localhost:4173' } },
    // A build wired to a mocked Supabase URL, to check the admin sign-in gate.
    { name: 'gated', testMatch: /gated\.spec/, use: { baseURL: 'http://localhost:4174' } },
  ],
  webServer: [
    {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npx vite build --outDir dist-gated && npx vite preview --outDir dist-gated --port 4174 --strictPort',
      env: { VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
      url: 'http://localhost:4174',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
