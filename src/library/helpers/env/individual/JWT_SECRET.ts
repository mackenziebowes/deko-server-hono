import type { ENVExport } from "~/types/env";

const JWT_SECRET = () => {
	val = Bun.env.JWT_SECRET;
	if (!val) throw "JWT_SECRET not set";
	return val;
};

let val: string | undefined = undefined;

const init = () => {
	env.val = Bun.env.JWT_SECRET;
	if (!env.val) throw "JWT_SECRET not set";
};

const env: ENVExport = {
	get: JWT_SECRET,
	val,
	init,
};

export default env;
