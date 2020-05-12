const MIN_SEVERITY = 0;

type CodeState = "compiled" | "optimizable" | "optimized" | "unknown";

interface CodeEntry {
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
	state: string;
	severity: number;
}

interface DeoptEntry {
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
	functionName: string;
	file: string;
	line: number;
	column: number;
	severity: number;
	updates: ICEntryUpdate[];
}

interface ICEntryUpdate {
	type: string;
	oldState: string;
	newState: string;
	key: string;
	map: string;
	optimizationState: string;
	severity: number;
}

type Entry = ICEntry | DeoptEntry | CodeEntry;

interface V8DeoptInfo {
	ics: ICEntry[];
	deopts: DeoptEntry[];
	codes: CodeEntry[];
}

interface PerFileV8DeoptInfo {
	[filePath: string]: V8DeoptInfo;
}

interface PerFilePerLocationV8DeoptInfo {
	[filePath: string]: {
		[locationKey: string]: V8DeoptInfo;
	};
}

interface Options {
	keepInternals?: boolean;
}

/**
 * Parse the deoptimizations from a v8.log file
 * @param v8LogContent The contents of a v8.log file
 * @param readSourceFileContent Given paths to source files from the v8.log,
 * this function should return their contents
 */
export async function parseV8Log(
	v8LogContent: string,
	keepInternals?: Options
): Promise<V8DeoptInfo>;

export function locationKey(entry: Entry): string;
export function parseLocationKey(key: string): [string, number, number];
export function groupByFile(rawDeoptInfo: V8DeoptInfo): PerFileV8DeoptInfo;
export function groupByFileAndLocation(
	rawDeoptInfo: V8DeoptInfo
): PerFilePerLocationV8DeoptInfo;
