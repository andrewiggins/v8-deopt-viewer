const MIN_SEVERITY = 0;

type CodeState = "compiled" | "optimizable" | "optimized" | "unknown";

interface CodeEntry {
	functionName: string;
	file: string;
	line: number;
	column: number;
	isScript: boolean;
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
	| "generic";

interface ICEntry {
	functionName: string;
	file: string;
	line: number;
	column: number;
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

interface V8DeoptInfo {
	ics: ICEntry[];
	deopts: DeoptEntry[];
	codes: CodeEntry[];
}

/**
 * Parse the deoptimizations from a v8.log file
 * @param v8LogContent The contents of a v8.log file
 * @param readSourceFileContent Given paths to source files from the v8.log,
 * this function should return their contents
 */
export async function parseV8Log(v8LogContent: string): Promise<V8DeoptInfo>;
