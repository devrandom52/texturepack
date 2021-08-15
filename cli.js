#!/usr/bin/env node
const texturepacker = require('./src/index');
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(`Usage: texturepacker folder [--fileName=fileName] [--spacing=spacing] [--prettify] [--log]`);
  process.exit(1);
}

const [folder, ...options] = args;
const argsConfig = {
  fileName: 'string',
  prettify: 'boolean',
  log: 'boolean',
  spacing: 'number'
};
const allowedOptions = Object.keys(argsConfig);
const validOptions = options.filter(opt => opt.startsWith('--') && allowedOptions.includes(opt.substring(2).split('=')[0]));
const parsedOptions = validOptions.reduce((res, optString) => {
  const [key, value] = optString.substring(2).split('=');
  const type = argsConfig[key];
  let optValue;
  switch (type) {
    case 'boolean':
      optValue = value !== 'false';
      break;
    case 'number':
      optValue = isNaN(value) ? undefined : Number(value);
      break;
    default:
      optValue = value || undefined;
  }
  if (optValue !== undefined) {
    return { ...res, [key]: optValue };
  }
  return res;
}, {});

texturepacker({ ...parsedOptions, log: parsedOptions.log === false ? false : true, folder, writeFiles: true }).catch(err => {
  if (Array.isArray(err)) {
    err.forEach(err => console.error(err.stack || err.message));
  } else {
    console.error(`An error has occurred.`);
    console.error(err.stack || err.message);
  }
  process.exit(1);
});