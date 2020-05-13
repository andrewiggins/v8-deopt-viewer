/**
 * @param {string[]} files
 */
export function determineCommonRoot(files) {
	if (files.length === 0) {
		return null;
	}

	let containsURLs, containsWin32Paths, containsUnixPaths;
	const parsed = files.map((f) => {
		// Remove trailing slashes
		// f = f.replace(/\/$/, "").replace(/\\$/, "");

		if (f.startsWith("http:") || f.startsWith("https:")) {
			containsURLs = true;
			return new URL(f);
		} else if (f.startsWith("file://")) {
			containsURLs = true;
			return new URL(f);
		} else if (f.includes("\\")) {
			containsWin32Paths = true;
			return f.replace(/\\/g, "/");
		} else {
			containsUnixPaths = true;
			return f;
		}
	});

	if (
		(containsUnixPaths && containsWin32Paths) ||
		(containsURLs && (containsUnixPaths || containsWin32Paths))
	) {
		return null;
	}

	if (containsURLs) {
		// @ts-ignore
		return determineCommonURL(parsed);
	} else if (containsWin32Paths) {
		// @ts-ignore
		const root = determineCommonPath(parsed);
		return root && root.replace(/\//g, "\\");
	} else {
		// @ts-ignore
		return determineCommonPath(parsed);
	}
}

/**
 * @param {URL[]} urls
 */
function determineCommonURL(urls) {
	if (urls.length == 1 && urls[0].pathname == "/") {
		return urls[0].protocol + "//";
	}

	const host = urls[0].host;
	const paths = [];
	for (let url of urls) {
		if (url.host !== host) {
			return null;
		}

		paths.push(url.pathname);
	}

	const commonPath = determineCommonPath(paths);
	return new URL(commonPath, urls[0]).toString();
}

/**
 * @param {string[]} paths
 */
function determineCommonPath(paths) {
	let commonPathParts = paths[0].split("/");
	if (paths.length == 1) {
		return commonPathParts.slice(0, -1).join("/") + "/";
	}

	for (const path of paths) {
		const parts = path.split("/");
		for (let i = 1; i < parts.length; i++) {
			if (i == parts.length - 1 && parts[i] == commonPathParts[i]) {
				// This path is a strict subset of the root path, so make the root path
				// one part less than it currently is so root doesn't include the basename
				// of this path
				commonPathParts = commonPathParts.slice(0, i);
			} else if (parts[i] != commonPathParts[i]) {
				commonPathParts = commonPathParts.slice(0, i);
				break;
			}
		}
	}

	return commonPathParts.length > 0 ? commonPathParts.join("/") + "/" : null;
}
