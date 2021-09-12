#!/usr/bin/env node
const { texturepacker } = require("./src/index");
const args = process.argv.slice(2);

if (args.length < 1) {
	const inline = ([indentedString]) => {
		return indentedString.replace(/(\s+)?\n(\t+)?/g, " ");
	};
	console.error(
		inline`Usage: texturepacker folder 
      [--fileName=fileName] 
      [--outFolder=outFolder]
      [--spacing=spacing]
      [--prettify]
      [--writeFiles]
      [--log]`
	);
	process.exit(1);
}

const [folder, ...options] = args;
const parsedOptions = options
	.filter((opt) => opt.startsWith("--"))
	.reduce((res, optString) => {
		const [optName, optValue] = optString.slice(2).split("=");
		res[optName] = optValue ? (optValue === "false" ? false : optValue) : true;
		return res;
	}, {});

texturepacker({
	...parsedOptions,
	log: parsedOptions.log === false ? false : true,
	folder
}).catch((err) => {
	if (Array.isArray(err)) {
		err.forEach((err) => console.error(err.stack || err.message));
	} else {
		console.error("An error has occurred.");
		console.error(err.stack || err.message);
	}
	process.exit(1);
});
