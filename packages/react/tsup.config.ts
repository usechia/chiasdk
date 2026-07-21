import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	treeshake: true,
	target: "es2021",
	external: ["react", "react-dom", "@tanstack/react-query"],
	onSuccess: async () => {
		copyFileSync("src/styles.css", "dist/styles.css");
	},
});
