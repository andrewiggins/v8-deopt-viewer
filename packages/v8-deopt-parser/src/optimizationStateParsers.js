import { Profile } from "./v8-tools-core/profile.js";
import { MIN_SEVERITY, UNKNOWN_SEVERITY } from "./utils.js";

export const UNKNOWN_OPT_STATE = -1;

export function parseOptimizationState(rawState) {
	switch (rawState) {
		case "":
			return Profile.CodeState.COMPILED;
		case "~":
			return Profile.CodeState.OPTIMIZABLE;
		case "*":
			return Profile.CodeState.OPTIMIZED;
		case "^":
			return Profile.CodeState.BASELINE;
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
		case Profile.CodeState.BASELINE:
			return "baseline";
		case UNKNOWN_OPT_STATE:
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
		case Profile.CodeState.BASELINE:
			return MIN_SEVERITY + 2; // Not entirely sure about this
		case UNKNOWN_OPT_STATE:
			return UNKNOWN_SEVERITY;
		default:
			throw new Error("unknown code state: " + state);
	}
}
