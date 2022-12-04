import { LogReader, parseString, parseVarArgs, } from "./v8-tools-core/logreader.js";
import { Profile } from "./v8-tools-core/profile.js";
import { isAbsolutePath, parseSourcePosition } from "./utils.js";
import { deoptFieldParsers, getOptimizationSeverity } from "./deoptParsers.js";
import {
	NO_FEEDBACK,
	propertyICFieldParsers,
	propertyIcFieldParsersNew,
	severityIcState,
} from "./propertyICParsers.js";
import {
	nameOptimizationState,
	parseOptimizationState,
	severityOfOptimizationState,
	UNKNOWN_OPT_STATE,
} from "./optimizationStateParsers.js";
import { sortEntries } from "./sortEntries.js";

/** @type {import('.').Options} */
const defaultOptions = {
	keepInternals: false,
	sortEntries: true,
};

// Ignore files that were used by ispawn to control the process
const ispawnRegex = /ispawn\/preload\/\S+\.js$/;

/**
 * @param {import('./').MapEntry} map
 * @param {string} childEdgeId
 */
function addEdgeChild(map, childEdgeId) {
	if (Array.isArray(map.children)) {
		map.children.push(childEdgeId);
	} else {
		map.children = [childEdgeId];
	}
}

/** @type {(address: number) => string} */
const getMapIdBase = (addr) => "0x" + addr.toString(16);

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

		/** @type {Map<string, import('./').MapEntry>} */
		this.allMapEntries = new Map();
		/** @type {Map<string, import('./').MapEdge>} */
		this.allEdgeEntries = new Map();

		/** @type {Set<string>} */
		this.usedMaps = new Set();

		this.isNewICFormat_ = undefined;

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

	_updateICDispatchTable() {
		const processIc = this.isNewICFormat_
			? this._processPropertyICNew
			: this._processPropertyIC;
		const parseIcField = this.isNewICFormat_
			? propertyIcFieldParsersNew
			: propertyICFieldParsers;

		Object.assign(this.dispatchTable_, {
			// Collect IC info
			LoadIC: {
				parsers: parseIcField,
				processor: processIc.bind(this, "LoadIC"),
			},
			StoreIC: {
				parsers: parseIcField,
				processor: processIc.bind(this, "StoreIC"),
			},
			KeyedLoadIC: {
				parsers: parseIcField,
				processor: processIc.bind(this, "KeyedLoadIC"),
			},
			KeyedStoreIC: {
				parsers: parseIcField,
				processor: processIc.bind(this, "KeyedStoreIC"),
			},
			StoreInArrayLiteralIC: {
				parsers: parseIcField,
				processor: processIc.bind(this, "StoreInArrayLiteralIC"),
			},
		});
	}

	/**
	 * @param {string} chunk
	 * @returns {void}
	 */
	processLogChunk(chunk) {
		if (this.isNewICFormat_ === undefined && /\n\w+IC,/.test(chunk)) {
			// New IC format has 10 values instead of 9
			// todo drop when old IC format become old enough
			// https://github.com/andrewiggins/v8-deopt-viewer/issues/47
			this.isNewICFormat_ = /\n\w+IC(,.*){10}/.test(chunk.toString());

			this._updateICDispatchTable();
		}

		super.processLogChunk(chunk);
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

	/**
	 * @param {string} type
	 * @param {number} code
	 * @param {number} time
	 * @param {number} line
	 * @param {number} column
	 * @param {import('./index').ICState} oldState
	 * @param {import('./index').ICState} newState
	 * @param {number} mapAddress
	 * @param {string} propertyKey
	 * @param {string} modifier
	 * @param {string} slow_reason
	 */
	_processPropertyICNew(
		type,
		code,
		time, // unused
		line,
		column,
		oldState,
		newState,
		mapAddress,
		propertyKey,
		modifier,
		slow_reason
	) {
		return this._processPropertyIC(
			type,
			code,
			line,
			column,
			oldState,
			newState,
			mapAddress,
			propertyKey,
			modifier,
			slow_reason
		);
	}

	/**
	 * @param {string} type
	 * @param {number} code
	 * @param {number} line
	 * @param {number} column
	 * @param {import('./index').ICState} oldState
	 * @param {import('./index').ICState} newState
	 * @param {number} mapAddress
	 * @param {string} propertyKey
	 * @param {string} modifier
	 * @param {string} slow_reason
	 */
	_processPropertyIC(
		type,
		code,
		line,
		column,
		oldState,
		newState,
		mapAddress,
		propertyKey,
		modifier,
		slow_reason
	) {
		// Skip no_feedback IC entries whose maps are 0. Not sure what these mean...
		if (oldState == NO_FEEDBACK && newState == NO_FEEDBACK && mapAddress == 0) {
			return;
		}

		const { functionName, file, optimizationState } =
			this.getInfoFromProfile(code);

		// PropertyIC doesn't use the functionName as the key because if funcA is
		// inlined in funcB, any propertyIC related to the inlined funcA code would
		// show up with the name funcB instead of funcA. This change in function
		// name makes it harder to track PropertyIC all related to funcA. So to keep
		// track of inline caches for funcA, we rely solely on the file, line, and
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

		let mapId;
		try {
			mapId = this.getExistingMap(mapAddress)?.id;
		} catch (e) {}

		const icEntry = this.icEntries.get(key);
		icEntry.updates.push({
			type,
			oldState,
			newState,
			key: propertyKey,
			map: mapId ?? getMapIdBase(mapAddress),
			optimizationState,
			severity,
			modifier,
			slowReason: slow_reason,
		});

		if (severity > icEntry.severity) {
			icEntry.severity = severity;
		}

		if (mapId && (this.options.keepInternals || !this.isInternal(icEntry))) {
			this.markMapTreeUsed(mapId);
		}
	}

	processMapCreate(time, address, description) {
		// map-create events might override existing maps if the addresses get
		// recycled. Hence we do not check for existing maps.
		//
		// TODO: Maybe perhaps consider making this method upgrade the allMapEntry
		// value to an array if an address was re-used?
		//
		// For example, 3055214391657 in v8-deopt-parser.v8.log.
		//
		// Or maybe we change add a new field to the root map indicating it has some
		// reuses and creating the reuse under a new ID (1234_1? or 1234.1 so the
		// type can remain a number). Or do we separate the map address and ID
		// concepts and ensure the ID is always a string? With a new ID per re-use,
		// each time we look up a map (i.e. getExistingMap) we'll need to make sure
		// we understand what map we want. It seems the V8 map-processor does this
		// using time. Based on the time of the look up, you can determine what map
		// version is used.

		// if (this.allMapEntries.has(id)) {
		// 	console.log("DUPLICATE MAP CREATE:", id);
		// }

		/** @type {import('.').MapEntry} */
		let map = {
			type: "maps",
			// TODO: Arbitrarily make this the hex form of the address to flush out
			// any bugs. Eventually this will likely need to become something map
			// address + time to accommodate map addresses that get re-used.
			id: getMapIdBase(address),
			address: address,
			time,
			description,
		};

		this.allMapEntries.set(map.id, map);
	}

	processMap(
		type,
		time,
		fromAddress,
		toAddress,
		profileCode,
		line,
		column,
		reason,
		name
	) {
		// Ignore line and column arguments. They can be invalid values (e.g. -1) if
		// a map is created in an internal function of V8 (e.g. Object.assign)
		if (profileCode == 0) {
			return;
		}

		if (type === "Deprecate") {
			// TODO: Investigate what this means...
			this.getExistingMap(fromAddress, time).isDeprecated = true;
			return;
		}

		if (toAddress == fromAddress) {
			throw new Error("From and to must be distinct.");
		}

		const from = this.getExistingMap(fromAddress, time);
		const to = this.getExistingMap(toAddress, time);

		/** @type {import('./').MapEdge} */
		let edge = {
			type: "mapsEdge",
			id: `${this._id++}`,
			subtype: type,
			name,
			reason,
			time,
			from: fromAddress == 0 ? undefined : from.id,
			to: to.id,
		};

		this.allEdgeEntries.set(edge.id, edge);

		if (from) {
			addEdgeChild(from, edge.id);
		}

		if (to) {
			to.edge = edge.id;
			to.filePosition = this.getInfoFromProfile(profileCode);
		}
	}

	processMapDetails(time, id, desc) {
		// TODO: Some maps can get multiple detail entries (e.g. 3656044277313 in
		// adders.traceMaps.v8.log). What should we do??
		let map = this.getExistingMap(id, time);
		if (!map.description) {
			map.description = desc;
		}
	}

	/**
	 * Given the address of a map and the time of the look up, return the
	 * appropriate map details. Assumes latest map if time is not given
	 * @param {number} address
	 * @param {number} [time]
	 */
	getExistingMap(address, time) {
		// For example, this a property IC log with a map ID of 0:
		// StoreInArrayLiteralIC,0x2b4d5aeaf12,164,47,0,1,0x000000000000,0,,
		if (address === 0) return undefined;

		const id = getMapIdBase(address);
		const map = this.allMapEntries.get(id);
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
		/** @type {import('.').MapData} */
		const mapData = { nodes: {}, edges: {} };

		// Only include maps used by the user's code an their direct parents. No
		// aunts or uncles are included by default.
		for (let mapId of this.usedMaps) {
			/** @type {string} */
			let parentMapId = mapId;
			let childEdgeId;

			do {
				let map = this.allMapEntries.get(parentMapId);
				if (map.id in mapData.nodes) {
					if (childEdgeId) {
						addEdgeChild(mapData.nodes[map.id], childEdgeId);
					}
					break;
				}

				mapData.nodes[map.id] = { ...map };

				// Clear the children array so that only children used by the maps in
				// this application are included
				mapData.nodes[map.id].children = childEdgeId
					? [childEdgeId]
					: undefined;

				if (map.edge) {
					childEdgeId = map.edge;
					mapData.edges[map.edge] = this.allEdgeEntries.get(map.edge);
				}

				parentMapId = map.edge ? this.allEdgeEntries.get(map.edge)?.from : null;
			} while (parentMapId);
		}

		const filterInternals = this.filterInternals.bind(this);
		return {
			id: undefined, // TODO: define if useful
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

	/**
	 * Determine if an entry is a reference to a internal V8 or NodeJS file
	 * @param {import('./index').Entry} entry
	 */
	isInternal(entry) {
		return !isAbsolutePath(entry.file) || ispawnRegex.test(entry.file);
	}

	filterInternals(entry) {
		return this.options.keepInternals || !this.isInternal(entry);
	}

	sortEntries(entries) {
		if (this.options.sortEntries) {
			return sortEntries(entries);
		} else {
			return entries;
		}
	}

	/**
	 * Add this map and all of its parents as "used"
	 * @param {string} mapId
	 */
	markMapTreeUsed(mapId) {
		if (this.usedMaps.has(mapId)) {
			return;
		}

		try {
			// Add this map and all of its parents to the usedMaps set
			let parentMapId = mapId;
			do {
				let map = this.allMapEntries.get(parentMapId);
				if (!map) {
					throw new Error(`No map details provided: id=${parentMapId}`);
				}

				this.usedMaps.add(parentMapId);
				parentMapId = map.edge ? this.allEdgeEntries.get(map.edge)?.from : null;
			} while (parentMapId && !this.usedMaps.has(parentMapId));
		} catch (error) {
			// Sometimes, V8 logs will include property ICs on Maps with no create
			// details (argh, why??). Ignore errors for those situations. For example,
			// 3055214391657 in v8-deopt-parser.v8.log
			if (!error.message.includes("No map details provided")) {
				throw error;
			}
		}
	}
}
