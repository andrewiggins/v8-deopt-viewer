import { parseSourcePosition } from "./parseSourcePosition.js";
import { parseString } from "./v8-tools-core/logreader.js";
import { Profile } from "./v8-tools-core/profile.js";

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

function parseOptimizationState(rawState) {
	switch (rawState) {
		case "":
			return Profile.CodeState.COMPILED;
		case "~":
			return Profile.CodeState.OPTIMIZABLE;
		case "*":
			return Profile.CodeState.OPTIMIZED;
		default:
			throw new Error("unknown code state: " + rawState);
	}
}

export const UNINITIALIZED = 0;
export const PREMONOMORPHIC = 1;
export const MONOMORPHIC = 2;
export const RECOMPUTE_HANDLER = 3;
export const POLYMORPHIC = 4;
export const MEGAMORPHIC = 5;
export const GENERIC = 6;

/**
 * @param {string} rawState Raw Inline Cache state from V8
 * @returns {import('./index').ICState}
 */
function parseIcState(rawState) {
	// ICState mapping in V8: https://github.com/v8/v8/blob/4b9b23521e6fd42373ebbcb20ebe03bf445494f9/src/ic/ic.cc#L42
	switch (rawState) {
		case "0":
			// return "unintialized";
			return UNINITIALIZED;
		case ".":
			// return "premonomorphic";
			return PREMONOMORPHIC;
		case "1":
			// return "monomorphic";
			return MONOMORPHIC;
		case "^":
			// return "recompute_handler";
			return RECOMPUTE_HANDLER;
		case "P":
			// return "polymorphic";
			return POLYMORPHIC;
		case "N":
			// return "megamorphic";
			return MEGAMORPHIC;
		case "G":
			// return "generic";
			return GENERIC;
		default:
			throw new Error("parse: unknown ic code state: " + rawState);
	}
}

/**
 * @param {[string, string]} varArgs
 * @returns {{ funcAddr: number; state: number; }}
 */
export function parseCodeCreateVarArgs(varArgs) {
	const funcAddr = parseInt(varArgs[0]);
	const state = parseOptimizationState(varArgs[1]);
	return { funcAddr, state };
}

export const deoptFieldParsers = [
	parseInt, // timestamp
	parseInt, // size
	parseInt, // code
	parseInt, // inliningId
	parseInt, // scriptOffset
	parseString, // bailoutType
	parseDeoptSourceLocation, // deopt source location
	parseString, // deoptReasonText
];

export const propertyICFieldParsers = [
	parseInt, // profile code
	parseInt, // line
	parseInt, // column
	parseIcState, // old_state
	parseIcState, // new_state
	parseInt, // map
	parseString, // propertyKey
	parseString, // modifier
	parseString, // slow_reason
];
