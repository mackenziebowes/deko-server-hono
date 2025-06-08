import type { ENVExport } from "~/types/env";

const CORS_ORIGIN = () => {
	val = Bun.env.CORS_ORIGIN;
	if (!val) throw "CORS_ORIGIN not set";
	return val;
};

let val: string | undefined = undefined;

const init = () => {
	env.val = Bun.env.CORS_ORIGIN;
	if (!env.val) throw "CORS_ORIGIN not set";
};

const env: ENVExport = {
	get: CORS_ORIGIN,
	val,
	init,
};

export default env;
