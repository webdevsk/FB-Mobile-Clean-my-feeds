import { devMode } from "@/config"

/**
 * A singleton class that manages a counter display showing the number of whitelisted and blacklisted items.
 * The counter is displayed in the top-right corner of the viewport and updates in real-time.
 * It's designed to provide visual feedback about content filtering operations.
 *
 * @example
 * // Get the BlockCounter instance
 * const counter = BlockCounter.getInstance();
 *
 * // Register the counter in the DOM
 * const cleanup = counter.register();
 *
 * // Increment counters
 * counter.increaseWhite(); // Increments whitelisted count
 * counter.increaseBlack(); // Increments blacklisted count
 *
 * // Clean up (remove from DOM)
 * cleanup();
 */
export class BlockCounter {
	private static instance: BlockCounter | null = null
	private elm: HTMLDivElement | null = null
	private whitelisted = 0
	private blacklisted = 0

	/**
	 * Private constructor to enforce singleton pattern.
	 * Use `BlockCounter.getInstance()` to get the instance.
	 */
	private constructor() {}

	/**
	 * Gets the singleton instance of BlockCounter.
	 * Creates a new instance if one doesn't exist.
	 *
	 * @returns {BlockCounter} The singleton BlockCounter instance
	 */
	public static getInstance(): BlockCounter {
		if (!BlockCounter.instance) {
			BlockCounter.instance = new BlockCounter()
		}
		return BlockCounter.instance
	}

	/**
	 * Registers the counter in the DOM if not already present.
	 * If the counter is already registered but not in the DOM, it will be reattached.
	 *
	 * @returns {() => void} A cleanup function that removes the counter from the DOM
	 */
	public register(): () => void {
		if (!this.elm) {
			this.elm = document.createElement("div")
			this.elm.id = "block-counter"
			document.body.appendChild(this.elm)
			if (devMode) console.log("block counter register successful")
		} else if (!document.body.contains(this.elm)) {
			document.body.appendChild(this.elm)
			if (devMode) console.log("block counter register successful")
		}

		this.render()
		return () => this.destroy()
	}

	/**
	 * Updates the counter display with current whitelisted and blacklisted counts.
	 * Called internally whenever the counts change.
	 */
	private render(): void {
		if (this.elm) {
			this.elm.innerHTML = `<p>Whitelisted: ${this.whitelisted}</p><p>Blacklisted: ${this.blacklisted}</p>`
		}
	}

	/**
	 * Removes the counter from the DOM.
	 * The counter instance and its counts are preserved for potential reuse.
	 */
	public destroy(): void {
		if (this.elm && document.body.contains(this.elm)) {
			this.elm.remove()
		}
	}

	/**
	 * Increments the whitelisted items counter and updates the display.
	 */
	public increaseWhite(): void {
		this.whitelisted += 1
		this.render()
	}

	/**
	 * Increments the blacklisted items counter and updates the display.
	 */
	public increaseBlack(): void {
		this.blacklisted += 1
		this.render()
	}
}
