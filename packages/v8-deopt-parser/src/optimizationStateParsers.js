import { Profile } from "./v8-tools-core/profile.js";
import { MIN_SEVERITY } from "./utils.js";

export function parseOptimizationState(rawState) {
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
