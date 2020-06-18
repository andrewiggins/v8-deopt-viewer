import { spawnSync } from "child_process";
import * as path from "path";
import { readFile, writeFile, copyFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { readLogFile } from "../../v8-deopt-parser/test/helpers.js";

// const logFileName = "adders.v8.log";
// const logFileName = "html-inline.v8.log";
// const logFileName = "html-external.v8.log";
const logFileName = "html-inline.traceMaps.v8.log";

// @ts-ignore
const __dirname = path.join(fileURLToPath(import.meta.url));
const pkgRoot = (...args) => path.join(__dirname, "..", "..", ...args);
const repoRoot = (...args) => pkgRoot("..", "..", ...args);
const outDir = (...args) => pkgRoot("test/logs", ...args);

async function main() {
	await mkdir(outDir(), { recursive: true });

	const logPath = repoRoot(`packages/v8-deopt-parser/test/logs/${logFileName}`);

	// Generate log using raw log which has invalid paths (/tmp/v8-deopt-viewer)
	// to simulate error output
	spawnSync(
		process.execPath,
		[
			repoRoot("packages/v8-deopt-viewer/bin/v8-deopt-viewer.js"),
			"-i",
			logPath,
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
	const newContents = await readLogFile(logFileName, logPath);

	const updatedLogPath = outDir("adders.v8.log");
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

main();
