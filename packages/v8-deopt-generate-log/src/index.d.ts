interface Options {
	logFilePath?: string;
}

export async function generateV8Log(
	srcPath: string,
	options?: Options
): Promise<string>;
