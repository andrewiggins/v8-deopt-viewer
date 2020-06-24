import {
	LogReader,
	parseString,
	parseVarArgs,
} from "./v8-tools-core/logreader.js";
import { Profile } from "./v8-tools-core/profile.js";
import { parseSourcePosition, isAbsolutePath } from "./utils.js";
import { deoptFieldParsers, getOptimizationSeverity } from "./deoptParsers.js";
import {
	propertyICFieldParsers,
	severityIcState,
	UNKNOWN,
} from "./propertyICParsers.js";
import {
	nameOptimizationState,
	severityOfOptimizationState,
	parseOptimizationState,
	UNKNOWN_OPT_STATE,
} from "./optimizationStateParsers.js";
import { sortEntries } from "./sortEntries.js";
import { getMapIdsFromICs, getRootMap, visitAllMaps } from "./mapUtils.js";

/** @type {import('.').Options} */
const defaultOptions = {
	keepInternals: false,
	sortEntries: true,
};

// Ignore files that were used by ispawn to control the process
const ispawnRegex = /ispawn\/preload\/\S+\.js$/;

/**
 * @param {string} functionName
 * @param {string} file
 * @param {number} line
 * @param {number} column
 */
function locationKey(functionName, file, line, column) {
	return `${functionName} ${file}:${line}:${column}`;
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
	// Check out v8/tools/ic-processor.js for a sample implementation of using
	// LogReader to track IC state:
	// https://github.com/v8/v8/blob/4b9b23521e6fd42373ebbcb20ebe03bf445494f9/tools/ic-processor.js

	constructor(options = null) {
		// @ts-ignore
		super();

		/** @type {import('.').Options} */
		this.options = Object.assign({}, defaultOptions, options);

		this._id = 0;
		this._profile = new Profile();

		/** @type {Map<string, import('./').ICEntry>} */
		this.icEntries = new Map();
		/** @type {Map<string, import('./').DeoptEntry>} */
		this.deoptEntries = new Map();
		/** @type {Map<string, import('./').CodeEntry>} */
		this.codeEntries = new Map();
		/** @type {Map<number, import('./').MapEntry>} */
		this.mapEntries = new Map();
		/** @type {Map<string, import('./').MapEdge>} */
		this.edgeEntries = new Map();

		// Define the V8 log entries we care about, specifying how to parse the CSV
		// fields, and the function to process the parsed fields with. Passing this
		// dispatch table as an argument into `super` fails because it would
		// reference `this` before invoking super
		this.dispatchTable_ = {
			// Collect info about CRUD of code
			"code-creation": {
				parsers: [
					parseString, // type
					parseInt, // kind
					parseInt, // timestamp
					parseInt, // start
					parseInt, // size
					parseString, // name
					parseVarArgs, // varArgs
				],
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

			// Collect map creation/transition info
			"map-create": {
				parsers: [
					parseInt, // time
					parseInt, // id
					parseString, // description
				],
				processor: this.processMapCreate,
			},
			map: {
				parsers: [
					parseString, // type
					parseInt, // time
					parseInt, // from
					parseInt, // to
					parseInt, // profileCode
					parseInt, // line
					parseInt, // column
					parseString, // reason
					parseString, // name
				],
				processor: this.processMap,
			},
			"map-details": {
				parsers: [
					parseInt, // time
					parseInt, // id
					parseString, // description
				],
				processor: this.processMapDetails,
			},
		};
	}

	_processCodeCreation(type, kind, timestamp, start, size, name, varArgs) {
		if (varArgs.length == 0) {
			this._profile.addCode(type, name, timestamp, start, size);
			return;
		}

		const funcAddr = parseInt(varArgs[0]);
		const optimizationState = parseOptimizationState(varArgs[1]);
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
			let { functionName, file, line, column } = this.getInfoFromProfile(start);

			// only interested in Node.js anonymous wrapper function
			// (function (exports, require, module, __filename, __dirname) {
			const isNodeWrapperFunction = line === 1 && column === 1;
			if (isScript && !isNodeWrapperFunction) return;

			let severity = severityOfOptimizationState(optimizationState);
			const key = locationKey(functionName, file, line, column);
			if (!this.codeEntries.has(key)) {
				this.codeEntries.set(key, {
					type: "codes",
					id: `${this._id++}`,
					functionName,
					file,
					line,
					column,
					isScript,
					severity,
					updates: [],
				});
			}

			const code = this.codeEntries.get(key);
			code.updates.push({
				timestamp,
				state: nameOptimizationState(optimizationState),
				severity,
			});

			if (code.updates.length > 3) {
				// From Deoptigate: If there are lots of updates that means the function
				// was optimized a lot which could point to an issue.
				code.severity = Math.max(code.severity, 3);
				code.updates[code.updates.length - 1].severity = 3;
			} else if (severity < code.severity) {
				// Since these entries track optimizations (a good thing), set the
				// severity to the best state this entry achieved (lowest severity). In
				// other words, code that was optimizable (sev 2) but never optimized
				// (sev 1) is at a worse severity than code that was eventually
				// optimized. So once code gets optimized, track that the code entry
				// achieved optimized state (the lowest severity).
				code.severity = severity;
			}
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
		const { file, line, column } = deoptLocation;
		const { functionName, optimizationState } = this.getInfoFromProfile(code);

		// Deopt doesn't use the functionName as the key because if funcA is inlined
		// in funcB, any deopts related to the inlined funcA code would show up with
		// the name funcB instead of funcA. This change in function name makes it
		// harder to track deopts all related to funcA. So to keep track of deopts
		// for funcA, we rely soley on the file, line, and column from the
		// deoptLocation param (which is consistent across inlines) to track deopt
		// status
		const key = locationKey("", file, line, column);

		const severity = getOptimizationSeverity(bailoutType);
		if (!this.deoptEntries.has(key)) {
			this.deoptEntries.set(key, {
				type: "deopts",
				id: `${this._id++}`,
				functionName,
				file,
				line,
				column,
				severity,
				updates: [],
			});
		}

		const deoptEntry = this.deoptEntries.get(key);
		deoptEntry.updates.push({
			timestamp,
			bailoutType,
			deoptReason,
			optimizationState,
			inlined: inliningId !== -1,
			severity,
			inlinedAt: deoptLocation.inlinedAt,
		});

		if (severity > deoptEntry.severity) {
			deoptEntry.severity = severity;
		}
	}

	_processPropertyIC(
		type,
		code,
		line,
		column,
		oldState,
		newState,
		map,
		propertyKey,
		modifier,
		slow_reason
	) {
		// Skip unknown IC entries whose maps are 0. Not sure what these mean...
		if (oldState == UNKNOWN && newState == UNKNOWN && map == 0) {
			return;
		}

		const { functionName, file, optimizationState } = this.getInfoFromProfile(
			code
		);

		// PropertyIC doesn't use the functionName as the key because if funcA is
		// inlined in funcB, any propertyIC related to the inlined funcA code would
		// show up with the name funcB instead of funcA. This change in function
		// name makes it harder to track PropertyIC all related to funcA. So to keep
		// track of inline caches for funcA, we rely soley on the file, line, and
		// column from the profile (which is consistent across inlines) to track
		// property inline caches
		const key = locationKey("", file, line, column);

		const severity = severityIcState(newState);
		if (!this.icEntries.has(key)) {
			this.icEntries.set(key, {
				type: "ics",
				id: `${this._id++}`,
				functionName,
				file,
				line,
				column,
				severity,
				updates: [],
			});
		}

		const icEntry = this.icEntries.get(key);
		icEntry.updates.push({
			type,
			oldState,
			newState,
			key: propertyKey,
			map,
			optimizationState,
			severity,
			modifier,
			slowReason: slow_reason,
		});

		if (severity > icEntry.severity) {
			icEntry.severity = severity;
		}
	}

	processMapCreate(time, id, description) {
		// map-create events might override existing maps if the addresses get
		// recycled. Hence we do not check for existing maps.

		/** @type {import('.').MapEntry} */
		let map = {
			type: "maps",
			id,
			time,
			description,
			children: [],
			depth: 0,
		};

		this.mapEntries.set(id, map);
	}

	processMap(
		type,
		time,
		fromId,
		toId,
		profileCode,
		line,
		column,
		reason,
		name
	) {
		if (profileCode == 0 || line == -1 || column == -1) {
			return;
		}

		if (type === "Deprecate") {
			// TODO: Investigate what this means...
			this.getExistingMap(fromId, time).isDeprecated = true;
			return;
		}

		if (toId == fromId) {
			throw new Error("From and to must be distinct.");
		}

		/** @type {import('./').MapEdge} */
		let edge = {
			type: "mapsEdge",
			id: `${this._id++}`,
			subtype: type,
			name,
			reason,
			time,
			from: fromId == 0 ? undefined : fromId,
			to: toId,
		};

		this.edgeEntries.set(edge.id, edge);

		const from = this.getExistingMap(fromId, time);
		const to = this.getExistingMap(toId, time);

		if (from) from.children.push(edge.id);
		if (to) {
			to.edge = edge.id;
			to.filePosition = this.getInfoFromProfile(profileCode);
		}

		let newDepth = (from?.depth ?? 0) + 1;
		if (to.depth > 0 && to.depth != newDepth) {
			// TODO: Investigate what makes this happen...
			throw new Error("Depth has already been initialized");
		}

		to.depth = newDepth;
	}

	processMapDetails(time, id, desc) {
		// TODO: Do map-details come before map-create?
		let map = this.getExistingMap(id, time);
		if (!map.description) {
			map.description = desc;
		}
	}

	getExistingMap(id, time) {
		if (id === 0) return undefined;

		const map = this.mapEntries.get(id);
		if (map === undefined) {
			throw new Error(`No map details provided: id=${id}`);
		}

		return map;
	}

	/**
	 * @param {any} code
	 * @returns {{ functionName: string; file: string; line: number; column: number; optimizationState: import('./').CodeState }}
	 */
	getInfoFromProfile(code) {
		const entry = this._profile.findEntry(code);
		if (entry == null) {
			throw new Error(`Could not find entry in Profile with code "${code}"`);
		}

		if (entry.type === "Builtin") {
			return {
				functionName: entry.name,
				file: "",
				line: -1,
				column: -1,
				optimizationState: nameOptimizationState(UNKNOWN_OPT_STATE),
			};
		}

		const name = entry.func.getName();
		const { file: fnFile, line, column } = parseSourcePosition(name);

		const lastSpace = fnFile.lastIndexOf(" ");
		const functionName = fnFile.slice(0, lastSpace);
		const file = fnFile.slice(lastSpace + 1);

		return {
			functionName,
			file,
			line,
			column,
			optimizationState: nameOptimizationState(entry.state),
		};
	}

	printError(msg) {
		console.error(`v8-deopt-parser - Error parsing V8 log file: ${msg}`);
	}

	/** @returns {import('./').V8DeoptInfo} */
	toJSON() {
		this.treeShakeMapsAndEdges();

		/** @type {import('.').MapData} */
		const mapData = { nodes: {}, edges: {} };
		for (let [id, mapEntry] of this.mapEntries.entries()) {
			mapData.nodes[id] = mapEntry;
		}

		for (let [id, mapEdge] of this.edgeEntries.entries()) {
			mapData.edges[id] = mapEdge;
		}

		const filterInternals = this.filterInternals.bind(this);
		return {
			ics: this.sortEntries(
				Array.from(this.icEntries.values())
					.filter((entry) => entry.updates.length > 0)
					.filter(filterInternals)
			),
			deopts: this.sortEntries(
				Array.from(this.deoptEntries.values()).filter(filterInternals)
			),
			codes: this.sortEntries(
				Array.from(this.codeEntries.values()).filter(filterInternals)
			),
			maps: mapData,
		};
	}

	filterInternals(entry) {
		return (
			this.options.keepInternals ||
			(isAbsolutePath(entry.file) && !ispawnRegex.test(entry.file))
		);
	}

	sortEntries(entries) {
		if (this.options.sortEntries) {
			return sortEntries(entries);
		} else {
			return entries;
		}
	}

	treeShakeMapsAndEdges() {
		if (this.options.keepInternals || this.mapEntries.size == 0) {
			return;
		}

		const allMaps = this.mapEntries;
		const allEdges = this.edgeEntries;

		const getMap = (mapId) => allMaps.get(mapId);
		const getEdge = (edgeId) => allEdges.get(edgeId);

		this.mapEntries = new Map();
		this.edgeEntries = new Map();

		const mapIdsFromIcs = getMapIdsFromICs(this.icEntries.values());
		for (let mapId of mapIdsFromIcs) {
			const rootMap = getRootMap(getMap, getEdge, getMap(mapId));

			visitAllMaps(rootMap, getMap, getEdge, (map) => {
				this.mapEntries.set(map.id, map);
				if (map.edge) {
					this.edgeEntries.set(map.edge, getEdge(map.edge));
				}
			});
		}
	}
}
