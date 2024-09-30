import { status } from '@grpc/grpc-js';

const ERROR_OBJECTS = {
	'API-00001': {
		grpcCode: status.UNKNOWN,
		message: 'There was a problem with your request',
		status: 500,
	},
	'API-00002': {
		grpcCode: status.INVALID_ARGUMENT,
		message: 'There was a problem with your upload: ${message}',
		status: 400,
	},
	'API-00003': {
		grpcCode: status.NOT_FOUND,
		message: 'Could not find entity: ${entity}',
		status: 404,
	},
	'API-00004': {
		grpcCode: status.INVALID_ARGUMENT,
		message: 'Invalid request: ${message}',
		status: 400,
	},
	'API-00005': {
		grpcCode: status.INTERNAL,
		message: 'Could not create entity: ${entity}',
		status: 400,
	},
	'API-00006': {
		grpcCode: status.INTERNAL,
		message: 'Could not update entity: ${entity}',
		status: 400,
	},
	'API-00007': {
		grpcCode: status.INTERNAL,
		message: 'Operation failed: ${operation}',
		status: 500,
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
