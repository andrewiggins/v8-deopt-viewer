import { fileURLToPath, pathToFileURL } from "url";
import * as path from "path";
import { createReadStream, createWriteStream } from "fs";
import { readFile, writeFile, access } from "fs/promises";
import zlib from "zlib";
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
	["adders.traceMaps.v8.log"]: [
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
	let error;
	try {
		await access(logPath);
	} catch (e) {
		error = e;
	}

	if (error) {
		let brotliPath = logPath + ".br";
		try {
			error = null;
			await access(brotliPath);
		} catch (e) {
			error = e;
		}

		if (error) {
			throw new Error(`Could not access log file: ${logPath}[.br]: ` + error);
		}

		await decompress(brotliPath);
	}

	let contents = await readFile(logPath, "utf8");

	// Windows + Git shenanigans - make sure log files end in only '\n'
	// as required by v8 tooling
	contents = contents.replace(/\r\n/g, "\n");

	const replacements = logPathReplacements[logFilename];
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
	// New IC format has 10 values instead of 9
	const hasNewIcFormat = /\w+IC(,.*){10}/gm.test(logContents);

	const origConsoleError = console.error;
	const errorArgs = [];
	console.error = function (...args) {
		origConsoleError.apply(console, args);
		errorArgs.push(args);
	};

	let result;
	try {
		result = await parseV8Log(logContents, { ...options, hasNewIcFormat });
	} finally {
		console.error = origConsoleError;
	}

	t.equal(errorArgs.length, 0, "No console.error calls");

	return result;
}

/** Redact some properties from the result to keep snapshots clean */
function redactResult(key, value) {
	switch (key) {
		case "id":
		case "edge":
		case "children":
			return value ? "<redacted>" : undefined;
		default:
			return value;
	}
}

export async function writeSnapshot(logFileName, result) {
	// Undo replacements when writing snapshots so they are consistent
	const replacements = logPathReplacements[logFileName];
	let contents = JSON.stringify(result, redactResult, 2);

	if (replacements) {
		for (const [snapshotPath, template] of replacements) {
			contents = contents.replace(
				new RegExp(escapeRegex(template.replace(/\\/g, "\\\\")), "g"),
				snapshotPath
			);
		}
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

export function decompress(inputPath) {
	return new Promise((resolve, reject) => {
		const stream = createReadStream(inputPath)
			.pipe(zlib.createBrotliDecompress())
			.pipe(createWriteStream(inputPath.replace(/.br$/, "")));

		stream
			.on("end", resolve)
			.on("close", resolve)
			.on("finish", resolve)
			.on("error", reject);
	});
}
