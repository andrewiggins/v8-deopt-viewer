import assert from "node:assert";
import test from "node:test";
import { groupByFile } from "../src/index.js";
import { runParser, repoRoot, repoFileURL } from "./helpers.js";

test("groupByFile(adders.v8.log)", async () => {
	const rawData = await runParser("adders.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result.files);
	assert.equal(files.length, 1, "Number of files");

	const fileData = result.files[files[0]];
	assert.equal(fileData.codes.length, 16, "number of codes");
	assert.equal(fileData.deopts.length, 7, "number of deopts");
	assert.equal(fileData.ics.length, 33, "number of ics");
});

test("groupByFile(two-modules.v8.log)", async () => {
	const rawData = await runParser("two-modules.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result.files);
	assert.equal(files.length, 2, "Number of files");

	let fileData = result.files[repoRoot("examples/two-modules/adders.js")];
	assert.equal(fileData.codes.length, 8, "File 1: number of codes");
	assert.equal(fileData.deopts.length, 7, "File 1: number of deopts");
	assert.equal(fileData.ics.length, 8, "File 1: number of ics");

	fileData = result.files[repoRoot("examples/two-modules/objects.js")];
	assert.equal(fileData.codes.length, 8, "File 2: number of codes");
	assert.equal(fileData.deopts.length, 0, "File 2: number of deopts");
	assert.equal(fileData.ics.length, 25, "File 2: number of ics");
});

test("groupByFile(html-inline.v8.log)", async () => {
	const rawData = await runParser("html-inline.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result.files);
	assert.equal(files.length, 1, "Number of files");

	const fileData = result.files[files[0]];
	assert.equal(fileData.codes.length, 15, "number of codes");
	assert.equal(fileData.deopts.length, 6, "number of deopts");
	assert.equal(fileData.ics.length, 33, "number of ics");
});

test("groupByFile(html-external.v8.log)", async () => {
	const rawData = await runParser("html-external.v8.log");
	const result = groupByFile(rawData);

	const files = Object.keys(result.files);
	assert.equal(files.length, 2, "Number of files");

	let fileData = result.files[repoFileURL("examples/html-external/adders.js")];
	assert.equal(fileData.codes.length, 7, "File 1: number of codes");
	assert.equal(fileData.deopts.length, 6, "File 1: number of deopts");
	assert.equal(fileData.ics.length, 8, "File 1: number of ics");

	fileData = result.files[repoFileURL("examples/html-external/objects.js")];
	assert.equal(fileData.codes.length, 9, "File 2: number of codes");
	assert.equal(fileData.deopts.length, 0, "File 2: number of deopts");
	assert.equal(fileData.ics.length, 25, "File 2: number of ics");
});
