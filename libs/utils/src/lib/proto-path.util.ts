import * as fs from 'fs';
import { join } from 'path';

export class ProtoPathUtil {
	static resolveProtoPath(proto: string): string {
		// Check if we're running compiled code (proto files copied via nest-cli.json assets)
		const distProtoPath = join(__dirname, '..', '..', '..', '..', 'proto', 'src', 'definitions', proto);
		const developmentPath = join(process.cwd(), 'libs', 'proto', 'src', 'definitions', proto);

		// Try dist path first (for compiled apps), fall back to development
		if (fs.existsSync(distProtoPath)) {
			return distProtoPath;
		}

		return developmentPath;
	}

	static resolveFromDirname(dirname: string, protoPath: string): string {
		return join(dirname, protoPath);
	}

	static getProtoRoot(): string {
		// Check if we're running compiled code (proto files copied via nest-cli.json assets)
		const distProtoRoot = join(__dirname, '..', '..', '..', '..', 'proto', 'src', 'definitions');
		const developmentProtoRoot = join(process.cwd(), 'libs', 'proto', 'src', 'definitions');

		// Try dist path first (for compiled apps), fall back to development
		if (fs.existsSync(distProtoRoot)) {
			return distProtoRoot;
		}

		return developmentProtoRoot;
	}
}
