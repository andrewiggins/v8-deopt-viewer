interface Options {
	logFilePath?: string;
	browserTimeoutMs?: number;
}

export async function generateV8Log(
	srcPath: string,
	options?: Options
): Promise<string>;
