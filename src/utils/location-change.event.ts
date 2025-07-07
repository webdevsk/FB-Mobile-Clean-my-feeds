// Modified from Source: wxt.dev

export interface LocationChangeDetail {
	newUrl: URL
	oldUrl: URL
}

/** Refers to the root window object. unsafeWindow in userscripts and window in other contexts */
const _window = unsafeWindow || window
const WATCHER_KEY = "__spa_locationchange_watcher__"

declare global {
	interface Window {
		[WATCHER_KEY]: boolean
	}
}

/**
 * Fires "spa:locationchange" event when url changes
 * @returns {Object} An object with a `run` method to start the location watcher.
 * @info "spa:locationchange" is a CustomEvent with a payload of {newUrl, oldUrl}
 * @example
 * ```ts
 * createLocationWatcher().run()
 *
 * window.addEventListener("spa:locationchange", (event) => {
 *   const { newUrl, oldUrl } = event.detail
 *   console.log("URL changed from", oldUrl.href, "to", newUrl.href)
 * })
 * ```
 */
export function createLocationWatcher() {
	let interval: number | null = null
	let oldUrl: URL | null = null
	console.log("watcher", _window[WATCHER_KEY])
	return {
		/**
		 * Ensure the location watcher is actively looking for URL changes. If it's already watching,
		 * this is a noop.
		 */
		run() {
			if (interval != null || _window[WATCHER_KEY] === true) return
			_window[WATCHER_KEY] = true
			oldUrl = new URL(location.href)
			interval = _window.setInterval(() => {
				const newUrl = new URL(location.href)
				if (oldUrl && newUrl.href !== oldUrl.href) {
					_window.dispatchEvent(
						new CustomEvent("spa:locationchange", {
							detail: { newUrl, oldUrl },
						})
					)
					oldUrl = newUrl
				}
			}, 1e3)
		},
	}
}

declare global {
	interface WindowEventMap {
		"spa:locationchange": CustomEvent<LocationChangeDetail>
	}
}
