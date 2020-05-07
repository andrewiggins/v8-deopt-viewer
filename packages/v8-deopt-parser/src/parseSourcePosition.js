// allow DOS disk paths (i.e. 'C:\path\to\file')
const lineColumnRx = /:(\d+):(\d+)$/;

function safeToInt(x) {
	if (x == null) return 0;
	return parseInt(x);
}

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
