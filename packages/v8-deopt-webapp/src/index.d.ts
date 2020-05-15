import { V8DeoptInfo } from "v8-deopt-parser";

type PerFileDeoptInfoWithSources = Record<string, V8DeoptInfoWithSources>;

interface AppProps {
	deoptInfo: PerFileDeoptInfoWithSources;
}

interface V8DeoptInfoWithSources extends V8DeoptInfo {
	relativePath: string;
	srcPath: string;
	src?: string;
	srcError?: string;
}
