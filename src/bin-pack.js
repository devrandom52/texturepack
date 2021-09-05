const { MaxRectsPacker } = require("maxrects-packer");

const binPack = (input, customOptions) => {
	const { padding, maxWidth, maxHeight, smart, pot, square } = customOptions;
	const options = {
		smart,
		pot,
		square,
		allowRotation: false,
		tag: false,
		border: 0
	}; // Set packing options
	const packer = new MaxRectsPacker(maxWidth, maxHeight, padding, options);

	packer.addArray(input);
	const bin = packer.bins[0];
	return bin;
};

module.exports = binPack;
