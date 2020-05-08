import { tmpdir } from "os";
import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const {
	promises: { mkdir },
} = fs;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const makeAbsolute = (filePath) =>
	path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

/**
 * @param {import('.').Options} options
 */
async function getLogFilePath(options) {
	const logFilePath = options.logFilePath
		? makeAbsolute(options.logFilePath)
		: `${tmpdir()}/v8-deopt-generate-log/v8.log`;

	const logDir = path.dirname(logFilePath);
	await mkdir(logDir, { recursive: true });

	return logFilePath;
}

async function getPuppeteer() {
	return import("puppeteer")
		.then((module) => module.default)
		.catch((error) => {
			if (
				error.message.includes("Cannot find module") ||
				error.message.includes("Cannot find package")
			) {
				console.error(
					'Could not find "puppeteer" package. Please install "puppeteer" as a peer dependency to this package to generate logs for HTML files and URLs'
				);
				process.exit(1);
			} else {
				throw error;
			}
		});
}

async function generateForRemoteURL(srcPath, options) {
	return getLogFilePath(options);
}

async function generateForLocalHTML(srcPath, options) {
	const logFilePath = await getLogFilePath(options);
	const htmlFile = makeAbsolute(srcPath);

	const v8Flags = [
		"--trace-ic",
		`--logfile=${logFilePath}`,
		"--no-logfile-per-isolate",
	];

	const puppeteer = await getPuppeteer();

	let browser;
	try {
		browser = await puppeteer.launch({
			ignoreDefaultArgs: ["about:blank"],
			args: [
				"--disable-extensions",
				"--no-sandbox",
				`--js-flags=${v8Flags.join(" ")}`,
				htmlFile,
			],
		});

		await browser.pages();

		// Wait 5s to allow page to load
		await delay(5000);
	} finally {
		if (browser) {
			await browser.close();
			// Give the browser 1s to release v8.log
			await delay(1000);
		}
	}

	return logFilePath;
}

async function generateForNodeJS(srcPath, options) {
	const logFilePath = await getLogFilePath(options);
	const args = [
		"--trace-ic",
		`--logfile=${logFilePath}`,
		"--no-logfile-per-isolate",
		srcPath,
	];

	await execFileAsync(process.execPath, args, {});

	return logFilePath;
}

/**
 * @param {string} srcPath
 * @param {import('.').Options} options
 * @returns {Promise<string>}
 */
export async function generateV8Log(srcPath, options = {}) {
	if (srcPath.startsWith("http://") || srcPath.startsWith("https://")) {
		return generateForRemoteURL(srcPath, options);
	} else if (srcPath.endsWith(".html")) {
		return generateForLocalHTML(srcPath, options);
	} else {
		return generateForNodeJS(srcPath, options);
	}
}
