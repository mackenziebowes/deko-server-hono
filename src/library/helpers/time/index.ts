export function hasExpired(expiresAt: number, now: number): boolean {
	return expiresAt > now;
}
