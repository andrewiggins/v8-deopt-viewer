import { LogReader } from "./v8-tools-core/logreader.js";
import { Profile } from "./v8-tools-core/profile.js";
import { parseSourcePosition } from "./utils.js";
import { deoptFieldParsers, getOptimizationSeverity } from "./deoptParsers.js";
import {
	propertyICFieldParsers,
	severityIcState,
} from "./propertyICParsers.js";
import {
	parseCodeCreateVarArgs,
	codeCreationParsers,
	nameOptimizationState,
	severityOfOptimizationState,
} from "./codeCreationParsers.js";

function locationKey(file, line, column) {
	return `${file}:${line}:${column}`;
}

/**
 * Parses a v8.log file (in CSV format) using utilities from V8/tools. This
 * class defines parsers for each of the fields of the lines it is interested
 * in, then processes each line, collecting information about deopts and inline
 * cache stores and reads.
 *
 * This implementation is forked from thlorenz/deoptigate
 */
export class DeoptLogReader extends LogReader {
	constructor({ logErrors = false } = {}) {
		// @ts-ignore
		super();
		this.logErrors = logErrors;

		this._profile = new Profile();

		/** @type {Map<string, import('./').ICEntry>} */
		this.entriesIC = new Map();
		/** @type {Map<string, import('./').DeoptEntry>} */
		this.entriesDeopt = new Map();
		/** @type {Map<string, import('./').CodeEntry>} */
		this.entriesCode = new Map();

		// Define the V8 log entries we care about, specifying how to parse the CSV
		// fields, and the function to process the parsed fields with. Passing this
		// dispatch table as an argument into `super` fails because it would
		// reference `this` before invoking super
		this.dispatchTable_ = {
			// Collect info about CRUD of code
			"code-creation": {
				parsers: codeCreationParsers,
				processor: this._processCodeCreation.bind(this),
			},
			"code-move": {
				parsers: [parseInt, parseInt],
				processor: this._processCodeMove.bind(this),
			},
			"code-delete": {
				parsers: [parseInt],
				processor: this._processCodeDelete.bind(this),
			},
			"sfi-move": {
				parsers: [parseInt, parseInt],
				processor: this._processFunctionMove.bind(this),
			},

			// Collect deoptimization info
			"code-deopt": {
				parsers: deoptFieldParsers,
				processor: this._processCodeDeopt.bind(this),
			},

			// Collect IC info
			LoadIC: {
				parsers: propertyICFieldParsers,
				processor: this._processPropertyIC.bind(this, "LoadIC"),
			},
			StoreIC: {
				parsers: propertyICFieldParsers,
				processor: this._processPropertyIC.bind(this, "StoreIC"),
			},
			KeyedLoadIC: {
				parsers: propertyICFieldParsers,
				processor: this._processPropertyIC.bind(this, "KeyedLoadIC"),
			},
			KeyedStoreIC: {
				parsers: propertyICFieldParsers,
				processor: this._processPropertyIC.bind(this, "KeyedStoreIC"),
			},
			StoreInArrayLiteralIC: {
				parsers: propertyICFieldParsers,
				processor: this._processPropertyIC.bind(this, "StoreInArrayLiteralIC"),
			},
		};
	}

	_processCodeCreation(type, kind, timestamp, start, size, name, varArgs) {
		if (varArgs.length == 0) {
			this._profile.addCode(type, name, timestamp, start, size);
			return;
		}

		const { funcAddr, optimizationState } = parseCodeCreateVarArgs(varArgs);
		this._profile.addFuncCode(
			type,
			name,
			timestamp,
			start,
			size,
			funcAddr,
			optimizationState
		);

		const isScript = type === "Script";
		const isUserFunction = type === "LazyCompile";
		if (isUserFunction || isScript) {
			let { fnFile, line, column } = this.getInfoFromProfile(start);

			// only interested in Node.js anonymous wrapper function
			// (function (exports, require, module, __filename, __dirname) {
			const isNodeWrapperFunction = line === 1 && column === 1;
			if (isScript && !isNodeWrapperFunction) return;

			const key = locationKey(fnFile, line, column);
			if (!this.entriesCode.has(key)) {
				const [functionName, sourceLocation] = fnFile.split(" ");
				this.entriesCode.set(key, {
					functionName,
					file: parseSourcePosition(sourceLocation).file,
					line,
					column,
					isScript,
					updates: [],
				});
			}

			const code = this.entriesCode.get(key);
			code.updates.push({
				timestamp,
				state: nameOptimizationState(optimizationState),
				severity: severityOfOptimizationState(optimizationState),
			});
		}
	}

