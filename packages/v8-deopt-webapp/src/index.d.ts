import { PerFileV8DeoptInfo } from "v8-deopt-parser";

interface AppProps {
	deoptInfo: DeoptInfo;
}

interface DeoptInfo extends PerFileV8DeoptInfo {
	srcPath: string;
	src: string;
}
