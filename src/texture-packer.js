const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const { promisify } = require("util");
const binPack = require("./bin-pack");
const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);

const computeMainImage = async (width, height, blocks, config) => {
	const { folder } = config;
	const list = await Promise.all(
		blocks.map(async (block) => {
			let input = path.resolve(process.cwd(), folder, block.name);
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
	config.logger.log("Processing images...");
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
			config.logger.log(
				`Processed: ${Math.round(
					(100 * (images += pack.length)) / list.length
				)}%`
			);
		}
	}
	return sharp(buff).toBuffer();
};

const packageJson = require("../package.json");

const computeAtlasJson = (width, height, blocks, config) => {
	const { fileName, prettify } = config;
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
	const regex = /^([^\.]+[^\.\d])(\d+)x(\d+)\.[^\.]+$/;
	const spriteData = blocks.reduce((res, block) => {
		const blockW = block.width;
		const blockH = block.height;
		let name = block.name;
		if (block.atlas) {
			const { i, j, m } = block.atlas;
			const matches = regex.exec(block.name);
			const index = m * j + i;
			const [, animationName] = matches;
			name = `${animationName}_${index > 8 ? index + 1 : `0${index + 1}`}.png`;
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

const ATLAS_REGEX = /^[^\.]+[^\.\d](\d+)x(\d+)\.[^\.]+$/;
const loadImageBlocks = async (files, config) => {
	const { folder } = config;
	const baseBlocks = await Promise.all(
		files.map(async (file) => {
			const { width, height } = await sharp(
				path.resolve(process.cwd(), folder, file)
			).metadata();
			const block = { width, height, name: file };
			if (ATLAS_REGEX.test(file)) {
				const [, columns, rows] = ATLAS_REGEX.exec(file);
				const n = parseInt(columns);
				const m = parseInt(rows);
				block.atlas = { n, m, w: width / n, h: height / m };
			}
			return block;
		})
	);

	const blocks = baseBlocks.reduce((list, item) => {
		if (item.atlas) {
			const { n, m, w, h } = item.atlas;
			for (let j = 0; j < m; j++) {
				for (let i = 0; i < n; i++) {
					list.push({
						width: w,
						height: h,
						name: item.name,
						atlas: { i, j, n, m }
					});
				}
			}
		} else {
			list.push(item);
		}
		return list;
	}, []);
	return blocks;
};

const DEFAULT_CONFIG = {
	fileName: "spritesheet",
	prettify: false,
	spacing: 1,
	log: false,
	maxWidth: 1024,
	maxHeight: 1024,
	smart: true,
	pot: true,
	square: true
};
const fakeLogger = {
	log: () => 0,
	writeFiles: true
};

const IMAGES_REGEX = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
const pack = async (config) => {
	if (!config.folder) {
		throw new Error("Target folder must be specified");
	}
	config = Object.assign(
		DEFAULT_CONFIG,
		Object.entries(config).reduce(
			(res, [key, value]) =>
				value !== undefined ? { ...res, [key]: value } : res,
			{}
		),
		{ logger: config.log ? console : fakeLogger }
	);
	if (!config.output) {
		config.output = process.cwd();
	} else {
		config.output = path.resolve(process.cwd(), config.output);
	}
	const { folder, spacing, logger, maxWidth, maxHeight, smart, pot, square } =
		config;
	const imagesFolder = path.resolve(process.cwd(), folder);
	logger.log("Loading images...");
	// Read all image files in folder
	const files = await readdir(imagesFolder);
	const images = files.filter((file) => IMAGES_REGEX.test(file));
	if (!images.length) {
		throw new Error(`No images found in ${imagesFolder}`);
	}
	// Load image sizes
	const blocks = await loadImageBlocks(images, config);
	// logger.log("blocks: ", blocks);
	// Pack blocks
	logger.log("Packing rectangles...");
	const binPackOptions = {
		padding: spacing,
		maxWidth,
		maxHeight,
		smart,
		pot,
		square
	};
	const bin = binPack(blocks, binPackOptions);
	logger.log("Processing output...");
	// Write image and json file
	const [imageBuffer, atlasJson] = await Promise.all([
		computeMainImage(bin.width, bin.height, bin.rects, config),
		computeAtlasJson(bin.width, bin.height, bin.rects, config)
	]);
	const { writeFiles, output, fileName } = config;
	if (writeFiles) {
		logger.log("Writing main image...");
		await Promise.all([
			writeFile(path.resolve(output, `${fileName}.png`), imageBuffer),
			writeFile(path.resolve(output, `${fileName}.json`), atlasJson)
		]);
		logger.log("Packed");
	} else {
		logger.log("Packed");
		return {
			image: imageBuffer,
			atlas: atlasJson
		};
	}
};

module.exports = pack;
