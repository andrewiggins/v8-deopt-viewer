import { spawnSync } from "child_process";
import * as path from "path";
import { readFile, writeFile, copyFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { readLogFile } from "../../v8-deopt-parser/test/helpers.js";

// const logFileName = "adders.v8.log";

const logFileName = "html-external.v8.log";
const logWithMapsFileName = "html-external.traceMaps.v8.log";

// const logFileName = "html-inline.v8.log";
// const logWithMapsFileName = "html-inline.traceMaps.v8.log";

// @ts-ignore
const __dirname = path.join(fileURLToPath(import.meta.url));
const pkgRoot = (...args) => path.join(__dirname, "..", "..", ...args);
const repoRoot = (...args) => pkgRoot("..", "..", ...args);
const outDir = (...args) => pkgRoot("test/logs", ...args);

export async function generateTestData() {
	await mkdir(outDir(), { recursive: true });

	const logPath = (filename) =>
		repoRoot(`packages/v8-deopt-parser/test/logs/${filename}`);

	// Generate log using raw log which has invalid paths (/tmp/v8-deopt-viewer)
	// to simulate error output
	console.log("Generating output without sources...");
	spawnSync(
		process.execPath,
		[
			repoRoot("packages/v8-deopt-viewer/bin/v8-deopt-viewer.js"),
			"-i",
			logPath(logFileName),
			"-o",
			outDir(),
		],
		{ stdio: "inherit" }
	);

	const errorContents = await readFile(outDir("v8-data.js"), "utf8");
	const newErrorContents = errorContents.replace(
		/^window\.V8Data =/,
		"window.V8ErrorData ="
	);
	await writeFile(pkgRoot("test/deoptInfoError.js"), newErrorContents, "utf8");

	// Now generate log using modified log with correct src paths
	console.log("Generating output with sources...");
	const newNoMapContents = await readLogFile(logFileName, logPath(logFileName));

	const updatedNoMapLogPath = outDir(logFileName);
	await writeFile(updatedNoMapLogPath, newNoMapContents, "utf8");

	spawnSync(
		process.execPath,
		[
			repoRoot("packages/v8-deopt-viewer/bin/v8-deopt-viewer.js"),
			"-i",
			updatedNoMapLogPath,
			"-o",
			outDir(),
		],
		{ stdio: "inherit" }
	);

	const noMapsContents = await readFile(outDir("v8-data.js"), "utf8");
	const newNoMapsContents = noMapsContents.replace(
		/^window\.V8Data =/,
		"window.V8NoMapData ="
	);
	await writeFile(
		pkgRoot("test/deoptInfoNoMaps.js"),
		newNoMapsContents,
		"utf8"
	);

	// Generate logs with maps
	console.log("Generating output with maps & sources...");
	const newContents = await readLogFile(
		logWithMapsFileName,
		logPath(logWithMapsFileName)
	);

	const updatedLogPath = outDir(logWithMapsFileName);
	await writeFile(updatedLogPath, newContents, "utf8");

	spawnSync(
		process.execPath,
		[
			repoRoot("packages/v8-deopt-viewer/bin/v8-deopt-viewer.js"),
			"-i",
			updatedLogPath,
			"-o",
			outDir(),
		],
		{ stdio: "inherit" }
	);

	await copyFile(outDir("v8-data.js"), pkgRoot("test/deoptInfo.js"));
}
