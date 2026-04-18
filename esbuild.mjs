import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const extensionConfig = {
  entryPoints: ["src/extension/extension.ts"],
  bundle: true,
  outfile: "out/extension/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
};

const panelConfig = {
  entryPoints: ["src/panel/main.ts"],
  bundle: true,
  outfile: "out/panel/main.js",
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: true,
};

if (watch) {
  const extCtx = await esbuild.context(extensionConfig);
  const panelCtx = await esbuild.context(panelConfig);
  await Promise.all([extCtx.watch(), panelCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await esbuild.build(extensionConfig);
  await esbuild.build(panelConfig);
  console.log("Build complete.");
}
