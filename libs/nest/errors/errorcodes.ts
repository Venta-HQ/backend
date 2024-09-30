const ERROR_OBJECTS = {
	'API-00001': {
		message: 'There was a problem with your request',
		status: 500,
	},
	'API-00002': {
		message: 'There was a problem with your upload: ${message}',
		status: 400,
	},
	'API-00003': {
		message: 'Could not find entity: ${entity}',
		status: 404,
	},
	'API-00004': {
		message: 'Invalid request: ${message}',
		status: 400,
	},
};

export default ERROR_OBJECTS;

function createEnum<T extends Record<string, any>>(obj: T): { [K in keyof T]: K } {
	return Object.keys(obj).reduce(
		(acc, key) => {
			acc[key as keyof T] = key as keyof T; // Cast key to the appropriate type
			return acc;
		},
		{} as { [K in keyof T]: K },
	);
}

export const ERROR_CODES = createEnum(ERROR_OBJECTS);
