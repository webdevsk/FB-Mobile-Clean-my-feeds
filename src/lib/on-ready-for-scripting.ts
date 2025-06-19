import { createLocationWatcher } from "@/utils/location-change.event"
import { watchForSelectors } from "@/utils/watch-for-selectors"
import { pathnameMatches, rootSelector } from ".."

type CallbackWithCleanupFn = () => () => void

export const onReadyForScripting = (cb: CallbackWithCleanupFn) => {
	// register "spa:locationchange" event
	createLocationWatcher().run()
	let ctrl = new AbortController()
	let cleanupFn: (() => void) | null = null

	const runWatcher = (cb: CallbackWithCleanupFn) => {
		watchForSelectors(
			[rootSelector],
			() => {
				cleanupFn = cb()
			},
			{ signal: ctrl.signal },
		)
	}

	// 1. Check if current page matches initially
	if (pathnameMatches.some(path => location.pathname === path)) {
		runWatcher(cb)
	}

	// 2. Listen for location changes
	window.addEventListener("spa:locationchange", () => {
		if (pathnameMatches.some(path => location.pathname === path)) {
			runWatcher(cb)
		} else {
			// 3. Cleanup if page doesn't match
			// Stop watcher
			ctrl.abort()

			// Renew signal as an aborted one cannot be reinitialized
			ctrl = new AbortController()
			ctrl.signal.throwIfAborted()
			// Cleanup functions such as DOM cleanup or stopping event listeners
			cleanupFn?.()
			cleanupFn = null
		}
	})
}
