import { defineConfig } from 'vitest/config'
import ViteTsconfigPaths from 'vite-tsconfig-paths'
export default defineConfig({
  test: {
    globals: true,
  },
  plugins: [ViteTsconfigPaths()],
})
