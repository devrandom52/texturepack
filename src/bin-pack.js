const { MaxRectsPacker } = require("maxrects-packer");

const binPack = (input, packOptions) => {
	const { padding, maxWidth, maxHeight, smart, pot, square } = packOptions;
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
	return packer.bins;
};

module.exports = binPack;
