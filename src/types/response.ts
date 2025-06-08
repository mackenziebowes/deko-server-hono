export type SuccessResponse = {
	ok: true;
	msg: string;
};

export type FailResponse = {
	ok: false;
	err: string;
};

export type GeneralApiResponse = SuccessResponse | FailResponse;

export type JWTResponse =
	| (SuccessResponse & {
			token: string;
	  })
	| FailResponse;
