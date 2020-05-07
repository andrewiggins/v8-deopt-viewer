import { unquote, MIN_SEVERITY, parseSourcePosition } from "./utils.js";

const sourcePositionRx = /^<(.+?)>(?: inlined at <(.+?)>)?$/;

function parseDeoptSourceLocation(sourcePositionText) {
	const match = sourcePositionRx.exec(sourcePositionText);
	if (match) {
		const source = parseSourcePosition(match[1]);
		if (match[2]) {
			source.inlinedAt = parseSourcePosition(match[2]);
		}
		return source;
	}
	return parseSourcePosition(sourcePositionText);
}

export function getOptimizationSeverity(bailoutType) {
	switch (bailoutType) {
		case "soft":
			return MIN_SEVERITY;
		case "lazy":
			return MIN_SEVERITY + 1;
		case "eager":
			return MIN_SEVERITY + 2;
	}
}

export const deoptFieldParsers = [
	parseInt, // timestamp
	parseInt, // size
	parseInt, // code
	parseInt, // inliningId
	parseInt, // scriptOffset
	unquote, // bailoutType
	parseDeoptSourceLocation, // deopt source location
	unquote, // deoptReasonText
];
