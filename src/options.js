const {
	object,
	integer,
	boolean,
	string,
	defaulted,
	refine,
	create,
	assign,
	assert
} = require("superstruct");

const PositiveInteger = refine(integer(), "positive", (value) => value > 0);
const BinPackOptions = object({
	maxWidth: defaulted(PositiveInteger, 1024),
	maxHeight: defaulted(PositiveInteger, 1024),
	smart: defaulted(boolean(), true),
	pot: defaulted(boolean(), true),
	square: defaulted(boolean(), true),
	padding: defaulted(PositiveInteger, 1)
});

const RawPackerOptions = object({
	fileName: defaulted(string(), "atlas"),
	prettify: defaulted(boolean(), false),
	log: defaulted(boolean(), true),
	packOptions: defaulted(BinPackOptions, create({}, BinPackOptions))
});

const PackerOptions = assign(
	object({
		folder: string(),
		outFolder: defaulted(string(), process.cwd())
	}),
	RawPackerOptions
);

const validateOptions = (options, schema) => {
	try {
		const defaultedOptions = create(options, schema);
		assert(defaultedOptions, schema);
		return defaultedOptions;
	} catch (e) {
		const { key, value, type } = e;
		let error;
		if (value === undefined) {
			error = new Error(`Option ${key} is required`);
		} else if (type === "never") {
			error = new Error(`Option ${key} unknown`);
		} else {
			error = new Error(
				`Option ${key} invalid value ${value}, expected ${type}`
			);
			error.value = value;
		}
		error.attribute = key;
		throw error;
	}
};

module.exports = {
	PackerOptions,
	RawPackerOptions,
	BinPackOptions,
	validateOptions
};
