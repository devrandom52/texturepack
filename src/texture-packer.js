const path = require("path");
const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const rawPacker = require("./raw-packer");
const { PackerOptions, validateOptions } = require("./options");

const IMAGES_REGEX = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;

const texturePacker = async (inputOptions) => {
	const options = validateOptions(inputOptions, PackerOptions);
	const { folder: imagesFolder, outFolder, ...rawPackerOptions } = options;
	const { log, fileName } = rawPackerOptions;
	const logger = log ? console : { log: () => {} };
	logger.log(`Loading images from folder ${imagesFolder}...`);
	const files = await readdir(path.join(process.cwd(), imagesFolder));
	const images = files.filter((file) => IMAGES_REGEX.test(file));
	if (!images.length) {
		throw new Error(`No images found in ${imagesFolder}`);
	}
	const filePaths = images.map((file) =>
		path.join(process.cwd(), imagesFolder, file)
	);
	const { image, atlas } = await rawPacker(filePaths, rawPackerOptions);
	logger.log("Writing image and json output...");
	await mkdir(outFolder, { recursive: true });
	await Promise.all([
		writeFile(path.resolve(outFolder, `${fileName}.png`), image),
		writeFile(path.resolve(outFolder, `${fileName}.json`), atlas)
	]);
	logger.log("Packed");
};

module.exports = texturePacker;
