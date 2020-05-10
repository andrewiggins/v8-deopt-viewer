import { V8DeoptInfo } from "v8-deopt-parser";

interface Options {
	out: string;
	timeout: number;
	["keep-internals"]: boolean;
	open: boolean;
}

interface V8DeoptInfoWithSources extends V8DeoptInfo {
	srcPath: string;
	src?: string;
	error?: string;
}

export default async function run(
	srcFile: string,
	options: Options
): Promise<void>;
