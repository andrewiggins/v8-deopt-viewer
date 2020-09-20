import { fileURLToPath, pathToFileURL } from "url";
import * as path from "path";
import { readFile, writeFile } from "fs/promises";
import escapeRegex from "escape-string-regexp";
import { parseV8Log } from "../src/index.js";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const pkgRoot = (...args) => path.join(__dirname, "..", ...args);
export const repoRoot = (...args) => pkgRoot("..", "..", ...args);
export const repoFileURL = (...args) =>
	pathToFileURL(repoRoot(...args)).toString();

// Mapping of test paths in test logs to real paths
const logPathReplacements = {
	["adders.v8.log"]: [
		[
			"/tmp/v8-deopt-viewer/examples/simple/adders.js",
			repoRoot("examples/simple/adders.js"),
		],
	],
	["two-modules.v8.log"]: [
		[
			"/tmp/v8-deopt-viewer/examples/two-modules/adders.js",
			repoRoot("examples/two-modules/adders.js"),
		],
		[
			"/tmp/v8-deopt-viewer/examples/two-modules/objects.js",
			repoRoot("examples/two-modules/objects.js"),
		],
	],
	["html-inline.v8.log"]: [
		[
			"file:///tmp/v8-deopt-viewer/examples/html-inline/adders.html",
			pathToFileURL(repoRoot("examples/html-inline/adders.html")).toString(),
		],
	],
	["html-inline.traceMaps.v8.log"]: [
		[
			"file:///tmp/v8-deopt-viewer/examples/html-inline/adders.html",
			pathToFileURL(repoRoot("examples/html-inline/adders.html")).toString(),
		],
	],
	["html-external.v8.log"]: [
		[
			"file:///tmp/v8-deopt-viewer/examples/html-external/adders.js",
			pathToFileURL(repoRoot("examples/html-external/adders.js")).toString(),
		],
		[
			"file:///tmp/v8-deopt-viewer/examples/html-external/objects.js",
			pathToFileURL(repoRoot("examples/html-external/objects.js")).toString(),
		],
	],
	["html-external.traceMaps.v8.log"]: [
		[
			"file:///tmp/v8-deopt-viewer/examples/html-external/adders.js",
			pathToFileURL(repoRoot("examples/html-external/adders.js")).toString(),
		],
		[
			"file:///tmp/v8-deopt-viewer/examples/html-external/objects.js",
			pathToFileURL(repoRoot("examples/html-external/objects.js")).toString(),
		],
	],
};

/**
 * Replace the fake paths in the example test log files with paths to real files
 * to test handling paths on the OS the tests are running on. Our cloud tests
 * run these tests on Linux and Window
 * @param {string} logFilename
 * @param {string} logPath
 * @returns {Promise<string>}
 */
export async function readLogFile(logFilename, logPath) {
	const replacements = logPathReplacements[logFilename];

	let contents = await readFile(logPath, "utf8");

	// Windows + Git shenanigans - make sure log files end in only '\n'
	// as required by v8 tooling
	contents = contents.replace(/\r\n/g, "\n");

	if (replacements) {
		for (const [template, realPath] of replacements) {
			contents = contents.replace(
				new RegExp(escapeRegex(template), "g"),
				// Windows paths need to be double escaped in the logs
				realPath.replace(/\\/g, "\\\\")
			);
		}
	}

	return contents;
}

/**
 * @param {import('tape').Test} t
 * @param {string} logFileName
 * @param {import('../').Options} [options]
 */
export async function runParser(t, logFileName, options) {
	const logPath = pkgRoot("test", "logs", logFileName);

	const logContents = await readLogFile(logFileName, logPath);

	const origConsoleError = console.error;
	const errorArgs = [];
	console.error = function (...args) {
		origConsoleError.apply(console, args);
		errorArgs.push(args);
	};

	let result;
	try {
		result = await parseV8Log(logContents, options);
	} finally {
		console.error = origConsoleError;
	}

	t.equal(errorArgs.length, 0, "No console.error calls");

	return result;
}

export async function writeSnapshot(logFileName, result) {
	// Undo replacements when writing snapshots so they are consistent
	const replacements = logPathReplacements[logFileName];
	let contents = JSON.stringify(result, null, 2);
	for (const [snapshotPath, template] of replacements) {
		contents = contents.replace(
			new RegExp(escapeRegex(template.replace(/\\/g, "\\\\")), "g"),
			snapshotPath
		);
	}

	const outFileName = logFileName.replace(".v8.log", ".json");
	const outPath = path.join(__dirname, "snapshots", outFileName);
	await writeFile(outPath, contents, "utf8");
}

/**
 * @param {import('tape').Test} t
 * @param {string} message
 * @param {Array<import('../').Entry>} entries
 * @param {import('../').Entry} expectedEntry
 */
export function validateEntry(t, message, entries, expectedEntry) {
	const { functionName, file, line, column } = expectedEntry;
	const matches = entries.filter((entry) => {
		return (
			entry.functionName === functionName &&
			entry.file === file &&
			entry.line === line &&
			entry.column === column
		);
	});

	if (matches.length !== 1) {
		throw new Error(
			`Expected to only find one match for "${functionName} ${file}:${line}:${column}". Found ${matches.length}.`
		);
	}

	t.deepEqual(matches[0], expectedEntry, message);
}
