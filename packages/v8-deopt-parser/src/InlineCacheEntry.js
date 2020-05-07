import { unquote, MIN_SEVERITY } from "./utils.js";
import { parseSourcePosition } from "./parseSourcePosition.js";
import {
	UNINITIALIZED,
	PREMONOMORPHIC,
	MONOMORPHIC,
	RECOMPUTE_HANDLER,
	POLYMORPHIC,
	MEGAMORPHIC,
	GENERIC,
} from "./fieldParsers.js";

/**
 * @param {import('./index').ICState} state
 * @returns {number}
 */
function severityIcState(state) {
	switch (state) {
		case UNINITIALIZED:
			return MIN_SEVERITY;
		case PREMONOMORPHIC:
			return MIN_SEVERITY;
		case MONOMORPHIC:
			return MIN_SEVERITY;
		case RECOMPUTE_HANDLER:
			return MIN_SEVERITY;
		case POLYMORPHIC:
			return MIN_SEVERITY + 1;
		case MEGAMORPHIC:
			return MIN_SEVERITY + 2;
		case GENERIC:
			return MIN_SEVERITY + 2;
		default:
			throw new Error("severity: unknown ic code state : " + state);
	}
}

export class IcEntry {
	constructor(fnFile, line, column) {
		fnFile = unquote(fnFile);
		const parts = fnFile.split(" ");
		const functionName = parts[0];
		const file = parseSourcePosition(parts[1]).file;

		this.functionName = functionName;
		this.file = file;
		this.line = line;
		this.column = column;
		this.updates = [];
	}

	addUpdate(type, oldState, newState, key, map, optimizationState) {
		map = map.toString(16);
		const severity = severityIcState(newState);

		this.updates.push({
			type,
			oldState,
			newState,
			key,
			map,
			optimizationState,
			severity,
		});
	}

	filterIcStateChanges() {
		this.updates = this.updates.filter((x) => x.oldState !== x.newState);
	}

	toJSON() {
		return {
			functionName: this.functionName,
			file: this.file,
			line: this.line,
			column: this.column,
			updates: this.updates,
		};
	}
}
