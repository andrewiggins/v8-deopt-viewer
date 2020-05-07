import { unquote, MIN_SEVERITY } from "./utils.js";

function getSeverity(bailoutType) {
	switch (bailoutType) {
		case "soft":
			return MIN_SEVERITY;
		case "lazy":
			return MIN_SEVERITY + 1;
		case "eager":
			return MIN_SEVERITY + 2;
	}
}

export class DeoptEntry {
	constructor(fnFile, file, line, column) {
		const parts = fnFile.split(" ");
		const functionName = parts[0];

		this.functionName = functionName;
		this.file = file;
		this.line = line;
		this.column = column;

		this.updates = [];
	}

	addUpdate(
		timestamp,
		bailoutType,
		deoptReason,
		optimizationState,
		inliningId,
		inlinedAt
	) {
		bailoutType = unquote(bailoutType);
		deoptReason = unquote(deoptReason);

		const inlined = inliningId !== -1;
		const severity = getSeverity(bailoutType);

		this.updates.push({
			timestamp,
			bailoutType,
			deoptReason,
			optimizationState,
			inlined,
			severity,
			inlinedAt,
		});
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
