import { status } from '@grpc/grpc-js';
import { WsException } from '@nestjs/websockets';
import ERROR_OBJECT, { ERROR_CODES } from '../errorcodes';

export class WsError extends WsException {
	readonly code;
	readonly data;
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
				message: 'An unknown error occured',
			});
		} else {
			const { message } = ERROR_OBJECT[code];
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
				code: code,
				data: data ?? null,
				message: overrideMessage ? overrideMessage : `[${code}] ${_message}`,
			});
		}
		this.code = code;
		this.data = data;
	}
}
