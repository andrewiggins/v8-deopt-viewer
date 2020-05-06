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
): V8DeoptInfo;
