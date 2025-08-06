import { join } from 'path';

/**
 * Standardized proto file path resolution utility
 * 
 * This utility provides consistent proto file path resolution across the codebase,
 * handling both development and production environments correctly.
 */
export class ProtoPathUtil {
	/**
	 * Resolves a proto file path relative to the proto definitions directory
	 * 
	 * @param protoFileName - The proto file name (e.g., 'user.proto', 'vendor.proto')
	 * @returns The absolute path to the proto file
	 */
	static resolveProtoPath(protoFileName: string): string {
		// In development, use the source path
		if (process.env.NODE_ENV !== 'production') {
			return join(process.cwd(), 'libs/proto/src/definitions', protoFileName);
		}
		
		// In production, use the compiled path
		return join(process.cwd(), 'dist/libs/proto/src/definitions', protoFileName);
	}

	/**
	 * Resolves a proto file path relative to the current working directory
	 * 
	 * @param relativePath - The relative path from the current working directory
	 * @returns The absolute path to the proto file
	 */
	static resolveFromCwd(relativePath: string): string {
		return join(process.cwd(), relativePath);
	}

	/**
	 * Resolves a proto file path relative to __dirname
	 * 
	 * @param dirname - The __dirname value from the calling module
	 * @param relativePath - The relative path from the calling module
	 * @returns The absolute path to the proto file
	 */
	static resolveFromDirname(dirname: string, relativePath: string): string {
		return join(dirname, relativePath);
	}

	/**
	 * Gets the standard proto definitions directory path
	 * 
	 * @returns The absolute path to the proto definitions directory
	 */
	static getProtoDefinitionsDir(): string {
		if (process.env.NODE_ENV !== 'production') {
			return join(process.cwd(), 'libs/proto/src/definitions');
		}
		return join(process.cwd(), 'dist/libs/proto/src/definitions');
	}
} 