import { devMode } from "@/config"

/**
 * A singleton class that manages a loading spinner UI element.
 * The spinner is displayed in the top-left corner of the viewport and can be shown/hidden on demand.
 * It's designed to indicate ongoing background operations to the user.
 *
 * @example
 * // Get the spinner instance
 * const spinner = Spinner.getInstance();
 *
 * // Register the spinner in the DOM
 * const cleanup = spinner.register();
 *
 * // Show the spinner
 * spinner.show();
 *
 * // Hide the spinner
 * spinner.hide();
 *
 * // Clean up (remove from DOM)
 * cleanup();
 */
export class Spinner {
	private static instance: Spinner | null = null
	private elm: HTMLDivElement | null = null
	private isVisible = false

	/**
	 * Private constructor to enforce singleton pattern.
	 * Use `Spinner.getInstance()` to get the instance.
	 */
	private constructor() {}

	/**
	 * Gets the singleton instance of the Spinner.
	 * Creates a new instance if one doesn't exist.
	 *
	 * @returns {Spinner} The singleton Spinner instance
	 */
	public static getInstance(): Spinner {
		if (!Spinner.instance) {
			Spinner.instance = new Spinner()
		}
		return Spinner.instance
	}

	/**
	 * Registers the spinner in the DOM if not already present.
	 * If the spinner is already registered but not in the DOM, it will be reattached.
	 *
	 * @returns {() => void} A cleanup function that removes the spinner from the DOM
	 */
	public register(): () => void {
		if (!this.elm) {
			this.elm = document.createElement("div")
			this.elm.id = "spinner"
			this.elm.innerHTML = `<div class="spinner small animated"></div>`
			document.body.appendChild(this.elm)
			if (devMode) console.log("Spinner register successful")
		} else if (!document.body.contains(this.elm)) {
			document.body.appendChild(this.elm)
			if (devMode) console.log("Spinner register successful")
		}
		return () => this.destroy()
	}

	/**
	 * Removes the spinner from the DOM.
	 * The spinner instance and its state are preserved for potential reuse.
	 */
	public destroy(): void {
		if (this.elm && document.body.contains(this.elm)) {
			this.elm.remove()
		}
	}

	/**
	 * Shows the spinner if it's currently hidden.
	 * The spinner will be displayed at the top-left corner of the viewport.
	 */
	public show(): void {
		this.isVisible = true
		if (this.elm) {
			this.elm.style.display = "block"
		}
	}

	/**
	 * Hides the spinner if it's currently visible.
	 * The spinner remains in the DOM but is not visible to the user.
	 */
	public hide(): void {
		this.isVisible = false
		if (this.elm) {
			this.elm.style.display = "none"
		}
	}
}
