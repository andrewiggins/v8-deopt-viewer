import { PerFileV8DeoptInfo, FileV8DeoptInfo } from "v8-deopt-parser";

export interface AppProps {
	deoptInfo: PerFileDeoptInfoWithSources;
}

export interface PerFileDeoptInfoWithSources extends PerFileV8DeoptInfo {
	files: Record<string, FileV8DeoptInfoWithSources>;
}

export type FileV8DeoptInfoWithSources = FileV8DeoptInfo & {
	relativePath: string;
	srcPath: string;
	src?: string;
	srcError?: string;
};

export interface Route<Args> {
	id: string;
	title?: string;
	route: string;
	getHref(...args: Args): string;
}
