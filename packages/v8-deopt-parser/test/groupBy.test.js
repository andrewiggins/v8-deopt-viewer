import test from "tape";
import { groupByFile } from "../src/index.js";
import { runParser } from "./helpers.js";

test("groupByFile(adders.v8.log)", async (t) => {
	const rawData = await runParser(t, "adders.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 1, "Number of files");

	const fileData = result[files[0]];
	t.equal(fileData.codes.length, 16, "number of codes");
	t.equal(fileData.deopts.length, 7, "number of deopts");
	t.equal(fileData.ics.length, 33, "number of ics");
});

test("groupByFile(two-modules.v8.log)", async (t) => {
	const rawData = await runParser(t, "two-modules.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 2, "Number of files");

	let fileData = result[files[0]];
	t.equal(fileData.codes.length, 8, "File 1: number of codes");
	t.equal(fileData.deopts.length, 7, "File 1: number of deopts");
	t.equal(fileData.ics.length, 8, "File 1: number of ics");

	fileData = result[files[1]];
	t.equal(fileData.codes.length, 8, "File 2: number of codes");
	t.equal(fileData.deopts.length, 0, "File 2: number of deopts");
	t.equal(fileData.ics.length, 25, "File 2: number of ics");
});

test("groupByFile(html-inline.v8.log)", async (t) => {
	const rawData = await runParser(t, "html-inline.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 1, "Number of files");

	const fileData = result[files[0]];
	t.equal(fileData.codes.length, 15, "number of codes");
	t.equal(fileData.deopts.length, 6, "number of deopts");
	t.equal(fileData.ics.length, 33, "number of ics");
});

test("groupByFile(html-external.v8.log)", async (t) => {
	const rawData = await runParser(t, "html-external.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 2, "Number of files");

	let fileData = result[files[0]];
	t.equal(fileData.codes.length, 7, "File 1: number of codes");
	t.equal(fileData.deopts.length, 6, "File 1: number of deopts");
	t.equal(fileData.ics.length, 8, "File 1: number of ics");

	fileData = result[files[1]];
	t.equal(fileData.codes.length, 9, "File 2: number of codes");
	t.equal(fileData.deopts.length, 0, "File 2: number of deopts");
	t.equal(fileData.ics.length, 25, "File 2: number of ics");
});
