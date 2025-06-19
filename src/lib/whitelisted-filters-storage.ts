export class WhitelistedFiltersStorage {
	storageKey: string = "whitelisted-filters"
	defaultValue: string[] = []
	get(): string[] {
		const untrustedValue = GM_getValue<string[]>(
			this.storageKey,
			this.defaultValue,
		)
		return Array.isArray(untrustedValue) &&
			untrustedValue.every(val => typeof val === "string")
			? untrustedValue
			: this.defaultValue
	}
	set(filters: string[]) {
		GM_setValue(this.storageKey, filters)
	}
}
