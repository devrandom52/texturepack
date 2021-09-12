const path = require("path");
const fs = require("fs");
const util = require("util");
const sharp = require("sharp");
const binPack = require("./bin-pack");
const { RawPackerOptions, validateOptions } = require("./options");

const ATLAS_REGEX = /^[^\.]+[^\.\d](\d+)x(\d+)\.[^\.]+$/;
const filePathToBlocks = async (filePath) => {
	const { width, height } = await sharp(filePath).metadata();
	const fileName = path.basename(filePath);
	const block = { width, height, file: filePath };
	if (ATLAS_REGEX.test(fileName)) {
		const [, columns, rows] = ATLAS_REGEX.exec(fileName);
		const n = parseInt(columns);
		const m = parseInt(rows);
		const w = width / n;
		const h = height / m;
		const blocks = [];
		for (let j = 0; j < m; j++) {
			for (let i = 0; i < n; i++) {
				blocks.push({
					width: w,
					height: h,
					file: filePath,
					atlas: { i, j, n, m }
				});
			}
		}
		return blocks;
	}
	return [block];
};

const computeMainImage = async (width, height, blocks, logger) => {
	const list = await Promise.all(
		blocks.map(async (block) => {
			let input = block.file;
			if (block.atlas) {
				const { i, j } = block.atlas;
				const blockW = block.width;
				const blockH = block.height;
				const sharpObjfer = await sharp(input)
					.extract({
						left: i * blockW,
						top: j * blockH,
						width: blockW,
						height: blockH
					})
					.toBuffer();
				input = sharpObjfer;
			}
			return {
				left: block.x,
				top: block.y,
				input
			};
		})
	);
	logger.log("Processing images...");
	const maxSize = 100;
	const packsNum = Math.ceil(list.length / maxSize);
	const packs = new Array(packsNum);
	for (let i = 0; i < packsNum; i++) {
		packs[i] = list.slice(
			i * maxSize,
			Math.min((i + 1) * maxSize, list.length)
		);
	}

	let buff = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.png()
		.toBuffer();

	let images = 0;
	while (packs.length) {
		const pack = packs.pop();
		buff = await sharp(buff).composite(pack).png().toBuffer();
		if (packs.length > 1) {
			logger.log(
				`Processed: ${Math.round(
					(100 * (images += pack.length)) / list.length
				)}%`
			);
		}
	}
	return sharp(buff).toBuffer();
};

const packageJson = require("../package.json");

const ANIMATION_REGEX = /^([^\.]+[^\.\d])(\d+)x(\d+)(\.[^\.]+)$/;
const computeAtlasJson = (width, height, blocks, options) => {
	const { fileName, prettify } = options;
	const data = {
		meta: {
			app: packageJson.name,
			version: packageJson.version,
			image: `${fileName}.png`,
			format: "RGBA8888",
			size: { w: width, h: height },
			scale: "1"
		}
	};
	const spriteData = blocks.reduce((res, block) => {
		const blockW = block.width;
		const blockH = block.height;
		let name = path.basename(block.file);
		if (block.atlas) {
			const { i, j, m, n } = block.atlas;
			const matches = ANIMATION_REGEX.exec(name);
			const index = m * j + i;
			const [, imageName, , , extension] = matches;
			const animationName = `${imageName}${extension}`;
			const maxIndex = m * n - 1;
			const digits = Math.floor(Math.log10(maxIndex)) + 1;
			name = `${animationName}${`${index}`.padStart(digits, "0")}`;
			if (!data.animations) {
				data.animations = {};
			}
			if (!data.animations[animationName]) {
				data.animations = { ...data.animations, [animationName]: [name] };
			} else {
				data.animations[animationName].push(name);
				data.animations[animationName].sort();
			}
		}
		res[name] = {
			frame: { x: block.x, y: block.y, w: blockW, h: blockH },
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: blockW, h: blockH },
			sourceSize: { w: blockW, h: blockH },
			anchor: { x: 0.5, y: 0.5 }
		};
		return res;
	}, {});
	data.frames = spriteData;
	const content = prettify
		? JSON.stringify(data, null, 2)
		: JSON.stringify(data);
	return content;
};

const packTextures = async (filePaths, inputOptions) => {
	const options = validateOptions(inputOptions, RawPackerOptions);
	const { packOptions, writeFiles, outFolder, fileName, log } = options;
	const logger = log ? console : { log: () => {} };
	const blocks = (await Promise.all(filePaths.map(filePathToBlocks))).flat();
	logger.log("Packing...");
	const bins = binPack(blocks, packOptions);
	if (bins.length > 1) {
		throw new Error(
			"Cannot fit all images in one texture with current options!"
		);
	}
	const bin = bins[0];

	const [imageBuffer, atlasJson] = await Promise.all([
		computeMainImage(bin.width, bin.height, bin.rects, logger),
		computeAtlasJson(bin.width, bin.height, bin.rects, options)
	]);

	return {
		image: imageBuffer,
		atlas: atlasJson
	};
};

module.exports = packTextures;
