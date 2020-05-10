import { tmpdir } from "os";
import { mkdir } from "fs/promises";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";

const execFileAsync = promisify(execFile);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const makeAbsolute = (filePath) =>
	path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

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

/**
 * @param {string} srcUrl
 * @param {import('../').Options} options
 */
async function runPuppeteer(srcUrl, options) {
	const puppeteer = await getPuppeteer();
	const logFilePath = options.logFilePath;
	const v8Flags = [
		"--trace-ic",
		// Chrome won't pipe v8 logs to a non-TTY pipe it seems :(
		`--logfile=${logFilePath}`,
		"--no-logfile-per-isolate",
	];
	const args = [
		"--disable-extensions",
		`--js-flags=${v8Flags.join(" ")}`,
		`--no-sandbox`,
		srcUrl,
	];

	let browser;
	try {
		browser = await puppeteer.launch({
			ignoreDefaultArgs: ["about:blank"],
			args,
		});

		await browser.pages();

		// Wait 5s to allow page to load
		await delay(options.browserTimeoutMs);
	} finally {
		if (browser) {
			await browser.close();
			// Give the browser 1s to release v8.log
			await delay(100);
		}
	}

	return logFilePath;
}

async function generateForRemoteURL(srcUrl, options) {
	return runPuppeteer(srcUrl, options);
}

async function generateForLocalHTML(srcPath, options) {
	const srcUrl = pathToFileURL(makeAbsolute(srcPath)).toString();
	return runPuppeteer(srcUrl, options);
}

/**
 * @param {string} srcPath
 * @param {import('.').Options} options
 */
async function generateForNodeJS(srcPath, options) {
	const logFilePath = options.logFilePath;
	const args = [
		"--trace-ic",
		`--logfile=${logFilePath}`, // Could pipe log to stdout ("-" value) but doesn't work very well with Chromium
		"--no-logfile-per-isolate",
		srcPath,
	];

	await execFileAsync(process.execPath, args, {});

	return logFilePath;
}

/** @type {import('.').Options} */
const defaultOptions = {
	logFilePath: `${tmpdir()}/v8-deopt-generate-log/v8.log`,
	browserTimeoutMs: 5000,
};

/**
 * @param {string} srcPath
 * @param {import('.').Options} options
 * @returns {Promise<string>}
 */
export async function generateV8Log(srcPath, options = {}) {
	options = Object.assign({}, defaultOptions, options);
	options.logFilePath = makeAbsolute(options.logFilePath);

	await mkdir(path.dirname(options.logFilePath), { recursive: true });

	if (srcPath.startsWith("http://")) {
		throw new Error(
			"Please use an https URL. This script runs websites without a sandbox and untrusted URLs could compromise your machine."
		);
	} else if (srcPath.startsWith("https://")) {
		return generateForRemoteURL(srcPath, options);
	} else if (srcPath.endsWith(".html")) {
		return generateForLocalHTML(srcPath, options);
	} else {
		return generateForNodeJS(srcPath, options);
	}
}
