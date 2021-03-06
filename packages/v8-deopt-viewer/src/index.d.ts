interface Options {
	out: string;
	timeout: number;
	["keep-internals"]: boolean;
	["skip-maps"]: boolean;
	open: boolean;
	input: string;
}

export default async function run(
	srcFile: string,
	options: Options
): Promise<void>;
