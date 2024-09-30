import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import ERROR_OBJECT, { ERROR_CODES } from '../errorcodes';

export class GrpcError extends RpcException {
	readonly code;
	readonly errorCode;
	constructor(code: keyof typeof ERROR_CODES, params?: Record<string, any>) {
		if (!Object.keys(ERROR_OBJECT).includes(code)) {
			super({
				code: status.UNKNOWN,
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
				errorCode: code,
				message: `[${code}] ${_message}`,
			});
		}
		this.code = code;
		this.errorCode = ERROR_OBJECT[code]['grpcCode'];
	}
}
