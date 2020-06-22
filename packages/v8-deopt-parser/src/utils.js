export const MIN_SEVERITY = 1;
export const UNKNOWN_SEVERITY = -1;

export function unquote(s) {
	// for some reason Node.js double quotes some the strings in the log, i.e. ""eager""
	return s.replace(/^"/, "").replace(/"$/, "");
}

// allow DOS disk paths (i.e. 'C:\path\to\file')
const lineColumnRx = /:(\d+):(\d+)$/;

function safeToInt(x) {
	if (x == null) return 0;
	return parseInt(x);
}

/**
 * @param {string} sourcePosition
 */
export function parseSourcePosition(sourcePosition) {
	const match = lineColumnRx.exec(sourcePosition);
	if (match) {
		return {
			file: sourcePosition.slice(0, match.index),
			line: safeToInt(match[1]),
			column: safeToInt(match[2]),
		};
	}

	throw new Error("Could not parse source position: " + sourcePosition);
}

// Inspired by Node.JS isAbsolute algorithm. Copied here to be compatible with URLs
// https://github.com/nodejs/node/blob/bcdbd57134558e3bea730f8963881e8865040f6f/lib/path.js#L352

const CHAR_UPPERCASE_A = 65; /* A */
const CHAR_LOWERCASE_A = 97; /* a */
const CHAR_UPPERCASE_Z = 90; /* Z */
const CHAR_LOWERCASE_Z = 122; /* z */
const CHAR_FORWARD_SLASH = 47; /* / */
const CHAR_BACKWARD_SLASH = 92; /* \ */
const CHAR_COLON = 58; /* : */

function isPathSeparator(code) {
	return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
}

function isWindowsDeviceRoot(code) {
	return (
		(code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) ||
		(code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z)
	);
}

/**
 * @param {string} path
 */
export function isAbsolutePath(path) {
	const length = path && path.length;
	if (path == null || length == 0) {
		return false;
	}

	const firstChar = path.charCodeAt(0);
	if (isPathSeparator(firstChar)) {
		return true;
	} else if (
		length > 2 &&
		isWindowsDeviceRoot(firstChar) &&
		path.charCodeAt(1) === CHAR_COLON &&
		isPathSeparator(path.charCodeAt(2))
	) {
		return true;
	} else if (
		path.startsWith("file:///") ||
		path.startsWith("http://") ||
		path.startsWith("https://")
	) {
		return true;
	} else {
		return false;
	}
}
