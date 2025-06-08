import type { ENVExport } from "~/types/env";

let val: string | undefined = undefined;

const init = () => {
	env.val = Bun.env.HASH_KEY;
	if (!env.val) throw "HASH_KEY not set - init";
};

const HASH_KEY = () => {
	val = Bun.env.HASH_KEY;
	if (!val) throw "HASH_KEY not set - dec";
	return val;
};

const env: ENVExport = {
	get: HASH_KEY,
	val,
	init,
};

export default env;
