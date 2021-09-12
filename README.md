<h1 align="center"> Texturepacker </h1>
<p align="center">
  <b>Utility for packing a folder of images to an atlas texture</b>
</p>
<br>

![version](https://img.shields.io/npm/v/texturepacker)
![node](https://img.shields.io/node/v/texturepacker)
## Setup
- Install [Node.js](https://nodejs.org/) 
- Navigate to your project root and run:

```sh
$ npm install texturepacker
```
- Or install globally from anywhere:
```sh
$ npm install texturepacker -g
```
This package uses [sharp](https://www.npmjs.com/package/sharp) to manipulate images, which downloads its own binaries on install, so it does not need any external binary like [ImageMagick](https://www.imagemagick.org/).

## Usage

```
texturepacker images-folder
```

Takes all images in specified folder `images-folder` and outputs two files:

- atlas.png
- atlas.json

Which is a standard texture atlas format. The specification was tested to work with [`Phaser`](https://phaser.io/).

It can also be used programmatically:

```javascript
const { texturepacker } = require("./texture-packer");

texturepacker({
	folder: "images",
	prettify: true,
	packOptions: {
		maxWidth: 2048,
		maxHeight: 2048
	}
})
	.then(() => console.log("Pack successful"))
	.catch(console.error);
```

It returns a promise which resolves when packing is completed, or rejects if an error occurred.

## Animations

It's also able to create animations from single images. It works using a naming convention: a filename like _explosion-sprite`5x4`.png_ would by cut in `5 columns` and `4 rows` and output an animation of `5x4=20` frames. The frames are placed riw by row in left-to-right order.

It works on any image file in the target folder which respects this regex `^([^\.]+[^\.\d])(\d+)x(\d+)(\.[^\.]+)$`.

## Raw Packer

The raw packer that accepts a list of file paths and resolves to an object with the atlas json and the image buffer is also exposed:

```javascript
const { rawPacker } = require("./texture-packer");

rawPacker(
	[
		"images/img1.png", 
		"images/img2.png", 
		"images/animation2x2.png"
	],
	options
).then(({ image, atlas }) => {
	console.log("packed: ", image, atlas);
});
```
This accepts the same options, except for `folder` and `outputFolder`.

## Options

- `folder`: [**required**] folder with images to pack (relative to _process.cwd()_)
- `fileName`: specify output file name (without extension, default 'atlas')
- `prettify`: whether to prettify the json output file (default false)
- `outFolder`: name of the folder where the output files would be written
- `log`: whether to log the process (default true in cli usage, false in programmatic usage)
- `packOptions`: options for the binpacking of the textures.
  Details below (defaults to the default values of the pack options).

## Pack options:
### See also the documentation of [maxrect-packer](https://www.npmjs.com/package/maxrects-packer)

- `maxWidth`: max width of result image (default 1024),
- `maxHeight`: max height of result image (default 1024),
- `smart`: whether to generate the smallest possible size within limits (default true),
- `pot`: whether to generate only power of 2 sized output image (default true),
- `square`: whether to force a square output image (default true)
- `padding`: padding in pixels around images, useful to avoid artifacts (default 1)
