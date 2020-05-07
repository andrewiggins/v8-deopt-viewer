import { parseSourcePosition } from "./parseSourcePosition.js";
import { Profile } from "./v8-tools-core/profile.js";

/**
 * @param {number} state
 * @returns {import('./index').CodeState}
 */
function nameOptimizationState(state) {
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

// TODO: Can we use MIN_SEVERITY here
function severityOfOptimizationState(state) {
	switch (state) {
		case Profile.CodeState.COMPILED:
			return 3;
		case Profile.CodeState.OPTIMIZABLE:
			return 2;
		case Profile.CodeState.OPTIMIZED:
			return 1;
		case -1:
			return 3;
		default:
			throw new Error("unknown code state: " + state);
	}
}

export class CodeEntry {
	constructor({ fnFile, line, column, isScript }) {
		const parts = fnFile.split(" ");
		this._functionName = parts[0];
		this._file = parseSourcePosition(parts[1]).file;
		this._line = line;
		this._column = column;
		this._isScript = isScript;

		this.updates = [];
	}

	addUpdate(timestamp, stateId) {
		const severity = severityOfOptimizationState(stateId);
		// const state = nameOptimizationState(stateId);
		this.updates.push({ timestamp, state: stateId, severity });
	}

	toJSON() {
		return {
			functionName: this._functionName,
			file: this._file,
			line: this._line,
			column: this._column,
			isScript: this._isScript,
			updates: this.updates,
		};
	}
}
