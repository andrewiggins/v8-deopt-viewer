import { parseString, parseVarArgs } from "./v8-tools-core/logreader.js";
import { Profile } from "./v8-tools-core/profile.js";
import { MIN_SEVERITY } from "./utils.js";

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

/**
 * @param {number} state
 * @returns {import('./index').CodeState}
 */
export function nameOptimizationState(state) {
	switch (state) {
		case Profile.CodeState.COMPILED:
			return "compiled";
		case Profile.CodeState.OPTIMIZABLE:
			return "optimizable";
		case Profile.CodeState.OPTIMIZED:
			return "optimized";
		case -1:
			return "unknown";
		default:
			throw new Error("unknown code state: " + state);
	}
}

export function severityOfOptimizationState(state) {
	switch (state) {
		case Profile.CodeState.COMPILED:
			return MIN_SEVERITY + 2;
		case Profile.CodeState.OPTIMIZABLE:
			return MIN_SEVERITY + 1;
		case Profile.CodeState.OPTIMIZED:
			return MIN_SEVERITY;
		case -1:
			return MIN_SEVERITY + 2;
		default:
			throw new Error("unknown code state: " + state);
	}
}

/**
 * @param {[string, string]} varArgs
 * @returns {{ funcAddr: number; optimizationState: number; }}
 */
export function parseCodeCreateVarArgs(varArgs) {
	const funcAddr = parseInt(varArgs[0]);
	const optimizationState = parseOptimizationState(varArgs[1]);
	return { funcAddr, optimizationState };
}

export const codeCreationParsers = [
	parseString, // type
	parseInt, // kind
	parseInt, // timestamp
	parseInt, // start
	parseInt, // size
	parseString, // name
	parseVarArgs, // varArgs
];
