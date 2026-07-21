import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: { jsx: "automatic" },
	test: {
		globals: true,
		environment: "jsdom",
		include: ["test/**/*.test.tsx", "test/**/*.test.ts"],
	},
});
