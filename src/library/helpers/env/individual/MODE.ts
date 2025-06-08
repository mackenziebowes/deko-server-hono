import type { ENVExport } from "~/types/env";

const MODE = () => {
	val = Bun.env.MODE;
	if (!val) throw "MODE not set";
	return val;
};

let val: string | undefined = undefined;

const init = () => {
	env.val = Bun.env.MODE;
	if (!env.val) throw "MODE not set";
};

const env: ENVExport = {
	get: MODE,
	val,
	init,
};

export default env;
