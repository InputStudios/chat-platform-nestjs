import { HttpStatus, HttpException } from "@nestjs/common";

export class FriendRequestException extends HttpException {
	constructor(msg?: string) {
		const defaultMessage = 'Frriend Request Exception';
		const error = msg ? defaultMessage.concat(': ', msg) : defaultMessage;
		super(error,  HttpStatus.BAD_REQUEST);
	}
}
