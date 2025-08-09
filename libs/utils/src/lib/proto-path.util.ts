import { join } from 'path';

export class ProtoPathUtil {
	static resolveProtoPath(proto: string): string {
		return join(__dirname, '..', 'definitions', proto);
	}

	static resolveFromDirname(dirname: string, protoPath: string): string {
		return join(dirname, protoPath);
	}
}
