import { parseString } from "./v8-tools-core/logreader.js";
import { MIN_SEVERITY, UNKNOWN_SEVERITY } from "./utils.js";

// Comments from: https://github.com/v8/v8/blob/23dace88f658c44b5346eb0858fdc2c6b52e9089/src/common/globals.h#L852

/** Has never been executed */
const UNINITIALIZED = "uninitialized";
const PREMONOMORPHIC = "premonomorphic";
/** Has been executed and only on receiver has been seen */
const MONOMORPHIC = "monomorphic";
/** Check failed due to prototype (or map deprecation) */
const RECOMPUTE_HANDLER = "recompute_handler";
/** Multiple receiver types have been seen */
const POLYMORPHIC = "polymorphic";
/** Many receiver types have been seen */
const MEGAMORPHIC = "megamorphic";
/** Many DOM receiver types have been seen for the same accessor */
const MEGADOM = "megadom";
/** A generic handler is installed and no extra typefeedback is recorded */
const GENERIC = "generic";
/** No feedback will be collected */
export const NO_FEEDBACK = "no_feedback";

/**
 * @param {string} rawState Raw Inline Cache state from V8
 * @returns {import('./index').ICState}
 */
function parseIcState(rawState) {
	// ICState mapping in V8: https://github.com/v8/v8/blob/99c17a8bd0ff4c1f4873d491e1176f6c474985f0/src/ic/ic.cc#L53
	// Meanings: https://github.com/v8/v8/blob/99c17a8bd0ff4c1f4873d491e1176f6c474985f0/src/common/globals.h#L934
	switch (rawState) {
		case "0":
			return UNINITIALIZED;
		case ".":
			return PREMONOMORPHIC;
		case "1":
			return MONOMORPHIC;
		case "^":
			return RECOMPUTE_HANDLER;
		case "P":
			return POLYMORPHIC;
		case "N":
			return MEGAMORPHIC;
		case "D":
			return MEGADOM;
		case "G":
			return GENERIC;
		case "X":
			return NO_FEEDBACK;
		default:
			throw new Error("parse: unknown ic code state: " + rawState);
	}
}

/**
 * @param {import('./index').ICState} state
 * @returns {number}
 */
export function severityIcState(state) {
	switch (state) {
		case UNINITIALIZED:
		case PREMONOMORPHIC:
		case MONOMORPHIC:
		case RECOMPUTE_HANDLER:
			return MIN_SEVERITY;
		case POLYMORPHIC:
		case MEGADOM:
			return MIN_SEVERITY + 1;
		case MEGAMORPHIC:
		case GENERIC:
			return MIN_SEVERITY + 2;
		case NO_FEEDBACK:
			return UNKNOWN_SEVERITY;
		default:
			throw new Error("severity: unknown ic code state : " + state);
	}
}

// From https://github.com/v8/v8/blob/4773be80d9d716baeb99407ff8766158a2ae33b5/src/logging/log.cc#L1778
export const propertyICFieldParsers = [
	parseInt, // profile code
	parseInt, // line
	parseInt, // column
	parseIcState, // old_state
	parseIcState, // new_state
	parseInt, // map ID
	parseString, // propertyKey
	parseString, // modifier
	parseString, // slow_reason
];
export const propertyIcFieldParsersNew = [
	parseInt, // profile code
	parseInt, // time
	parseInt, // line
	parseInt, // column
	parseIcState, // old_state
	parseIcState, // new_state
	parseInt, // map ID
	parseString, // propertyKey
	parseString, // modifier
	parseString, // slow_reason
];
