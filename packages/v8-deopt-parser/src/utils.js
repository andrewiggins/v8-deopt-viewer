export const MIN_SEVERITY = 1;

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
	return { file: sourcePosition, line: 0, column: 0 };
}
