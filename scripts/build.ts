import esbuild from "npm:esbuild";
import aLog from "aLog"

const log = new aLog("BUILD");

try {
	log.info("Building mod.js...");
  await esbuild.build({
    entryPoints: ["./mod.ts"],
    bundle: true,
    minify: true,
    outfile: "./mod.js",
  });
	log.success("Build complete!");
} catch (e) {
  log.error(e);
}
