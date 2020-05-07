const MIN_SEVERITY = 0;

type CodeState = "compiled" | "optimizable" | "optimized" | "unknown";

type ICState =
	| "unintialized"
	| "premonomorphic"
	| "monomorphic"
	| "recompute_handler"
	| "polymorphic"
	| "megamorphic"
	| "generic";

interface V8DeoptInfo {
	// TODO
}

/**
 * Parse the deoptimizations from a v8.log file
 * @param v8LogContent The contents of a v8.log file
 * @param readSourceFileContent Given paths to source files from the v8.log,
 * this function should return their contents
 */
export async function parseV8Log(
	v8LogContent: string,
	readSourceFileContent: (srcFilePath: string) => Promise<string>
): Promise<V8DeoptInfo>;
