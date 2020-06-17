// ======================================
// #region Code types

type CodeState = "compiled" | "optimizable" | "optimized" | "unknown";

interface CodeEntry {
	type: "codes";
	id: string;
	functionName: string;
	file: string;
	line: number;
	column: number;
	isScript: boolean;
	severity: number;
	updates: CodeEntryUpdate[];
}

interface CodeEntryUpdate {
	timestamp: number;
	state: CodeState;
	severity: number;
}

// #endregion
// ======================================

// ======================================
// #region Deopt types

interface DeoptEntry {
	type: "deopts";
	id: string;
	functionName: string;
	file: string;
	line: number;
	column: number;
	severity: number;
	updates: DeoptEntryUpdate[];
}

interface DeoptEntryUpdate {
	timestamp: number;
	bailoutType: string;
	deoptReason: string;
	optimizationState: string;
	inlined: boolean;
	severity: number;
	inlinedAt?: InlinedLocation;
}

interface InlinedLocation {
	file: string;
	line: number;
	column: number;
}

// #endregion
// ======================================

// ======================================
// #region Inline Cache types
type ICState =
	| "unintialized"
	| "premonomorphic"
	| "monomorphic"
	| "recompute_handler"
	| "polymorphic"
	| "megamorphic"
	| "generic"
	| "unknown";

interface ICEntry {
	type: "ics";
	id: string;
	functionName: string;
	file: string;
	line: number;
	column: number;
	severity: number;
	updates: ICEntryUpdate[];
}

interface ICEntryUpdate {
	type: string;
	oldState: ICState;
	newState: ICState;
	key: string;
	map: number;
	optimizationState: string;
	severity: number;
	modifier: string;
	slowReason: string;
}

// #endregion
// ======================================

// ======================================
// #region V8 Map types

interface MapEntry {
	// Add an artificial type property to differentiate between MapEntries and MapEdges
	type: "MapEntry";
	id: number;
	time: number;
	description: string;

	// Parent Edge? Or the edge that leads to this Map
	// edge?: MapEdge; // Edge type
	/** Parent Edge ID */
	edge?: string;

	// Children Edges
	// children: MapEdge[]; // TODO: Edge ID?
	/** Children Edge IDs */
	children: string[];

	depth: number;

	isDeprecated?: boolean;
	// deprecationTargets?: any; // ??
	// leftId?: number;
	// rightId?: number;
	filePosition?: {
		functionName: string;
		file: string;
		line: number;
		column: number;
		optimizationState: CodeState;
	};
}

type MapEdgeType =
	| "Transition"
	| "Normalize" // FastToSlow
	| "SlowToFast"
	| "InitialMap"
	| "new"
	| "ReplaceDescriptors"
	| "CopyAsPrototype"
	| "OptimizeAsPrototype";

interface MapEdge {
	type: "MapEdge";
	subtype: MapEdgeType;
	id: string;
	name: string;
	reason: string;
	time: number;
	from: number;
	// from: MapEntry;
	to: number;
	// to: MapEntry;
}

interface MapData {
	nodes: Record<number, MapEntry>;
	edges: Record<string, MapEdge>;
}

// #endregion
// ======================================

type Entry = ICEntry | DeoptEntry | CodeEntry;

interface V8DeoptInfo {
	ics: ICEntry[];
	deopts: DeoptEntry[];
	codes: CodeEntry[];
	maps?: MapData;
}

interface PerFileV8DeoptInfo {
	files: Record<string, Omit<V8DeoptInfo, "maps">>;
	maps?: MapData;
}

interface Options {
	keepInternals?: boolean;
	sortEntries?: boolean;
}

// ======================================
// #region Exports

/**
 * Parse the deoptimizations from a v8.log file
 * @param v8LogContent The contents of a v8.log file
 * @param options Options to influence the parsing of the V8 log
 */
export function parseV8Log(
	v8LogContent: string,
	options?: Options
): Promise<V8DeoptInfo>;

/**
 * Group the V8 deopt information into an object mapping files to the relevant
 * data
 * @param rawDeoptInfo A V8DeoptInfo object from `parseV8Log`
 */
export function groupByFile(rawDeoptInfo: V8DeoptInfo): PerFileV8DeoptInfo;

/**
 * Find an entry in a V8DeoptInfo object
 * @param deoptInfo A V8DeoptInfo object from `parseV8Log`
 * @param entryId The ID of the entry to find
 */
export function findEntry(
	deoptInfo: V8DeoptInfo,
	entryId: string
): Entry | null;

/**
 * Sort V8 Deopt entries by line, number, and type. Modifies the original array.
 * @param entries A list of V8 Deopt Entries
 * @returns The sorted entries
 */
export function sortEntries(entries: Entry[]): Entry[];

/**
 * Get the severity of an Inline Cache state
 * @param state An Inline Cache state
 */
export function severityIcState(state: ICState): number;

/** The minimum severity an update or entry can be. */
export const MIN_SEVERITY = 1;

/** The value used when severity cannot be determined. */
export const UNKNOWN_SEVERITY = -1;

// #endregion
// ======================================
