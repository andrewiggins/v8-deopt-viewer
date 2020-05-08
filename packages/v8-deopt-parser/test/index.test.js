import { fileURLToPath } from "url";
import * as path from "path";
import * as fs from "fs";
import { parseV8Log } from "../src/index.js";
import test from "tape";

const {
	readdirSync,
	promises: { readFile, writeFile },
} = fs;

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runParser(t, logContents) {
	const origConsoleError = console.error;
	const errorArgs = [];
	console.error = function (...args) {
		origConsoleError.apply(console, args);
		errorArgs.push(args);
	};

	let result;
	try {
		result = await parseV8Log(logContents);
	} finally {
		console.error = origConsoleError;
	}

	t.equal(errorArgs.length, 0, "No console.error calls");

	return result;
}

readdirSync(path.join(__dirname, "logs")).map((logFileName) => {
	test(logFileName, async (t) => {
		const logPath = path.join(__dirname, "logs", logFileName);
		const logContents = await readFile(logPath, "utf8");

		const result = await runParser(t, logContents);

		const outFileName = logFileName.replace(".v8.log", ".json");
		const outPath = path.join(__dirname, "snapshots", outFileName);
		await writeFile(outPath, JSON.stringify(result, null, 2), "utf8");
	});
});
