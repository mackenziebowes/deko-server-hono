import type { ENVExport } from "~/types/env";

let val: string | undefined = undefined;

const HASH_IV = () => {
	val = Bun.env.HASH_IV;
	if (!val) throw "HASH_IV not set";
	return val;
};

const init = () => {
	env.val = Bun.env.HASH_IV;
	if (!env.val) throw "HASH_IV not set";
};

const env: ENVExport = {
	get: HASH_IV,
	val,
	init,
};

export default env;
