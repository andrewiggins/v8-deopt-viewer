import { V8DeoptInfo, PerFileV8DeoptInfo } from "v8-deopt-parser";

export interface AppProps {
	deoptInfo: PerFileDeoptInfoWithSources;
}

export interface PerFileDeoptInfoWithSources extends PerFileV8DeoptInfo {
	files: Record<string, V8DeoptInfoWithSources>;
}

export type V8DeoptInfoWithSources = Omit<V8DeoptInfo, "maps"> & {
	relativePath: string;
	srcPath: string;
	src?: string;
	srcError?: string;
};
