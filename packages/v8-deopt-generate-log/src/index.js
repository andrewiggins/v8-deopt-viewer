import { tmpdir } from "os";
import { mkdir } from "fs/promises";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";

const execFileAsync = promisify(execFile);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const makeAbsolute = filePath =>
	path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

/**
 * @typedef {(options: import('puppeteer-core').LaunchOptions) => Promise<import('puppeteer-core').Browser>} Launcher
 * @type {Launcher}
 */
let launcher = null;

/**
 * @returns {Promise<Launcher>}
 */
async function getLauncher() {
	if (!launcher) {
		// 1. Try puppeteer
		try {
			const puppeteer = (await import("puppeteer")).default;
			launcher = (options) => puppeteer.launch(options);
		} catch (error) {
			if (error.code !== "ERR_MODULE_NOT_FOUND") {
				// console.error(error);
			}
		}

		// 2. Try chrome-launcher
		if (!launcher) {
			const [chromeLauncher, puppeteer] = await Promise.all([
				import("chrome-launcher").then(m => m.default),
				import("puppeteer-core").then(m => m.default)
			]);

			const chromePath = chromeLauncher.Launcher.getFirstInstallation();
			if (!chromePath) {
				console.error(
					'Could not find the "puppeteer" package or a local chrome installation. Try installing Chrome or Chromium locally to run v8-deopt-viewer'
				);
				process.exit(1);
			}

			// console.log("Using Chrome installed at:", chromePath);
			launcher = options =>
				puppeteer.launch({
					...options,
					executablePath: chromePath
				});
		}
	}

	return launcher;
}

/**
 * @param {import('puppeteer-core').LaunchOptions} options
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
async function launchBrowser(options) {
	return (await getLauncher())(options);
}

/**
 * @param {string} logFilePath
 * @param {boolean} [traceMaps]
 * @returns {string[]}
 */
function getV8Flags(logFilePath, traceMaps = false) {
	const flags = [
		"--trace-ic",
		// Could pipe log to stdout ("-" value) but doesn't work very well with
		// Chromium. Chromium won't pipe v8 logs to a non-TTY pipe it seems :(
		`--logfile=${logFilePath}`,
		"--no-logfile-per-isolate"
	];

	if (traceMaps) {
		// --trace-maps-details doesn't seem to change output so leaving it out
		flags.push("--trace-maps");
	}

	return flags;
}

/**
 * @param {string} srcUrl
 * @param {import('../').Options} options
 */
async function runPuppeteer(srcUrl, options) {
	const logFilePath = options.logFilePath;
	const v8Flags = getV8Flags(logFilePath, options.traceMaps);
	const args = [
		"--disable-extensions",
		`--js-flags=${v8Flags.join(" ")}`,
		`--no-sandbox`,
		srcUrl
	];

	let browser;
	try {
		browser = await launchBrowser({
			ignoreDefaultArgs: ["about:blank"],
			args
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
	const args = [...getV8Flags(logFilePath, options.traceMaps), srcPath];

	await execFileAsync(process.execPath, args, {});

	return logFilePath;
}

/** @type {import('.').Options} */
const defaultOptions = {
	logFilePath: `${tmpdir()}/v8-deopt-generate-log/v8.log`,
	browserTimeoutMs: 5000
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

	if (srcPath.startsWith("https://") || srcPath.startsWith("http://")) {
		return generateForRemoteURL(srcPath, options);
	} else if (srcPath.endsWith(".html")) {
		return generateForLocalHTML(srcPath, options);
	} else {
		return generateForNodeJS(srcPath, options);
	}
}
