import { HttpException } from '@nestjs/common';
import { ErrorCodes } from '../errorcodes';

export class HttpError extends HttpException {
	private data;
	constructor(
		code: keyof typeof ErrorCodes,
		params?: Record<string, any>,
		overrideMessage?: string,
		data?: { [K: string]: any },
	) {
		if (!Object.keys(ErrorCodes).includes(code)) {
			super(
				{
					data: data ?? null,
					message: 'An unknown error occurred',
				},
				500,
			);
		} else {
			const message = ErrorCodes[code];
			let _message: string = message;
			if (params) {
				Object.keys(params).forEach((key) => {
					let val = params[key];
					if (val === null) {
						val = 'null';
					} else if (val === undefined) {
						val = 'undefined';
					}

					_message = _message.replace(new RegExp('\\{' + key + '\\}', 'g'), String(val));
				});
			}

			super(
				{
					code,
					data: data ?? null,
					message: overrideMessage ? overrideMessage : `[${code}] ${_message}`,
				},
				500,
			);
		}
		this.data = data;
	}
}
