import * as path from "path";
import { open as openFile, readFile, writeFile, copyFile, mkdir } from "fs/promises";
import { createReadStream } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import open from "open";
import { get } from "httpie/dist/httpie.mjs";
import { generateV8Log } from "v8-deopt-generate-log";
import { parseV8LogStream, groupByFile } from "v8-deopt-parser";
import { determineCommonRoot } from "./determineCommonRoot.js";

// TODO: Replace with import.meta.resolve when stable
import { createRequire } from "module";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "template.html");

/**
 * @param {import('v8-deopt-parser').PerFileV8DeoptInfo["files"]} deoptInfo
 * @returns {Promise<Record<string, import('v8-deopt-webapp/src/index').V8DeoptInfoWithSources>>}
 */
async function addSources(deoptInfo) {
	const files = Object.keys(deoptInfo);
	const root = determineCommonRoot(files);

	/** @type {Record<string, import('v8-deopt-webapp/src/index').V8DeoptInfoWithSources>} */
	const result = Object.create(null);
	for (let file of files) {
		let srcPath;

		let src, srcError;
		if (file.startsWith("https://") || file.startsWith("http://")) {
			try {
				srcPath = file;
				const { data } = await get(file);
				src = data;
			} catch (e) {
				srcError = e;
			}
		} else {
			let filePath = file;
			if (file.startsWith("file://")) {
				// Convert Linux-like file URLs for Windows and assume C: root. Useful for testing
				if (
					process.platform == "win32" &&
					!file.match(/^file:\/\/\/[a-zA-z]:/)
				) {
					filePath = fileURLToPath(file.replace(/^file:\/\/\//, "file:///C:/"));
				} else {
					filePath = fileURLToPath(file);
				}
			}

			if (path.isAbsolute(filePath)) {
				try {
					srcPath = filePath;
					src = await readFile(filePath, "utf8");
				} catch (e) {
					srcError = e;
				}
			} else {
				srcError = new Error("File path is not absolute");
			}
		}

		const relativePath = root ? file.slice(root.length) : file;
		if (srcError) {
			result[file] = {
				...deoptInfo[file],
				relativePath,
				srcPath,
				srcError: srcError.toString(),
			};
		} else {
			result[file] = {
				...deoptInfo[file],
				relativePath,
				srcPath,
				src,
			};
		}
	}

	return result;
}

/**
 * @param {string} srcFile
 * @param {import('.').Options} options
 */
export default async function run(srcFile, options) {
	let logFilePath;
	if (srcFile) {
		console.log("Running and generating log...");
		logFilePath = await generateV8Log(srcFile, {
			logFilePath: path.join(options.out, "v8.log"),
			browserTimeoutMs: options.timeout,
			traceMaps: !options["skip-maps"],
		});
	} else if (options.input) {
		logFilePath = path.isAbsolute(options.input)
			? options.input
			: path.join(process.cwd(), options.input);
	} else {
		throw new Error(
			'Either a file/url to generate a log or the "--input" flag pointing to a v8.log must be provided'
		);
	}

	// Ensure output directory exists
	await mkdir(options.out, { recursive: true });

	console.log("Parsing log...");

	// using 16mb highWaterMark instead of default 64kb, it's not saving what much, like 1 second or less,
	// but why not
	// Also not setting big values because of default max-old-space=512mb
	const logContentsStream = await createReadStream(
		logFilePath,
		{ encoding: 'utf8', highWaterMark: 16 * 1024 * 1024},
	);
	const rawDeoptInfo = await parseV8LogStream(logContentsStream, {
		keepInternals: options["keep-internals"],
	});

	console.log("Adding sources...");

	// Group DeoptInfo by files and extend the files data with sources
	const groupDeoptInfo = groupByFile(rawDeoptInfo);
	const deoptInfo = {
		...groupDeoptInfo,
		files: await addSources(groupDeoptInfo.files),
	};

	const deoptInfoString = JSON.stringify(deoptInfo, null, 2);
	const jsContents = `window.V8Data = ${deoptInfoString};`;
	await writeFile(path.join(options.out, "v8-data.js"), jsContents, "utf8");

	console.log("Generating webapp...");
	const template = await readFile(templatePath, "utf8");
	const indexPath = path.join(options.out, "index.html");
	await writeFile(indexPath, template, "utf8");

	// @ts-ignore
	const require = createRequire(import.meta.url);
	const webAppIndexPath = require.resolve("v8-deopt-webapp");
	const webAppStylesPath = webAppIndexPath.replace(
		path.basename(webAppIndexPath),
		"style.css"
	);
	await copyFile(
		webAppIndexPath,
		path.join(options.out, "v8-deopt-webapp.umd.js")
	);
	await copyFile(
		webAppStylesPath,
		path.join(options.out, "v8-deopt-webapp.css")
	);

	if (options.open) {
		await open(pathToFileURL(indexPath).toString(), { url: true });
		console.log(
			`Done! Opening ${path.join(options.out, "index.html")} in your browser...`
		);
	} else {
		console.log(
			`Done! Open ${path.join(options.out, "index.html")} in your browser.`
		);
	}
}
