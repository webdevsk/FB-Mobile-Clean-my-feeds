/**
 * Manages whitelisted filters storage. Stores in userscript manager storage.
 */
export class WhitelistedFiltersStorage {
	/**
	 * The storage key for the whitelisted filters.
	 */
	storageKey: string = "whitelisted-filters"
	/**
	 * The default value for the whitelisted filters.
	 */
	defaultValue: string[] = []
	/**
	 * The cache for the whitelisted filters.
	 */
	cache: string[] = []
	/**
	 * The singleton instance of WhitelistedFiltersStorage.
	 */
	static instance: WhitelistedFiltersStorage | null = null

	private constructor() {
		this.cache = this.fetch()
	}
	/**
	 * Gets the singleton instance of WhitelistedFiltersStorage.
	 * Creates a new instance if one doesn't exist.
	 *
	 * @returns {WhitelistedFiltersStorage} The singleton WhitelistedFiltersStorage instance
	 */
	public static getInstance(): WhitelistedFiltersStorage {
		if (!WhitelistedFiltersStorage.instance) {
			WhitelistedFiltersStorage.instance = new WhitelistedFiltersStorage()
		}
		return WhitelistedFiltersStorage.instance
	}

	private fetch(): string[] {
		const untrustedValue = GM_getValue<string[]>(
			this.storageKey,
			this.defaultValue,
		)
		return Array.isArray(untrustedValue) &&
			untrustedValue.every(val => typeof val === "string")
			? untrustedValue
			: this.defaultValue
	}
	/**
	 * Gets the whitelisted filters from storage.
	 * @returns {string[]} The whitelisted filters
	 */
	public get(): string[] {
		return this.cache
	}
	/**
	 * Sets the whitelisted filters in storage.
	 * @param {string[]} filters - The whitelisted filters to set
	 */
	public set(filters: string[]) {
		GM_setValue(this.storageKey, filters)
		this.cache = this.fetch()
	}
}
