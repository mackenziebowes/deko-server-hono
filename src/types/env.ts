export type ENVVal = string | undefined;
export interface ENVExport {
	val: ENVVal;
	get: () => string;
	init: () => void;
}
