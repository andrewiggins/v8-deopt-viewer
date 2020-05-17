# v8-deopt-parser

Parse a V8 log of optimizations and deoptimizations into an JavaScript object.

## Installation

> Check out [`v8-deopt-viewer`](https://npmjs.com/package/v8-deopt-viewer) for a CLI that automates this for you!

Requires [NodeJS](https://nodejs.org) 14.x or greater.

```bash
npm i v8-deopt-parser
```

## Usage

The main export of this package is `parseV8Log`. Given the contents of a v8.log file, it returns a JavaScript object that contains the relevant optimization and deoptimization information.

This package also contains some helper methods for using the resulting `V8DeoptInfo` object. See [`index.d.ts`](src/index.d.ts) for the latest API and definition of the `V8DeoptInfo` object.

```typescript
/**
 * Parse the deoptimizations from a v8.log file
 * @param v8LogContent The contents of a v8.log file
 * @param options Options to influence the parsing of the V8 log
 */
export function parseV8Log(
	v8LogContent: string,
	options?: Options
): Promise<V8DeoptInfo>;

/**
 * Group the V8 deopt information into an object mapping files to the relevant
 * data
 * @param rawDeoptInfo A V8DeoptInfo object from `parseV8Log`
 */
export function groupByFile(rawDeoptInfo: V8DeoptInfo): PerFileV8DeoptInfo;

/**
 * Find an entry in a V8DeoptInfo object
 * @param deoptInfo A V8DeoptInfo object from `parseV8Log`
 * @param entryId The ID of the entry to find
 */
export function findEntry(
	deoptInfo: V8DeoptInfo,
	entryId: string
): Entry | null;

/**
 * Sort V8 Deopt entries by line, number, and type. Modifies the original array.
 * @param entries A list of V8 Deopt Entries
 * @returns The sorted entries
 */
export function sortEntries(entries: Entry[]): Entry[];

/**
 * Get the severity of an Inline Cache state
 * @param state An Inline Cache state
 */
export function severityIcState(state: ICState): number;

/** The minimum severity an update or entry can be. */
export const MIN_SEVERITY = 1;
```

## Prior work

- [thlorenz/deoptigate](https://github.com/thlorenz/deoptigate)

  This project started out as a fork of the awesome `deoptigate` but as the scope of what I wanted to accomplish grew, I figured it was time to start my own project that I could re-architect to meet my requirements