	_processCodeMove(from, to) {
		this._profile.moveCode(from, to);
	}

	_processCodeDelete(start) {
		this._profile.deleteCode(start);
	}

	_processFunctionMove(from, to) {
		this._profile.moveFunc(from, to);
	}

	// timestamp is in micro seconds
	// https://cs.chromium.org/chromium/src/v8/src/log.cc?l=892&rcl=8fecf0eff7357c1bee222f76c4e2f6fdd8759797
	_processCodeDeopt(
		timestamp,
		size,
		code,
		inliningId,
		scriptOffset,
		bailoutType,
		deoptLocation,
		deoptReason
	) {
		const { fnFile, optimizationState } = this.getInfoFromProfile(code);
		const { file, line, column } = deoptLocation;

		const key = locationKey(file, line, column);
		if (!this.entriesDeopt.has(key)) {
			this.entriesDeopt.set(key, {
				functionName: fnFile.split(" ")[0],
				file,
				line,
				column,
				updates: [],
			});
		}

		const deoptEntry = this.entriesDeopt.get(key);
		deoptEntry.updates.push({
			timestamp,
			bailoutType,
			deoptReason,
			optimizationState,
			inlined: inliningId !== -1,
			severity: getOptimizationSeverity(bailoutType),
			inlinedAt: deoptLocation.inlinedAt,
		});
	}

	_processPropertyIC(
		type,
		pc,
		line,
		column,
		oldState,
		newState,
		map,
		propertyKey,
		modifier,
		slow_reason
	) {
		// Skip IC entries that don't contain changes
		if (oldState == newState) {
			return;
		}

		const { fnFile, optimizationState } = this.getInfoFromProfile(pc);
		const key = locationKey(fnFile, line, column);
		if (!this.entriesIC.has(key)) {
			const [functionName, sourcePosition] = fnFile.split(" ");
			this.entriesIC.set(key, {
				functionName,
				file: parseSourcePosition(sourcePosition).file,
				line,
				column,
				updates: [],
			});
		}

		const icEntry = this.entriesIC.get(key);
		icEntry.updates.push({
			type,
			oldState,
			newState,
			key: propertyKey,
			map: map.toString(16), // TODO: Perhaps skip original parseInt
			optimizationState,
			severity: severityIcState(newState),
		});
	}

	/**
	 * @param {any} code
	 * @returns {{ fnFile: string; line: number; column: number; optimizationState: import('./').CodeState }}
	 */
	getInfoFromProfile(code) {
		const entry = this._profile.findEntry(code);
		if (entry == null) {
			return {
				fnFile: "",
				line: null,
				column: null,
				optimizationState: "unknown",
			};
		}

		const name = entry.func.getName();
		const { file: fnFile, line, column } = parseSourcePosition(name);

		return {
			fnFile,
			line,
			column,
			optimizationState: nameOptimizationState(entry.state),
		};
	}

	printError(msg) {
		if (this.logErrors) {
			console.error(msg);
		}
	}

	/** @returns {import('./').V8DeoptInfo} */
	toJSON() {
		/** @type {import('./').ICEntry[]} */
		const ics = [];
		for (const entry of this.entriesIC.values()) {
			if (entry.updates.length > 0) {
				ics.push(entry);
			}
		}

		/** @type {import('./').DeoptEntry[]} */
		const deopts = [];
		for (const entry of this.entriesDeopt.values()) {
			deopts.push(entry);
		}

		/** @type {import('./').CodeEntry[]} */
		const codes = [];
		for (const entry of this.entriesCode.values()) {
			codes.push(entry);
		}

		return { ics, deopts, codes };
	}
}
