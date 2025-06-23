export type WatchForSelectorOptions = {
	/** Abort signal to abort the watch. It also invokes the Invalidator/Cleanup function if returned from callback */
	signal?: AbortSignal
	/**
	 * Options for the observer
	 * @default
	 * ```typescript
	 * { childList: true, subtree: true }
	 * ```
	 */
	observerOptions?: MutationObserverInit
	/**
	 * Custom resolver function to determine when to run the callback
	 * @param elements Array of elements that match the selectors
	 * @returns boolean
	 * @example
	 * ```typescript
	 * watchForSelectors(["#a", "#b"], () => {
	 *   console.log("a and b are present")
	 * }, {
	 *   resolver: (elements) => elements.some((elm) => elm !== null) // Triggers when atleast one of the selectors is found
	 * })
	 * ```
	 * @example
	 * ```typescript
	 * watchForSelectors(["#a"], () => {
	 *   console.log("a says Hello World")
	 * }, {
	 *   resolver: ([element]) => element !== null && element.innerText === "Hello World" // Triggers when element is found and contains the text "Hello World"
	 * })
	 * ```
	 */
	resolver?: (elements: (Element | null)[]) => boolean
	/**
	 * Target node to observe on
	 * @default document
	 */
	target?: Node
}

type AbortWatcher = typeof MutationObserver.prototype.disconnect

/** Cleanup function */

export type WatchForSelectorCallback = () => void | PromiseLike<void>

/**
 * Watches for given selectors. Fires callback once all of them are found.
 *
 * You can set custom resolver function to determine when to run the callback in options.resolver
 * @param selectors Selectors to watch for
 * @param callback Callback to run when selectors are found
 * @param options Options for the watcher
 * @returns Function to disconnect the watcher
 * @example
 * ```typescript
 * watchForSelectors(["#a", "#b"], () => {
 *   console.log("a and b are present")
 * })
 * ```
 */
export function watchForSelectors(
	/** Selectors to watch for */
	selectors: readonly string[],
	/** Callback to run when selectors are found */
	callback: WatchForSelectorCallback,
	options: WatchForSelectorOptions = {}
): AbortWatcher {
	// Input checks
	if (!Array.isArray(selectors))
		throw new Error("watchForSelectors: Selectors must be an array")
	if (!callback || typeof callback !== "function")
		throw new Error("watchForSelectors: Callback must be a function")
	if (typeof options !== "object")
		throw new Error("watchForSelectors: Options must be an object")
	if ("resolver" in options && typeof options.resolver !== "function")
		throw new Error(
			"watchForSelectors: Resolver must be a function that resolves to boolean"
		)

	// Main logic
	const elements = selectors.map(selector =>
		document.querySelector<Element>(selector)
	)
	if (options.resolver?.(elements) ?? elements.every(elm => elm !== null)) {
		callback()
		return () => null
	}
	const observer = new MutationObserver((_, observer) => {
		const elements = selectors.map(selector =>
			document.querySelector<Element>(selector)
		)
		if (options.resolver?.(elements) ?? elements.every(elm => elm !== null)) {
			observer.disconnect()
			callback()
		}
	})
	observer.observe(
		options.target ?? document,
		options.observerOptions ?? { childList: true, subtree: true }
	)
	options.signal?.addEventListener(
		"abort",
		() => {
			observer.disconnect()
		},
		{ once: true }
	)
	return observer.disconnect.bind(observer)
}

/**
 * Watches for given selectors. Resolves once all of them are found.
 *
 * You can set custom resolver function to determine when to run the callback in options.resolver
 * @param selectors Selectors to watch for
 * @param options Options for the watcher
 * @param options.signal AbortSignal to abort the watcher. Rejects with "Aborted by signal" error
 * @returns Promise that resolves when found. Rejects when aborted
 */
export function watchForSelectorsPromise(
	/** Selector to watch for */
	selectors: readonly string[],
	options: WatchForSelectorOptions = {}
): Promise<void> {
	return new Promise((resolve, reject) => {
		watchForSelectors(selectors, resolve, options)
		options.signal?.addEventListener("abort", () =>
			reject(new Error("Aborted by signal"))
		)
	})
}

// Developed by [webdevsk](https://github.com/webdevsk)
