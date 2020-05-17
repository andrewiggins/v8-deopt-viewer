# v8-deopt-generate-log

Given a JavaScript file or URL, run the file or webpage and save a log of V8 optimizations and deoptimizations.

<div style="text-align: center; font-weight: bold">⚠ WARNING: DO NOT USE THIS TOOL WITH URLS YOU DON'T TRUST ⚠</div>
<div style="text-align: center;">In order to collect logs for websites, this tool must run Chromium in "no-sandbox" mode which a malicious website could use to compromise your machine. Only use this tool on URLs you trust</div>

## Installation

> Check out [`v8-deopt-viewer`](https://npmjs.com/package/v8-deopt-viewer) for a CLI that automates this for you!

Requires [NodeJS](https://nodejs.org) 14.x or greater.

```
npm i v8-deopt-generate-log
```

Also install [`puppeteer`](https://github.com/GoogleChrome/puppeteer) if you plan to generate logs for URLs or HTML files:

```bash
npm i puppeteer
```

## Usage

See [`index.d.ts`](src/index.d.ts) for the latest API. A snapshot is below.

```typescript
interface Options {
	/** Path to store the V8 log file. Defaults to your OS temporary directory */
	logFilePath?: string;

	/**
	 * How long the keep the browser open to allow the webpage to run before
	 * closing the browser
	 */
	browserTimeoutMs?: number;
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
```
