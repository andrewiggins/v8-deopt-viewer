interface Options {
	/** Path to store the V8 log file. Defaults to your OS temporary directory */
	logFilePath?: string;

	/**
	 * How long the keep the browser open to allow the webpage to run before
	 * closing the browser
	 */
	browserTimeoutMs?: number;

	/**
	 * Trace the creation of V8 object maps. Defaults to false. Greatly increases
	 * the size of log files.
	 */
	traceMaps?: boolean;
}

/**
 * Generate a V8 log of optimizations and deoptimizations for the given JS or
 * HTML file
 * @param srcPath The path or URL to run
 * @param options Options to influence how the log is generated
 * @returns The path to the generated V8 log file
 */
export async function generateV8Log(
	srcPath: string,
	options?: Options
): Promise<string>;
