import { devMode } from "@/config"

type FiltersValue = string[]
/**
 * Manages whitelisted filters storage. Stores in userscript manager storage.
 */
export class WhitelistedFiltersStorage {
	/**
	 * The storage key for the whitelisted filters.
	 */
	public storageKey: string = "whitelisted-filters"
	// listenerId: string | null = null
	/**
	 * The default value for the whitelisted filters.
	 */
	private defaultValue: FiltersValue = []
	/**
	 * The cache for the whitelisted filters.
	 */
	private cache: FiltersValue = []
	/**
	 * The singleton instance of WhitelistedFiltersStorage.
	 */
	static instance: WhitelistedFiltersStorage | null = null
	/**
	 * The listeners for the whitelisted filters.
	 */
	private listeners: Set<(value: FiltersValue) => void> = new Set()
	/**
	 * Notifies all listeners of a change to the value.
	 * @param {FiltersValue} newValue - The new value
	 */
	private notifyListeners(newValue: FiltersValue): void {
		for (const listener of this.listeners) listener(newValue)
	}

	constructor() {
		this.cache = GM_getValue(this.storageKey, this.defaultValue)
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

	/**
	 * Gets the whitelisted filters from storage.
	 * @returns {FiltersValue} The whitelisted filters
	 */
	public get(): FiltersValue {
		return this.cache
	}

	/**
	 * Sets the whitelisted filters in storage.
	 * @param {FiltersValue} value - The whitelisted filters to set
	 */
	public set(value: FiltersValue): void {
		if (!Array.isArray(value) || !value.every(val => typeof val === "string")) {
			console.error("Invalid value set for whitelisted filters", value)
			return
		}
		if (devMode) console.log("Set new filters", value)
		GM_setValue(this.storageKey, value)
		this.cache = value
		this.notifyListeners(value)
	}

	/**
	 * Adds a change listener to the storage and returns a function to remove the listener.
	 * @param {cb} cb - The callback function to be called when the value changes
	 * @returns {() => void} The unsubscribe function
	 */
	public onChange(cb: (value: FiltersValue) => void): () => void {
		this.listeners.add(cb)
		// Return unsubscribe function
		return () => {
			this.listeners.delete(cb)
		}
	}
}
