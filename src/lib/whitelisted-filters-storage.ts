import { devMode } from "@/config"

/**
 * Manages whitelisted filters storage. Stores in userscript manager storage.
 */
export class WhitelistedFiltersStorage {
	/**
	 * The storage key for the whitelisted filters.
	 */
	storageKey: string = "whitelisted-filters"
	listenerId: string | null = null
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

	public register(): () => void {
		const initialValue = GM_getValue(this.storageKey, this.defaultValue)
		this.update(initialValue)
		if (devMode) console.log("WhitelistedFiltersStorage register successful")

		return this.onChange()
	}

	private update(value: unknown): void {
		if (Array.isArray(value) && value.every(val => typeof val === "string")) {
			this.cache = value
		} else {
			this.cache = this.defaultValue
			this.set(this.defaultValue)
		}
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
		if (devMode) console.log("Set new filters", filters)
		GM_setValue(this.storageKey, filters)
	}

	public onChange(cb?: (newValue: string[]) => void): () => void {
		this.listenerId = GM_addValueChangeListener(
			this.storageKey,
			(_name, _oldValue, newValue, _remote) => {
				if (devMode) console.log("New filter value", newValue)
				this.update(newValue)
				cb?.(this.get())
			}
		)
		return () => {
			if (this.listenerId) GM_removeValueChangeListener(this.listenerId)
		}
	}
}
