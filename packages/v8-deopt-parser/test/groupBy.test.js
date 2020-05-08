import test from "tape";
import { groupByFile, groupByFileAndLocation } from "../src/index.js";
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

test("groupByFileAndLocation(adders.v8.log)", async (t) => {
	const rawData = await runParser(t, "adders.v8.log");
	const result = groupByFileAndLocation(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 1, "Number of files");

	const locations = Object.keys(result[files[0]]);
	t.equal(locations.length, 55, "Number of locations");

	const fileData = result[files[0]];

	let location = "addAny:93:27";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 1, `${location} ics count`);

	location = "addObjects:137:28";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);

	location = "addNumbers:80:20";
	t.equal(fileData[location].codes.length, 1, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 0, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);
});

test("groupByFileAndLocation(two-modules.v8.log)", async (t) => {
	const rawData = await runParser(t, "two-modules.v8.log");
	const result = groupByFileAndLocation(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 2, "Number of files");

	const locations1 = Object.keys(result[files[0]]);
	const locations2 = Object.keys(result[files[1]]);
	t.equal(locations1.length, 22, "File 1: number of locations");
	t.equal(locations2.length, 33, "File 2: number of locations");

	const fileData = result[files[0]];

	let location = "addAny:38:27";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 1, `${location} ics count`);

	location = "addObjects:82:28";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);

	location = "addNumbers:25:20";
	t.equal(fileData[location].codes.length, 1, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 0, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);
});

test("groupByFileAndLocation(html-inline.v8.log)", async (t) => {
	const rawData = await runParser(t, "html-inline.v8.log");
	const result = groupByFileAndLocation(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 1, "Number of files");

	const locations = Object.keys(result[files[0]]);
	t.equal(locations.length, 53, "Number of locations");

	const fileData = result[files[0]];

	let location = "addAny:98:33";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 1, `${location} ics count`);

	location = "addObjects:142:34";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);

	location = "addNumbers:85:26";
	t.equal(fileData[location].codes.length, 1, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 0, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);
});

test("groupByFileAndLocation(html-external.v8.log)", async (t) => {
	const rawData = await runParser(t, "two-modules.v8.log");
	const result = groupByFileAndLocation(rawData);

	const files = Object.keys(result);
	t.equal(files.length, 2, "Number of files");

	const locations1 = Object.keys(result[files[0]]);
	const locations2 = Object.keys(result[files[1]]);
	t.equal(locations1.length, 22, "File 1: number of locations");
	t.equal(locations2.length, 33, "File 2: number of locations");

	const fileData = result[files[0]];

	let location = "addAny:38:27";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 1, `${location} ics count`);

	location = "addObjects:82:28";
	t.equal(fileData[location].codes.length, 0, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 1, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);

	location = "addNumbers:25:20";
	t.equal(fileData[location].codes.length, 1, `${location} codes count`);
	t.equal(fileData[location].deopts.length, 0, `${location} deopts count`);
	t.equal(fileData[location].ics.length, 0, `${location} ics count`);
});
