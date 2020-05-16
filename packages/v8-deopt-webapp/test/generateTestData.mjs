import { spawnSync } from "child_process";
import * as path from "path";
import { readFile, writeFile, copyFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { readLogFile } from "../../v8-deopt-parser/test/helpers.js";

// @ts-ignore
const __dirname = path.join(fileURLToPath(import.meta.url));
const pkgRoot = (...args) => path.join(__dirname, "..", "..", ...args);
const repoRoot = (...args) => pkgRoot("..", "..", ...args);
const outDir = (...args) => pkgRoot("test/logs", ...args);

async function main() {
	await mkdir(outDir(), { recursive: true });

	const addersFileName = "adders.v8.log";
	const addersLogPath = repoRoot(
		`packages/v8-deopt-parser/test/logs/${addersFileName}`
	);

	// Generate log using raw adders.v8.log which has invalid paths (/tmp/deoptigate)
	// to simulate error output
	spawnSync(process.execPath, [
		repoRoot("packages/v8-deopt-viewer/bin/v8-deopt-viewer.js"),
		"-i",
		addersLogPath,
		"-o",
		outDir(),
	]);

	const errorContents = await readFile(outDir("v8-data.js"), "utf8");
	const newErrorContents = errorContents.replace(
		/^window\.V8Data =/,
		"window.V8ErrorData ="
	);
	await writeFile(pkgRoot("test/deoptInfoError.js"), newErrorContents, "utf8");

	// Now generate log using modified adders.v8.log with correct src paths
	const newContents = await readLogFile(addersFileName, addersLogPath);

	const updatedLogPath = outDir("adders.v8.log");
	await writeFile(updatedLogPath, newContents, "utf8");

	spawnSync(process.execPath, [
		repoRoot("packages/v8-deopt-viewer/bin/v8-deopt-viewer.js"),
		"-i",
		updatedLogPath,
		"-o",
		outDir(),
	]);

	await copyFile(outDir("v8-data.js"), pkgRoot("test/deoptInfo.js"));
}

main();
