import fs from "fs";
import zlib from "zlib";
import sade from "sade";

/**
 * @param {string} inputPath
 * @param {{ quality?: number }} opts
 */
async function run(inputPath, opts) {
	let output, brotli;
	if (inputPath.endsWith(".br")) {
		output = fs.createWriteStream(inputPath.replace(/.br$/, ""));
		brotli = zlib.createBrotliDecompress();
	} else {
		let quality;
		if (opts.quality < zlib.constants.BROTLI_MIN_QUALITY) {
			throw new Error(
				`Passed in quality value (${opts.quality}) is less than the min brotli quality allowed (${zlib.constants.BROTLI_MIN_QUALITY})`
			);
		} else if (opts.quality > zlib.constants.BROTLI_MAX_QUALITY) {
			throw new Error(
				`Passed in quality value (${opts.quality}) is grater than the max brotli quality allowed (${zlib.constants.BROTLI_MAX_QUALITY})`
			);
		} else {
			quality = opts.quality;
		}

		output = fs.createWriteStream(inputPath + ".br");
		brotli = zlib.createBrotliCompress({
			params: {
				[zlib.constants.BROTLI_PARAM_QUALITY]: quality,
			},
		});
	}

	fs.createReadStream(inputPath).pipe(brotli).pipe(output);
}

sade("brotli <file>", true)
	.describe("Compress a text file or decompress a brotli (.br) file")
	.option(
		"-q --quality",
		"Quality of compression. Must be between NodeJS's zlib.constants.BROTLI_MIN_QUALITY and zlib.constants.BROTLI_MAX_QUALITY. Default is MAX_QUALITY.  (default 11)",
		zlib.constants.BROTLI_MAX_QUALITY
	)
	.example("compressed.txt.br")
	.example("plain_text.txt -q 9")
	.action(run)
	.parse(process.argv);
