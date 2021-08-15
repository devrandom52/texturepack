<h1 align="center"> Texturepacker </h1>
<p align="center">
  <b>Utility for packing a folder of images to an atlas texture</b>
</p>
<br>

## Usage
```
texturepacker images-folder
```
Takes all images in specified folder `images-folder` and outputs two files:
- spritesheet.png
- spritesheet.json

Which is a standard texture atlas format.

It can also be used programmatically:

```javascript
const texturepacker = require('./texture-packer');

texturepacker({ 
  folder: 'images', 
  prettify: true
}).then(() => console.log('Pack successful'))
  .catch(console.error);
```
It returns a promise which resolves when packing is completed, or rejects if an error occurred.

It's also able to create animations from single images. It works using a naming convention: a filename like explosion-sprite`5x6` would by cut in `5 columns` and `4 rows` and output an animation of 5x6=`30 frames`.
It works on any image file in the target folder which respects this regex `^[^\.]+[^\.\d](\d+)x(\d+)\.[^\.]+$`.

## Options
- `folder`: [**required**] folder with images to pack (relative to *process.cwd()*)
- `fileName`: specify output file name (without extension, default 'spritesheet')
- `prettify`: whether to prettify the json output file (default false)
- `spacing`: padding around images, useful to avoid artifacts (default 1)
- `log`: whether to log the process (default true in cli usage, false in programmatic usage)
- `maxWidth`: max width of result image (default 1024), 
- `maxHeight`: max height of result image (default 1024),
- `smart`: whether to generate the smallest possible size within limits (default true),
- `pot`: whether to generate only power of 2 sized output image (default true),
- `square`: whether to force a square output image (default true)