const { MaxRectsPacker } = require("maxrects-packer");

const binPack = (input, customOptions) => {
  const { padding } = customOptions;
  const options = {
    smart: true,
    pot: true,
    square: true,
    allowRotation: false,
    tag: false,
    border: 0
  }; // Set packing options
  const packer = new MaxRectsPacker(1024, 1024, padding, options); // width, height, padding, options
  
  packer.addArray(input);
  const bin = packer.bins[0];
  return bin;
}

module.exports = binPack;