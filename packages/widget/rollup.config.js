import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/chia-widget.js",
        format: "iife",
        name: "Chia",
        sourcemap: true,
      },
      {
        file: "dist/chia-widget.min.js",
        format: "iife",
        name: "Chia",
        sourcemap: true,
        plugins: [terser()],
      },
      {
        file: "dist/index.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist",
      }),
    ],
  },
];
