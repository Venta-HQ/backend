import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import ERROR_OBJECT, { ERROR_CODES } from '../errorcodes';

export class GrpcError extends RpcException {
	readonly code;
	readonly data;
	readonly errorCode;
	constructor(
		code: keyof typeof ERROR_CODES,
		params?: Record<string, any>,
		overrideMessage?: string,
		data?: { [K: string]: any },
	) {
		if (!Object.keys(ERROR_OBJECT).includes(code)) {
			super({
				code: status.UNKNOWN,
				data: data ?? null,
				errorCode: '',
				message: 'An unknown error occured',
			});
		} else {
			const { grpcCode, message } = ERROR_OBJECT[code];
			let _message = message;
			if (params) {
				Object.keys(params).forEach((key) => {
					let val = params[key];
					if (val === null) {
						val = 'null';
					} else if (val === undefined) {
						val = 'undefined';
					}

					_message = _message.replace(new RegExp('\\$\\{' + key + '\\}', 'g'), val);
				});
			}

			super({
				code: grpcCode,
				data: data ?? null,
				errorCode: code,
				message: overrideMessage ? overrideMessage : `[${code}] ${_message}`,
			});
		}
		this.code = code;
		this.data = data;
		this.errorCode = ERROR_OBJECT[code]['grpcCode'];
	}
}
