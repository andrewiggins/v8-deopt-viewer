import test from "tape";
import { runParser, writeSnapshot, validateEntry } from "./helpers.js";

test("runParser(adders.v8.log)", async (t) => {
	const logFileName = "adders.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(t, "Matching ICS Entry", result.ics, {
		type: "ics",
		id: "327",
		functionName: "addAny",
		file: "/tmp/deoptigate/examples/simple/adders.js",
		line: 93,
		column: 27,
		severity: 3,
		updates: [
			{
				type: "LoadIC",
				oldState: "premonomorphic",
				newState: "monomorphic",
				key: "x",
				map: "0x017b7663a951",
				optimizationState: "optimizable",
				severity: 1,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "monomorphic",
				newState: "polymorphic",
				key: "x",
				map: "0x017b76637b61",
				optimizationState: "optimizable",
				severity: 2,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "polymorphic",
				newState: "megamorphic",
				key: "x",
				map: "0x017b76637021",
				optimizationState: "optimizable",
				severity: 3,
				modifier: "",
				slowReason: "",
			},
		],
	});

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "331",
		functionName: "addObjects",
		file: "/tmp/deoptigate/examples/simple/adders.js",
		line: 137,
		column: 28,
		severity: 3,
		updates: [
			{
				timestamp: 496191,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "309",
		functionName: "addNumbers",
		file: "/tmp/deoptigate/examples/simple/adders.js",
		line: 80,
		column: 20,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 66399,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 72377,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(two-modules.v8.log)", async (t) => {
	const logFileName = "two-modules.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(t, "Matching ICS Entry", result.ics, {
		type: "ics",
		id: "333",
		functionName: "addAny",
		file: "/tmp/deoptigate/examples/two-modules/adders.js",
		line: 38,
		column: 27,
		severity: 3,
		updates: [
			{
				type: "LoadIC",
				oldState: "premonomorphic",
				newState: "monomorphic",
				key: "x",
				map: "0x37cdf3b7a951",
				optimizationState: "optimizable",
				severity: 1,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "monomorphic",
				newState: "polymorphic",
				key: "x",
				map: "0x37cdf3b77b61",
				optimizationState: "optimizable",
				severity: 2,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "polymorphic",
				newState: "megamorphic",
				key: "x",
				map: "0x37cdf3b77021",
				optimizationState: "optimizable",
				severity: 3,
				modifier: "",
				slowReason: "",
			},
		],
	});

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "337",
		functionName: "addObjects",
		file: "/tmp/deoptigate/examples/two-modules/adders.js",
		line: 82,
		column: 28,
		severity: 3,
		updates: [
			{
				timestamp: 514196,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "315",
		functionName: "addNumbers",
		file: "/tmp/deoptigate/examples/two-modules/adders.js",
		line: 25,
		column: 20,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 64640,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 71657,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(html-inline.v8.log)", async (t) => {
	const logFileName = "html-inline.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 15, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(t, "Matching ICS Entry", result.ics, {
		type: "ics",
		id: "19",
		functionName: "addAny",
		file: "file:///tmp/deoptigate/examples/html-inline/adders.html",
		line: 98,
		column: 33,
		severity: 3,
		updates: [
			{
				type: "LoadIC",
				oldState: "unintialized",
				newState: "monomorphic",
				key: "x",
				map: "0x14cd08283fc9",
				optimizationState: "optimizable",
				severity: 1,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "monomorphic",
				newState: "polymorphic",
				key: "x",
				map: "0x14cd08284091",
				optimizationState: "optimizable",
				severity: 2,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "polymorphic",
				newState: "megamorphic",
				key: "x",
				map: "0x14cd08284361",
				optimizationState: "optimizable",
				severity: 3,
				modifier: "",
				slowReason: "",
			},
		],
	});

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "26",
		functionName: "addObjects",
		file: "file:///tmp/deoptigate/examples/html-inline/adders.html",
		line: 142,
		column: 34,
		severity: 3,
		updates: [
			{
				timestamp: 645553,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "2",
		functionName: "addNumbers",
		file: "file:///tmp/deoptigate/examples/html-inline/adders.html",
		line: 85,
		column: 26,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 235580,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 280422,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(html-external.v8.log)", async (t) => {
	const logFileName = "html-external.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(t, "Matching ICS Entry", result.ics, {
		type: "ics",
		id: "20",
		functionName: "addAny",
		file: "file:///tmp/deoptigate/examples/html-external/adders.js",
		line: 38,
		column: 27,
		severity: 3,
		updates: [
			{
				type: "LoadIC",
				oldState: "unintialized",
				newState: "monomorphic",
				key: "x",
				map: "0x420708283f51",
				optimizationState: "optimizable",
				severity: 1,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "monomorphic",
				newState: "polymorphic",
				key: "x",
				map: "0x420708284019",
				optimizationState: "optimizable",
				severity: 2,
				modifier: "",
				slowReason: "",
			},
			{
				type: "LoadIC",
				oldState: "polymorphic",
				newState: "megamorphic",
				key: "x",
				map: "0x4207082842e9",
				optimizationState: "optimizable",
				severity: 3,
				modifier: "",
				slowReason: "",
			},
		],
	});

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "27",
		functionName: "addObjects",
		file: "file:///tmp/deoptigate/examples/html-external/adders.js",
		line: 82,
		column: 28,
		severity: 3,
		updates: [
			{
				timestamp: 322375,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "4",
		functionName: "addNumbers",
		file: "file:///tmp/deoptigate/examples/html-external/adders.js",
		line: 25,
		column: 20,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 62089,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 72774,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(adders.v8.log, keepInternals)", async (t) => {
	const logFileName = "adders.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 253, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 182, "Number of ics");
});

test("runParser(two-modules.v8.log, keepInternals)", async (t) => {
	const logFileName = "two-modules.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 254, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 187, "Number of ics");
});

test("runParser(html-inline.v8.log, keepInternals)", async (t) => {
	const logFileName = "html-inline.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 15, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");
});

test("runParser(html-external.v8.log, keepInternals)", async (t) => {
	const logFileName = "html-external.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");
});
