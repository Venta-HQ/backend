import { HttpException } from '@nestjs/common';
import ERROR_OBJECT, { ERROR_CODES } from '../errorcodes';

export class HttpError extends HttpException {
	constructor(code: keyof typeof ERROR_CODES, params?: Record<string, any>, overrideMessage?: string) {
		if (!Object.keys(ERROR_OBJECT).includes(code)) {
			super(
				{
					message: 'An unknown error occured',
				},
				500,
			);
		} else {
			const { message, status } = ERROR_OBJECT[code];
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

			super(
				{
					code,
					message: overrideMessage ? overrideMessage : `[${code}] ${_message}`,
				},
				status,
			);
		}
	}
}
