import { V8DeoptInfo } from "v8-deopt-parser";

interface AppProps {
	deoptInfo: Record<string, V8DeoptInfoWithSources>;
}

interface V8DeoptInfoWithSources extends V8DeoptInfo {
	relativePath: string;
	srcPath: string;
	src?: string;
	error?: string;
}
